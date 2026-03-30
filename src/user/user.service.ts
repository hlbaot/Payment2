import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/role/entities/role.entity';
import { Wallet, WalletDepositStatus } from 'src/wallet/entities/wallet.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const roleSet = await this.resolveRoles(createUserDto.roleIds);
    const user = this.userRepository.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: await bcrypt.hash(createUserDto.password, 10),
      phoneNumber: createUserDto.phoneNumber ?? null,
      country: createUserDto.country ?? null,
      isActive: createUserDto.isActive ?? true,
      roleSet,
    });

    const savedUser = await this.userRepository.save(user);
    await this.ensureWalletExists(savedUser.id);

    return this.findOne(savedUser.id);
  }

  async findAll() {
    return this.userRepository.find({
      relations: ['wallet'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRoleName(roleName: string) {
    const normalizedRoleName = roleName.trim().toUpperCase();

    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.wallet', 'wallet')
      .leftJoinAndSelect('user.roleSet', 'role')
      .where('UPPER(role.name) = :roleName', { roleName: normalizedRoleName })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      const duplicatedUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (duplicatedUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    if (updateUserDto.fullName !== undefined) {
      user.fullName = updateUserDto.fullName;
    }
    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.password !== undefined) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.phoneNumber !== undefined) {
      user.phoneNumber = updateUserDto.phoneNumber ?? null;
    }
    if (updateUserDto.country !== undefined) {
      user.country = updateUserDto.country ?? null;
    }
    if (updateUserDto.isActive !== undefined) {
      user.isActive = updateUserDto.isActive;
    }
    if (updateUserDto.roleIds !== undefined) {
      user.roleSet = await this.resolveRoles(updateUserDto.roleIds);
    }

    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
    const profileDto: UpdateUserDto = {
      fullName: updateUserDto.fullName,
      phoneNumber: updateUserDto.phoneNumber,
      country: updateUserDto.country,
    };

    return this.update(userId, profileDto);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { deleted: true, id };
  }

  private async resolveRoles(roleIds?: number[]): Promise<Role[]> {
    if (!roleIds?.length) {
      const defaultRole = await this.roleRepository.findOne({
        where: { name: 'USER' },
      });

      return defaultRole ? [defaultRole] : [];
    }

    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Some roles were not found');
    }

    return roles;
  }

  private async ensureWalletExists(userId: number): Promise<void> {
    const existingWallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (existingWallet) {
      return;
    }

    const wallet = this.walletRepository.create({
      userId,
      currency: 'VND',
      availableBalance: '0',
      holdBalance: '0',
      pendingDepositAmount: null,
      depositStatus: WalletDepositStatus.NONE,
      depositNote: null,
      lastDepositRequestedAt: null,
      lastDepositProcessedAt: null,
    });

    await this.walletRepository.save(wallet);
  }
}
