import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryCommissionReviewDto } from './dto/query-commission-review.dto';
import { ReviewCommissionDto } from './dto/review-commission.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DataSource, In, Repository } from 'typeorm';
import { CommissionStatus, Order, OrderStatus } from './entities/order.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Counter, CounterStatus } from 'src/counter/entities/counter.entity';
import { CounterService } from 'src/counter-service/entities/counter-service.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/entities/notification.entity';
import { OrderEventService } from 'src/order-event/order-event.service';
import { WalletTransactionService } from 'src/wallet-transaction/wallet-transaction.service';
import { WalletTransactionType } from 'src/wallet-transaction/entities/wallet-transaction.entity';

@Injectable()
export class OrderService {
  private readonly commissionVisibleStatuses = [
    CommissionStatus.PENDING,
    CommissionStatus.APPROVED,
    CommissionStatus.REJECTED,
  ];

  private readonly allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
      OrderStatus.VERIFYING,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
    ],
    [OrderStatus.VERIFYING]: [
      OrderStatus.PROCESSING,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
    ],
    [OrderStatus.PROCESSING]: [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
    ],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REJECTED]: [],
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    @InjectRepository(CounterService)
    private readonly counterServiceRepository: Repository<CounterService>,
    private readonly notificationService: NotificationService,
    private readonly walletTransactionService: WalletTransactionService,
    private readonly orderEventService: OrderEventService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const normalizedAmount = Number(createOrderDto.amount);

    if (!createOrderDto.amount || Number.isNaN(normalizedAmount)) {
      throw new BadRequestException('Amount is required');
    }

    if (normalizedAmount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const counter = await this.counterRepository.findOne({
      where: { id: createOrderDto.counterId },
    });
    if (!counter) {
      throw new NotFoundException('Counter not found');
    }
    if (counter.status !== CounterStatus.OPEN) {
      throw new BadRequestException('Counter is not available');
    }

    const service = await this.counterServiceRepository.findOne({
      where: { id: createOrderDto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Counter service not found');
    }
    if (!service.isActive) {
      throw new BadRequestException('Service is not active');
    }
    if (service.counterId !== counter.id) {
      throw new BadRequestException('Service does not belong to selected counter');
    }

    const minAmount = Number(counter.minAmount);
    if (normalizedAmount < minAmount) {
      throw new BadRequestException(
        `Amount must be at least ${counter.minAmount}`,
      );
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet for user ${userId} not found`);
      }

      const availableBalance = Number(wallet.availableBalance);
      const holdBalance = Number(wallet.holdBalance);

      if (availableBalance < normalizedAmount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      wallet.availableBalance = (availableBalance - normalizedAmount).toFixed(2);
      wallet.holdBalance = (holdBalance + normalizedAmount).toFixed(2);
      await manager.save(Wallet, wallet);

      const newOrder = manager.create(Order, {
        orderNo: this.generateOrderNo(),
        trackingCode: this.generateTrackingCode(),
        userId,
        counterId: counter.id,
        serviceId: service.id,
        amount: normalizedAmount.toFixed(2),
        totalAmount: normalizedAmount.toFixed(2),
        status: OrderStatus.PENDING,
      });

      return manager.save(Order, newOrder);
    });

    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });
    if (wallet) {
      await this.walletTransactionService.create({
        walletId: wallet.id,
        userId,
        type: WalletTransactionType.ORDER_HOLD,
        amount: normalizedAmount.toFixed(2),
        availableBalanceBefore: (
          Number(wallet.availableBalance) + normalizedAmount
        ).toFixed(2),
        availableBalanceAfter: wallet.availableBalance,
        holdBalanceBefore: (
          Number(wallet.holdBalance) - normalizedAmount
        ).toFixed(2),
        holdBalanceAfter: wallet.holdBalance,
        referenceType: 'order',
        referenceId: order.id,
        note: `Funds held for order ${order.orderNo}`,
      });
    }

    await this.orderEventService.create(
      order.id,
      OrderStatus.PENDING,
      'Order created',
    );

    await this.notificationService.create({
      userId,
      type: NotificationType.ORDER_CREATED,
      title: 'Order created successfully',
      message: `Your order ${order.orderNo} has been created and is waiting for processing.`,
      referenceType: 'order',
      referenceId: order.id,
    });

    return this.findOne(order.id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'counter', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForAdmin(filters: {
    status?: OrderStatus;
    userId?: number;
    counterId?: number;
    commissionStatus?: CommissionStatus;
  }): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.counterId ? { counterId: filters.counterId } : {}),
        ...(filters.commissionStatus
          ? { commissionStatus: filters.commissionStatus }
          : {}),
      },
      relations: ['user', 'counter', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSupporterQueue(): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: In([
          OrderStatus.PENDING,
          OrderStatus.VERIFYING,
          OrderStatus.PROCESSING,
        ]),
      },
      relations: ['user', 'counter', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['counter', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'counter', 'service'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async findOneForUser(
    id: number,
    userId: number,
    roles: string[] = [],
  ): Promise<Order> {
    const order = await this.findOne(id);
    const normalizedRoles = roles.map((role) => role.toUpperCase());

    if (normalizedRoles.includes('ADMIN')) {
      return order;
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  async findTimelineForRequester(
    id: number,
    userId: number,
    roles: string[] = [],
  ) {
    await this.findOneForUser(id, userId, roles);
    return this.orderEventService.findByOrderId(id);
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.counterId !== undefined) {
      order.counterId = updateOrderDto.counterId;
    }
    if (updateOrderDto.serviceId !== undefined) {
      order.serviceId = updateOrderDto.serviceId;
    }
    if (updateOrderDto.amount !== undefined) {
      order.amount = updateOrderDto.amount;
    }
    if (updateOrderDto.totalAmount !== undefined) {
      order.totalAmount = updateOrderDto.totalAmount;
    }

    return this.orderRepository.save(order);
  }

  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);
    const nextStatus = updateOrderStatusDto.status;

    if (!nextStatus) {
      throw new BadRequestException('Status is required');
    }

    if (order.status === nextStatus) {
      throw new BadRequestException('Order is already in this status');
    }

    const allowedNextStatuses = this.allowedStatusTransitions[order.status] ?? [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change order status from ${order.status} to ${nextStatus}`,
      );
    }

    const totalAmount = Number(order.totalAmount);
    const shouldRefund =
      nextStatus === OrderStatus.CANCELLED || nextStatus === OrderStatus.REJECTED;

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId: order.userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet for user ${order.userId} not found`);
      }

      const availableBalance = Number(wallet.availableBalance);
      const holdBalance = Number(wallet.holdBalance);

      if (holdBalance < totalAmount) {
        throw new BadRequestException(
          `Wallet hold balance is not enough to settle order ${order.orderNo}`,
        );
      }

      if (shouldRefund) {
        wallet.availableBalance = (availableBalance + totalAmount).toFixed(2);
      }

      wallet.holdBalance = (holdBalance - totalAmount).toFixed(2);
      await manager.save(Wallet, wallet);

      order.status = nextStatus;

      if (nextStatus === OrderStatus.COMPLETED) {
        const commissionRate = Number(order.service?.commissionRate ?? 0);

        order.completedAt = new Date();
        order.commissionRateSnapshot = commissionRate.toFixed(2);
        order.commissionAmount = this.calculateCommissionAmount(
          totalAmount,
          commissionRate,
        );
        order.commissionStatus = CommissionStatus.PENDING;
        order.commissionReviewedAt = null;
        order.commissionRejectReason = null;
      }

      return manager.save(Order, order);
    });

    await this.notificationService.create({
      userId: savedOrder.userId,
      type: this.mapOrderStatusToNotificationType(nextStatus),
      title: this.buildStatusTitle(savedOrder.orderNo, nextStatus),
      message: this.buildStatusMessage(savedOrder.orderNo, nextStatus),
      referenceType: 'order',
      referenceId: savedOrder.id,
    });

    await this.orderEventService.create(
      savedOrder.id,
      nextStatus,
      this.buildStatusMessage(savedOrder.orderNo, nextStatus),
    );

    if (shouldRefund) {
      const updatedWallet = await this.walletRepository.findOne({
        where: { userId: savedOrder.userId },
      });

      if (updatedWallet) {
        await this.walletTransactionService.create({
          walletId: updatedWallet.id,
          userId: savedOrder.userId,
          type: WalletTransactionType.ORDER_REFUND,
          amount: savedOrder.totalAmount,
          availableBalanceBefore: (
            Number(updatedWallet.availableBalance) - Number(savedOrder.totalAmount)
          ).toFixed(2),
          availableBalanceAfter: updatedWallet.availableBalance,
          holdBalanceBefore: (
            Number(updatedWallet.holdBalance) + Number(savedOrder.totalAmount)
          ).toFixed(2),
          holdBalanceAfter: updatedWallet.holdBalance,
          referenceType: 'order',
          referenceId: savedOrder.id,
          note: `Refund for order ${savedOrder.orderNo}`,
        });
      }

      await this.notificationService.create({
        userId: savedOrder.userId,
        type: NotificationType.REFUND_ADDED,
        title: `Refund added for order ${savedOrder.orderNo}`,
        message: `The amount ${savedOrder.totalAmount} has been returned to your available balance.`,
        referenceType: 'order',
        referenceId: savedOrder.id,
      });
    }

    if (nextStatus === OrderStatus.COMPLETED) {
      const updatedWallet = await this.walletRepository.findOne({
        where: { userId: savedOrder.userId },
      });

      if (updatedWallet) {
        await this.walletTransactionService.create({
          walletId: updatedWallet.id,
          userId: savedOrder.userId,
          type: WalletTransactionType.ORDER_SETTLED,
          amount: savedOrder.totalAmount,
          availableBalanceBefore: updatedWallet.availableBalance,
          availableBalanceAfter: updatedWallet.availableBalance,
          holdBalanceBefore: (
            Number(updatedWallet.holdBalance) + Number(savedOrder.totalAmount)
          ).toFixed(2),
          holdBalanceAfter: updatedWallet.holdBalance,
          referenceType: 'order',
          referenceId: savedOrder.id,
          note: `Held funds settled for order ${savedOrder.orderNo}`,
        });
      }
    }

    return this.findOne(savedOrder.id);
  }

  async getCommissionReviewList(
    query: QueryCommissionReviewDto,
  ): Promise<
    Array<{
      userId: number;
      email: string;
      fullName: string | null;
      walletBalance: string;
      totalOrders: number;
      totalCommission: string;
      commissionStatus: CommissionStatus | 'mixed';
      statusCounts: Record<CommissionStatus, number>;
      latestCompletedAt: Date | null;
    }>
  > {
    const normalizedStatus = this.normalizeCommissionStatusFilter(query.status);
    const where =
      normalizedStatus === 'all'
        ? {
            status: OrderStatus.COMPLETED,
            commissionStatus: In(this.commissionVisibleStatuses),
          }
        : {
            status: OrderStatus.COMPLETED,
            commissionStatus: normalizedStatus,
          };

    const orders = await this.orderRepository.find({
      where,
      relations: ['user', 'counter', 'service'],
      order: {
        completedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (!orders.length) {
      return [];
    }

    const userIds = [...new Set(orders.map((order) => order.userId))];
    const wallets = await this.walletRepository.find({
      where: { userId: In(userIds) },
    });
    const walletMap = new Map(wallets.map((wallet) => [wallet.userId, wallet]));

    const grouped = new Map<number, (typeof orders)[number][]>();
    for (const order of orders) {
      const existing = grouped.get(order.userId) ?? [];
      existing.push(order);
      grouped.set(order.userId, existing);
    }

    return [...grouped.values()]
      .map((userOrders) => {
        const firstOrder = userOrders[0];
        const wallet = walletMap.get(firstOrder.userId);
        const totalCommission = userOrders.reduce(
          (sum, current) => sum + Number(current.commissionAmount ?? 0),
          0,
        );
        const statusCounts: Record<CommissionStatus, number> = {
          [CommissionStatus.NONE]: 0,
          [CommissionStatus.PENDING]: 0,
          [CommissionStatus.APPROVED]: 0,
          [CommissionStatus.REJECTED]: 0,
        };

        for (const order of userOrders) {
          statusCounts[order.commissionStatus] += 1;
        }

        return {
          userId: firstOrder.userId,
          email: firstOrder.user?.email ?? '',
          fullName: firstOrder.user?.fullName ?? null,
          walletBalance: wallet?.availableBalance ?? '0.00',
          totalOrders: userOrders.length,
          totalCommission: totalCommission.toFixed(2),
          commissionStatus: this.buildCommissionSummaryStatus(userOrders),
          statusCounts,
          latestCompletedAt:
            userOrders
              .map((order) => order.completedAt)
              .filter((value): value is Date => value instanceof Date)
              .sort((left, right) => right.getTime() - left.getTime())[0] ??
            null,
        };
      })
      .sort(
        (left, right) =>
          (right.latestCompletedAt?.getTime() ?? 0) -
          (left.latestCompletedAt?.getTime() ?? 0),
      );
  }

  async getCommissionReviewDetail(
    userId: number,
    query: QueryCommissionReviewDto,
  ): Promise<{
    userId: number;
    email: string;
    fullName: string | null;
    walletBalance: string;
    totalCommission: string;
    commissionStatus: CommissionStatus | 'mixed';
    counters: Array<{
      counterId: number;
      counterCode: string;
      counterName: string;
      totalCommission: string;
      totalOrders: number;
      orders: Array<{
        id: number;
        orderNo: string;
        trackingCode: string | null;
        amount: string;
        totalAmount: string;
        commissionAmount: string;
        commissionRateSnapshot: string | null;
        commissionStatus: CommissionStatus;
        completedAt: Date | null;
        serviceId: number;
        serviceName: string | null;
      }>;
    }>;
  }> {
    const normalizedStatus = this.normalizeCommissionStatusFilter(query.status);
    const where =
      normalizedStatus === 'all'
        ? {
            userId,
            status: OrderStatus.COMPLETED,
            commissionStatus: In(this.commissionVisibleStatuses),
          }
        : {
            userId,
            status: OrderStatus.COMPLETED,
            commissionStatus: normalizedStatus,
          };

    const orders = await this.orderRepository.find({
      where,
      relations: ['user', 'counter', 'service'],
      order: {
        completedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (!orders.length) {
      throw new NotFoundException(
        `No completed orders found for user ${userId} in commission review`,
      );
    }

    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });
    const firstOrder = orders[0];
    const groupedCounters = new Map<number, (typeof orders)[number][]>();

    for (const order of orders) {
      const existing = groupedCounters.get(order.counterId) ?? [];
      existing.push(order);
      groupedCounters.set(order.counterId, existing);
    }

    return {
      userId,
      email: firstOrder.user?.email ?? '',
      fullName: firstOrder.user?.fullName ?? null,
      walletBalance: wallet?.availableBalance ?? '0.00',
      totalCommission: orders
        .reduce((sum, current) => sum + Number(current.commissionAmount ?? 0), 0)
        .toFixed(2),
      commissionStatus: this.buildCommissionSummaryStatus(orders),
      counters: [...groupedCounters.entries()].map(([counterId, counterOrders]) => {
        const firstCounterOrder = counterOrders[0];

        return {
          counterId,
          counterCode: firstCounterOrder.counter?.code ?? '',
          counterName:
            firstCounterOrder.counter?.name ?? `Counter ${counterId}`,
          totalCommission: counterOrders
            .reduce(
              (sum, current) => sum + Number(current.commissionAmount ?? 0),
              0,
            )
            .toFixed(2),
          totalOrders: counterOrders.length,
          orders: counterOrders.map((order) => ({
            id: order.id,
            orderNo: order.orderNo,
            trackingCode: order.trackingCode,
            amount: order.amount,
            totalAmount: order.totalAmount,
            commissionAmount: order.commissionAmount ?? '0.00',
            commissionRateSnapshot: order.commissionRateSnapshot,
            commissionStatus: order.commissionStatus,
            completedAt: order.completedAt,
            serviceId: order.serviceId,
            serviceName: order.service?.name ?? null,
          })),
        };
      }),
    };
  }

  async approveCommissionReview(
    userId: number,
    reviewCommissionDto: ReviewCommissionDto,
  ): Promise<{
    userId: number;
    totalCommissionAdded: string;
    processedOrderIds: number[];
  }> {
    const orders = await this.findCommissionOrdersForReview(
      userId,
      CommissionStatus.PENDING,
      reviewCommissionDto.orderIds,
    );

    const totalCommission = orders.reduce(
      (sum, current) => sum + Number(current.commissionAmount ?? 0),
      0,
    );

    if (totalCommission <= 0) {
      throw new BadRequestException('Selected orders do not have commission to add');
    }

    await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet for user ${userId} not found`);
      }

      wallet.availableBalance = (
        Number(wallet.availableBalance) + totalCommission
      ).toFixed(2);
      await manager.save(Wallet, wallet);

      for (const order of orders) {
        order.commissionStatus = CommissionStatus.APPROVED;
        order.commissionReviewedAt = new Date();
        order.commissionRejectReason = null;
      }

      await manager.save(Order, orders);
    });

    await this.notificationService.create({
      userId,
      type: NotificationType.COMMISSION_ADDED,
      title: 'Commission approved',
      message: `Your commission of ${totalCommission.toFixed(2)} has been added to your wallet.`,
      referenceType: 'commission_review',
      referenceId: orders[0]?.id ?? null,
    });

    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });
    if (wallet) {
      await this.walletTransactionService.create({
        walletId: wallet.id,
        userId,
        type: WalletTransactionType.COMMISSION_ADDED,
        amount: totalCommission.toFixed(2),
        availableBalanceBefore: (
          Number(wallet.availableBalance) - totalCommission
        ).toFixed(2),
        availableBalanceAfter: wallet.availableBalance,
        holdBalanceBefore: wallet.holdBalance,
        holdBalanceAfter: wallet.holdBalance,
        referenceType: 'commission_review',
        referenceId: orders[0]?.id ?? null,
        note: 'Commission approved by admin',
      });
    }

    return {
      userId,
      totalCommissionAdded: totalCommission.toFixed(2),
      processedOrderIds: orders.map((order) => order.id),
    };
  }

  async rejectCommissionReview(
    userId: number,
    reviewCommissionDto: ReviewCommissionDto,
  ): Promise<{
    userId: number;
    rejectedOrderIds: number[];
    reason: string | null;
  }> {
    const orders = await this.findCommissionOrdersForReview(
      userId,
      CommissionStatus.PENDING,
      reviewCommissionDto.orderIds,
    );

    const reviewedAt = new Date();
    for (const order of orders) {
      order.commissionStatus = CommissionStatus.REJECTED;
      order.commissionReviewedAt = reviewedAt;
      order.commissionRejectReason = reviewCommissionDto.reason?.trim() ?? null;
    }

    await this.orderRepository.save(orders);

    await this.notificationService.create({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Commission rejected',
      message:
        reviewCommissionDto.reason?.trim() ||
        'Your commission review request has been rejected by admin.',
      referenceType: 'commission_review',
      referenceId: orders[0]?.id ?? null,
    });

    return {
      userId,
      rejectedOrderIds: orders.map((order) => order.id),
      reason: reviewCommissionDto.reason?.trim() ?? null,
    };
  }

  async remove(id: number) {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    return { deleted: true, id };
  }

  private generateOrderNo(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private generateTrackingCode(): string {
    return `TRK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private calculateCommissionAmount(
    totalAmount: number,
    commissionRate: number,
  ): string {
    return ((totalAmount * commissionRate) / 100).toFixed(2);
  }

  private normalizeCommissionStatusFilter(
    status?: QueryCommissionReviewDto['status'],
  ): CommissionStatus | 'all' {
    if (!status || status === 'all') {
      return 'all';
    }

    if (!this.commissionVisibleStatuses.includes(status)) {
      throw new BadRequestException(`Unsupported commission status: ${status}`);
    }

    return status;
  }

  private buildCommissionSummaryStatus(
    orders: Order[],
  ): CommissionStatus | 'mixed' {
    const uniqueStatuses = [...new Set(orders.map((order) => order.commissionStatus))];

    if (uniqueStatuses.length === 1) {
      return uniqueStatuses[0];
    }

    return 'mixed';
  }

  private async findCommissionOrdersForReview(
    userId: number,
    commissionStatus: CommissionStatus,
    orderIds?: number[],
  ): Promise<Order[]> {
    const requestedOrderIds = [...new Set(orderIds ?? [])];
    const where = {
      userId,
      status: OrderStatus.COMPLETED,
      commissionStatus,
      ...(requestedOrderIds.length ? { id: In(requestedOrderIds) } : {}),
    };

    const orders = await this.orderRepository.find({
      where,
      relations: ['user', 'counter', 'service'],
      order: {
        completedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (!orders.length) {
      throw new NotFoundException('No eligible orders found for commission review');
    }

    if (requestedOrderIds.length && orders.length !== requestedOrderIds.length) {
      throw new BadRequestException(
        'Some selected orders are not eligible for this commission action',
      );
    }

    return orders;
  }

  private mapOrderStatusToNotificationType(
    status: OrderStatus,
  ): NotificationType {
    switch (status) {
      case OrderStatus.VERIFYING:
        return NotificationType.ORDER_VERIFYING;
      case OrderStatus.PROCESSING:
        return NotificationType.ORDER_PROCESSING;
      case OrderStatus.COMPLETED:
        return NotificationType.ORDER_COMPLETED;
      case OrderStatus.CANCELLED:
        return NotificationType.ORDER_CANCELLED;
      case OrderStatus.REJECTED:
        return NotificationType.ORDER_REJECTED;
      case OrderStatus.PENDING:
      default:
        return NotificationType.ORDER_CREATED;
    }
  }

  private buildStatusTitle(orderNo: string, status: OrderStatus): string {
    switch (status) {
      case OrderStatus.VERIFYING:
        return `Order ${orderNo} is being verified`;
      case OrderStatus.PROCESSING:
        return `Order ${orderNo} is processing`;
      case OrderStatus.COMPLETED:
        return `Order ${orderNo} completed`;
      case OrderStatus.CANCELLED:
        return `Order ${orderNo} cancelled`;
      case OrderStatus.REJECTED:
        return `Order ${orderNo} rejected`;
      case OrderStatus.PENDING:
      default:
        return `Order ${orderNo} updated`;
    }
  }

  private buildStatusMessage(orderNo: string, status: OrderStatus): string {
    switch (status) {
      case OrderStatus.VERIFYING:
        return `Your order ${orderNo} is being verified by the support team.`;
      case OrderStatus.PROCESSING:
        return `Your order ${orderNo} is now being processed.`;
      case OrderStatus.COMPLETED:
        return `Your order ${orderNo} has been completed successfully.`;
      case OrderStatus.CANCELLED:
        return `Your order ${orderNo} has been cancelled.`;
      case OrderStatus.REJECTED:
        return `Your order ${orderNo} has been rejected.`;
      case OrderStatus.PENDING:
      default:
        return `Your order ${orderNo} status has been updated.`;
    }
  }
}
