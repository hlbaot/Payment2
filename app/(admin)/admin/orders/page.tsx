'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminScaffold from '@/components/admin/AdminScaffold';
import { useI18n } from '@/components/I18nProvider';

type AdminOrder = {
  id: string;
  time: string;
  user: string;
  email: string;
  wallet: string;
  orderName: string;
  commission: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

type CounterDetailItem = {
  id: string;
  orderLabel: string;
  commission: string;
};

type OrderDetailModalData = {
  counterName: string;
  items: CounterDetailItem[];
};

const initialOrders: AdminOrder[] = [
  {
    id: '#TXN-94021',
    time: 'Oct 19, 14:22',
    user: 'Alex Rivera',
    email: 'arivera@example.com',
    wallet: '$18,500.00',
    orderName: 'US Fast Transfer',
    commission: '$272.80',
    status: 'Pending',
  },
  {
    id: '#TXN-93992',
    time: 'Oct 19, 09:44',
    user: 'Marcus Thorne',
    email: 'm.thorne@vortex.io',
    wallet: '$62,000.00',
    orderName: 'Swift Payment',
    commission: '$1,250.00',
    status: 'Pending',
  },
  {
    id: '#TXN-93850',
    time: 'Oct 18, 16:10',
    user: 'Sarah Jenkins',
    email: 's.jenkins@corp.com',
    wallet: '$9,400.00',
    orderName: 'UK Bill Payment',
    commission: '$46.50',
    status: 'Pending',
  },
  {
    id: '#TXN-93774',
    time: 'Oct 18, 11:25',
    user: 'Daniel Brooks',
    email: 'd.brooks@finexa.io',
    wallet: '$27,300.00',
    orderName: 'Corporate Settlement',
    commission: '$318.00',
    status: 'Pending',
  },
  {
    id: '#TXN-93712',
    time: 'Oct 17, 18:40',
    user: 'Mina Carter',
    email: 'm.carter@lunex.co',
    wallet: '$41,750.00',
    orderName: 'Priority Remittance',
    commission: '$522.00',
    status: 'Pending',
  },
  {
    id: '#TXN-93644',
    time: 'Oct 17, 10:05',
    user: 'Owen Hughes',
    email: 'o.hughes@northgate.com',
    wallet: '$13,920.00',
    orderName: 'Invoice Transfer',
    commission: '$96.40',
    status: 'Pending',
  },
];

const orderDetailsById: Record<string, OrderDetailModalData[]> = {
  '#TXN-94021': [
    {
      counterName: 'Counter 1',
      items: [
        { id: 'A1', orderLabel: 'US Fast Transfer', commission: '$120.00' },
        { id: 'A2', orderLabel: 'Express Wallet Topup', commission: '$152.80' },
      ],
    },
    {
      counterName: 'Counter 2',
      items: [
        { id: 'A3', orderLabel: 'Swift Payment', commission: '$84.00' },
      ],
    },
    {
      counterName: 'Counter 3',
      items: [
        { id: 'A4', orderLabel: 'Global Payout', commission: '$68.50' },
      ],
    },
  ],
  '#TXN-93992': [
    {
      counterName: 'Counter 1',
      items: [
        { id: 'B1', orderLabel: 'Swift Payment', commission: '$650.00' },
      ],
    },
    {
      counterName: 'Counter 2',
      items: [
        { id: 'B2', orderLabel: 'High Value Transfer', commission: '$400.00' },
        { id: 'B3', orderLabel: 'Priority Settlement', commission: '$200.00' },
      ],
    },
    {
      counterName: 'Counter 3',
      items: [
        { id: 'B4', orderLabel: 'FX Adjustment', commission: '$35.00' },
      ],
    },
  ],
  '#TXN-93850': [
    {
      counterName: 'Counter 1',
      items: [
        { id: 'C1', orderLabel: 'UK Bill Payment', commission: '$20.00' },
      ],
    },
    {
      counterName: 'Counter 2',
      items: [
        { id: 'C2', orderLabel: 'Invoice Settlement', commission: '$16.50' },
      ],
    },
    {
      counterName: 'Counter 3',
      items: [
        { id: 'C3', orderLabel: 'Utility Checkout', commission: '$10.00' },
      ],
    },
  ],
  '#TXN-93774': [
    {
      counterName: 'Counter 1',
      items: [
        { id: 'D1', orderLabel: 'Corporate Settlement', commission: '$180.00' },
      ],
    },
    {
      counterName: 'Counter 2',
      items: [
        { id: 'D2', orderLabel: 'Escrow Release', commission: '$88.00' },
        { id: 'D3', orderLabel: 'Compliance Review', commission: '$50.00' },
      ],
    },
    {
      counterName: 'Counter 3',
      items: [],
    },
  ],
  '#TXN-93712': [
    {
      counterName: 'Counter 1',
      items: [
        { id: 'E1', orderLabel: 'Priority Remittance', commission: '$240.00' },
      ],
    },
    {
      counterName: 'Counter 2',
      items: [
        { id: 'E2', orderLabel: 'Partner Settlement', commission: '$160.00' },
      ],
    },
    {
      counterName: 'Counter 3',
      items: [
        { id: 'E3', orderLabel: 'FX Reserve', commission: '$122.00' },
      ],
    },
  ],
  '#TXN-93644': [
    {
      counterName: 'Counter 1',
      items: [
        { id: 'F1', orderLabel: 'Invoice Transfer', commission: '$44.00' },
      ],
    },
    {
      counterName: 'Counter 2',
      items: [
        { id: 'F2', orderLabel: 'Document Verification', commission: '$22.40' },
        { id: 'F3', orderLabel: 'Clearing Fee', commission: '$30.00' },
      ],
    },
    {
      counterName: 'Counter 3',
      items: [],
    },
  ],
};

export default function AdminOrdersPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState(orderDetailsById);
  const [highlightedWalletId, setHighlightedWalletId] = useState<string | null>(null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [walletDraft, setWalletDraft] = useState('');
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [commissionDraft, setCommissionDraft] = useState('');
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const [detailCommissionDraft, setDetailCommissionDraft] = useState('');
  const [stoppedItemIds, setStoppedItemIds] = useState<string[]>([]);
  const [lockedEmails, setLockedEmails] = useState<string[]>([]);

  const parseCurrency = (value: string) => Number(value.replace(/[^0-9.]+/g, '')) || 0;
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    if (!highlightedWalletId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedWalletId(null);
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedWalletId]);

  const updateOrderWallet = (orderId: string, amount: number) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, wallet: formatCurrency(parseCurrency(order.wallet) + amount) }
          : order
      )
    );
  };

  const setOrderWallet = (orderId: string, amount: number) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, wallet: formatCurrency(amount) }
          : order
      )
    );
  };

  const getOrderCommissionTotal = (orderId: string) =>
    (detailData[orderId] ?? []).reduce(
      (total, counter) =>
        total +
        counter.items.reduce((counterTotal, item) => counterTotal + parseCurrency(item.commission), 0),
      0
    );

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query
        ? true
        : [order.id, order.user, order.email, order.orderName].some((value) =>
            value.toLowerCase().includes(query)
          );
      const matchesStatus = statusFilter === 'ALL' ? true : order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const orderCounts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === 'Pending').length,
      approved: orders.filter((order) => order.status === 'Approved').length,
      rejected: orders.filter((order) => order.status === 'Rejected').length,
    }),
    [orders]
  );

  const updateStatus = (ids: string[], status: 'Approved' | 'Rejected') => {
    setOrders((current) =>
      current.map((order) =>
        ids.includes(order.id) ? { ...order, status } : order
      )
    );
  };

  const removeDetailItem = (orderId: string, itemId: string) => {
    setDetailData((current) => ({
      ...current,
      [orderId]: (current[orderId] ?? []).map((counter) => ({
        ...counter,
        items: counter.items.filter((item) => item.id !== itemId),
      })),
    }));
  };

  const handleRejectDetail = (orderId: string, itemId: string) => {
    removeDetailItem(orderId, itemId);
  };

  const handleAcceptOrder = (orderId: string) => {
    const commissionTotal = getOrderCommissionTotal(orderId);
    if (commissionTotal <= 0) {
      return;
    }

    updateOrderWallet(orderId, commissionTotal);
    setHighlightedWalletId(orderId);
    updateStatus([orderId], 'Approved');
  };

  const handleRejectOrder = (orderId: string) => {
    updateStatus([orderId], 'Rejected');
  };

  const handleStartWalletEdit = (orderId: string, currentWallet: string) => {
    setEditingWalletId(orderId);
    setWalletDraft(parseCurrency(currentWallet).toString());
  };

  const handleCancelWalletEdit = () => {
    setEditingWalletId(null);
    setWalletDraft('');
  };

  const handleSaveWalletEdit = (orderId: string) => {
    setOrderWallet(orderId, parseCurrency(walletDraft));
    setHighlightedWalletId(orderId);
    setEditingWalletId(null);
    setWalletDraft('');
  };

  const handleStartCommissionEdit = (order: AdminOrder) => {
    setEditingCommissionId(order.id);
    setCommissionDraft(getDisplayedCommissionTotal(order).toString());
  };

  const handleCancelCommissionEdit = () => {
    setEditingCommissionId(null);
    setCommissionDraft('');
  };

  const handleSaveCommissionEdit = (orderId: string) => {
    const newCommission = parseCurrency(commissionDraft);
    
    // To 'adjust' the commission, we'll replace the items with a single 'Adjustment' item
    // or we could overwrite the 'commission' field in AdminOrder if it wasn't calculated.
    // Since it's calculated from detailData, let's update detailData.
    setDetailData((current) => ({
      ...current,
      [orderId]: [
        {
          counterName: 'Quản trị hệ thống',
          items: [
            { id: `ADJ-${Date.now()}`, orderLabel: 'Điều chỉnh hoa hồng', commission: formatCurrency(newCommission) }
          ]
        }
      ]
    }));

    setEditingCommissionId(null);
    setCommissionDraft('');
  };

  const handleStartDetailEdit = (item: CounterDetailItem) => {
    setEditingDetailId(item.id);
    setDetailCommissionDraft(parseCurrency(item.commission).toString());
  };

  const handleCancelDetailEdit = () => {
    setEditingDetailId(null);
    setDetailCommissionDraft('');
  };

  const handleSaveDetailEdit = (orderId: string, itemId: string) => {
    const newCommissionValue = formatCurrency(parseCurrency(detailCommissionDraft));
    
    setDetailData((current) => ({
      ...current,
      [orderId]: (current[orderId] ?? []).map((counter) => ({
        ...counter,
        items: counter.items.map((item) => 
          item.id === itemId ? { ...item, commission: newCommissionValue } : item
        ),
      })),
    }));

    setEditingDetailId(null);
    setDetailCommissionDraft('');
  };

  const toggleLockEmail = (email: string) => {
    setLockedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const deleteOrder = (orderId: string) => {
    if (window.confirm(t('adminOrders.deleteConfirm') || 'Bạn có chắc chắn muốn xóa bản ghi này?')) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const activeOrderDetails = activeOrderId
    ? (detailData[activeOrderId] ?? []).filter((counter) => counter.items.length > 0)
    : [];
  const activeOrderCommissionTotal = activeOrderId ? getOrderCommissionTotal(activeOrderId) : 0;
  const getDisplayedCommissionTotal = (order: AdminOrder) =>
    order.status === 'Approved' ? 0 : getOrderCommissionTotal(order.id);
  const getStatusLabel = (status: AdminOrder['status']) =>
    status === 'Approved'
      ? t('adminOrders.accepted')
      : status === 'Rejected'
        ? t('adminOrders.rejected')
        : t('adminOrders.pending');
  const activeOrderStatus = activeOrderId
    ? orders.find((order) => order.id === activeOrderId)?.status ?? 'Pending'
    : 'Pending';

  return (
    <AdminScaffold
      searchPlaceholder={t('adminOrders.searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex w-full justify-center">
        <div className="w-full max-w-[1280px] overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_rgba(17,24,39,0.05)]">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`inline-flex min-h-[40px] items-center rounded-xl px-4 text-[14px] font-bold transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#F3F5F8] text-[#63748C]'
                    : 'bg-white text-[#94A3B8] hover:bg-[#F8FAFC]'
                }`}
              >
                {t('adminOrders.all')} ({orderCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Pending')}
                className={`inline-flex min-h-[40px] items-center rounded-xl px-4 text-[14px] font-bold transition-colors ${
                  statusFilter === 'Pending'
                    ? 'bg-[#FFF4DB] text-[#D97706]'
                    : 'bg-white text-[#D97706] hover:bg-[#FFF8E8]'
                }`}
              >
                {t('adminOrders.waiting')} ({orderCounts.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Rejected')}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-[14px] font-bold transition-colors ${
                  statusFilter === 'Rejected'
                    ? 'bg-[#FFF1F2] text-[#E11D48]'
                    : 'bg-white text-[#E11D48] hover:bg-[#FFF5F6]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {t('adminOrders.reject')} ({orderCounts.rejected})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Approved')}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-[14px] font-bold transition-colors ${
                  statusFilter === 'Approved'
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : 'bg-white text-[#16A34A] hover:bg-[#F0FDF4]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 9 11 14 8 11" />
                </svg>
                {t('adminOrders.accept')} ({orderCounts.approved})
              </button>
            </div>

            <p className="text-[14px] font-medium text-[#8EA0BC]">
              {t('adminOrders.helper')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#FBFCFE] text-center">
                <tr className="text-[12px] font-black uppercase tracking-[0.16em] text-[#8EA0BC]">
                  <th className="px-6 py-5 text-center">{t('adminOrders.email')}</th>
                  <th className="px-6 py-5 text-center">{t('adminOrders.wallet')}</th>
                  <th className="px-6 py-5 text-center">{t('adminOrders.orderName')}</th>
                  <th className="px-6 py-5 text-center">{t('adminOrders.commission')}</th>
                  <th className="px-6 py-5 text-center">{t('adminOrders.status')}</th>
                  <th className="px-6 py-5 text-center">{t('adminOrders.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={`border-t border-gray-100 transition-opacity ${lockedEmails.includes(order.email) ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="group/email relative flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[16px] font-bold ${lockedEmails.includes(order.email) ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {order.email}
                          </p>
                          <p className="mt-1 text-[12px] font-medium text-[#9AA7BD]">
                            {order.user}
                            {lockedEmails.includes(order.email) && (
                              <span className="ml-2 inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                                Đã khóa
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleLockEmail(order.email)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                              lockedEmails.includes(order.email)
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-[#FFF4DB] text-[#D97706] hover:bg-amber-500 hover:text-white'
                            }`}
                            title={lockedEmails.includes(order.email) ? "Mở khóa" : "Khóa tài khoản"}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              {lockedEmails.includes(order.email) ? (
                                <>
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </>
                              ) : (
                                <>
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </>
                              )}
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteOrder(order.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626] transition-all hover:bg-[#DC2626] hover:text-white"
                            title="Xóa tài khoản/đơn"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {editingWalletId === order.id ? (
                        <div className="flex flex-col items-start gap-3">
                          <input
                            type="text"
                            value={walletDraft}
                            onChange={(event) => setWalletDraft(event.target.value)}
                            className="h-[44px] w-[180px] rounded-xl border border-[#E5E7EB] bg-white px-4 text-[16px] font-bold text-gray-900 outline-none transition-colors focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelWalletEdit}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-[#F3F4F6] px-3 text-[12px] font-bold text-[#64748B] transition-colors hover:bg-[#E5E7EB]"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveWalletEdit(order.id)}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-primary px-3 text-[12px] font-bold text-white transition-colors hover:opacity-90"
                            >
                              {t('common.save')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartWalletEdit(order.id, order.wallet)}
                          className={`inline-flex rounded-xl px-3 py-2 text-[16px] font-black transition-all duration-300 hover:bg-[#F8FAFC] ${
                            highlightedWalletId === order.id
                              ? 'bg-[#DCFCE7] text-[#16A34A] shadow-[0_0_0_6px_rgba(34,197,94,0.12)]'
                              : 'text-gray-900'
                          }`}
                        >
                          {order.wallet}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveOrderId(order.id)}
                          className="inline-flex min-h-[36px] items-center justify-center rounded-xl bg-[#F4F5F7] px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-700 transition-colors hover:bg-[#EBECEF]"
                        >
                          {t('adminOrders.viewDetail')}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {editingCommissionId === order.id ? (
                        <div className="flex flex-col items-center gap-3">
                          <input
                            type="text"
                            value={commissionDraft}
                            onChange={(event) => setCommissionDraft(event.target.value)}
                            className="h-[44px] w-[140px] rounded-xl border border-[#E5E7EB] bg-white px-4 text-center text-[16px] font-bold text-primary outline-none transition-colors focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelCommissionEdit}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-[#F3F4F6] px-3 text-[11px] font-bold text-[#64748B] transition-colors hover:bg-[#E5E7EB]"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveCommissionEdit(order.id)}
                              className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-primary px-3 text-[11px] font-bold text-white transition-colors hover:opacity-90"
                            >
                              {t('common.save')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative flex items-center justify-center gap-2">
                          <span className="text-[16px] font-black text-primary">
                            {formatCurrency(getDisplayedCommissionTotal(order))}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartCommissionEdit(order)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white shadow-sm"
                            title="Điều chỉnh hoa hồng"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] ${
                          order.status === 'Approved'
                            ? 'bg-[#DCFCE7] text-[#16A34A]'
                            : order.status === 'Rejected'
                              ? 'bg-[#FEE2E2] text-[#DC2626]'
                              : 'bg-[#FFF4DB] text-[#D97706]'
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleRejectOrder(order.id)}
                          disabled={order.status !== 'Pending'}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#FFF1F2] px-4 text-[14px] font-bold text-[#E11D48] transition-colors hover:bg-[#FFE4E8] disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#94A3B8]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          {t('adminOrders.reject')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={order.status !== 'Pending' || getDisplayedCommissionTotal(order) <= 0}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-[14px] font-bold text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#94A3B8]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="16 9 11 14 8 11" />
                          </svg>
                          {t('adminOrders.accept')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium text-[#63748C]">{t('adminOrders.rowsPerPage')}</span>
              <span className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg bg-[#F3F5F8] px-3 text-[14px] font-bold text-gray-700">25</span>
            </div>
            <div className="flex items-center gap-3 text-[15px] font-semibold text-[#52637A]">
              <button type="button" aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">1</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl">2</span>
              <button type="button" aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {activeOrderId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-6 py-10">
            <div className="w-full max-w-[1280px] rounded-[32px] bg-white shadow-[0_30px_80px_rgba(17,24,39,0.2)]">
              <div className="flex flex-col gap-4 border-b border-gray-100 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-[28px] font-black tracking-tight text-gray-900">{t('adminOrders.orderDetail')}</h3>
                  <p className="mt-1 text-[14px] font-medium text-[#8EA0BC]">{activeOrderId}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-[#FFF7ED] px-5 py-3 text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F97316]">
                      {t('adminOrders.totalCommission')}
                    </p>
                    <p className="mt-1 text-[24px] font-black tracking-tight text-primary">
                      {formatCurrency(activeOrderCommissionTotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveOrderId(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#74839B] transition-colors hover:bg-gray-50"
                    aria-label="Close detail modal"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid gap-6 px-8 py-8 md:grid-cols-3">
                {activeOrderDetails.length > 0 ? activeOrderDetails.map((counter) => {
                  const counterCommissionTotal = counter.items.reduce(
                    (total, item) => total + parseCurrency(item.commission),
                    0
                  );

                  return (
                    <div key={counter.counterName} className="rounded-[28px] border border-gray-100 bg-[#FBFCFE] p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-[20px] font-black tracking-tight text-gray-900">
                          {counter.counterName.replace('Counter', 'Quầy')}
                        </h4>
                        <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
                            {t('adminOrders.shortCommission')}
                          </p>
                          <p className="mt-1 text-[15px] font-black text-primary">
                            {formatCurrency(counterCommissionTotal)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 space-y-4">
                        {counter.items.length > 0 ? (
                          counter.items.map((item, itemIndex) => (
                            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                              <p className="text-[15px] font-bold text-gray-900">{`Đơn ${itemIndex + 1}`}</p>
                              
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-gray-500">{t('adminOrders.itemCommission')}:</span>
                                {editingDetailId === item.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={detailCommissionDraft}
                                      onChange={(e) => setDetailCommissionDraft(e.target.value)}
                                      className="h-[30px] w-[80px] rounded-lg border border-primary/30 px-2 text-[13px] font-bold text-primary outline-none focus:border-primary"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveDetailEdit(activeOrderId, item.id)}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white hover:opacity-90"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={handleCancelDetailEdit}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartDetailEdit(item)}
                                    className="flex items-center gap-1.5 transition-all hover:opacity-70"
                                  >
                                    <span className="text-[14px] font-black text-primary">{item.commission}</span>
                                    <svg className="text-primary/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleRejectDetail(activeOrderId, item.id)}
                                  disabled={activeOrderStatus === 'Approved'}
                                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#FFF1F2] px-4 text-[13px] font-bold text-[#E11D48] transition-colors hover:bg-[#FFE4E8] disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#94A3B8]"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                  </svg>
                                  {t('adminOrders.delete')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStoppedItemIds(prev => 
                                      prev.includes(item.id) 
                                        ? prev.filter(id => id !== item.id) 
                                        : [...prev, item.id]
                                    );
                                  }}
                                  disabled={activeOrderStatus === 'Approved'}
                                  className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#94A3B8] ${
                                    stoppedItemIds.includes(item.id)
                                      ? 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                                      : 'bg-[#FFF4DB] text-[#D97706] hover:bg-[#FFF8E8]'
                                  }`}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
                                  </svg>
                                  {stoppedItemIds.includes(item.id) ? 'Đã dừng' : 'Dừng'}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="md:col-span-3 rounded-[28px] border border-dashed border-gray-200 bg-[#FBFCFE] px-6 py-12 text-center">
                    <p className="text-[18px] font-black text-gray-900">{t('adminOrders.emptyTitle')}</p>
                    <p className="mt-2 text-[14px] font-medium text-[#94A3B8]">
                      {t('adminOrders.emptyDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminScaffold>
  );
}
