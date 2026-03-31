'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { orders, statusStyles, type OrderStatus } from '@/data/orders';

type StepTone = 'done' | 'current' | 'upcoming' | 'success' | 'danger';

type StepConfig = {
  label: string;
  tone: StepTone;
};

type TimelineEvent = {
  time: string;
  title: string;
  description?: string;
  tone: 'active' | 'muted' | 'danger';
};

function getStepConfig(status: OrderStatus): StepConfig[] {
  if (status === 'Completed') {
    return [
      { label: 'Requested', tone: 'done' },
      { label: 'Verifying', tone: 'done' },
      { label: 'Disbursing', tone: 'done' },
      { label: 'Completed', tone: 'success' },
    ];
  }

  if (status === 'Cancelled') {
    return [
      { label: 'Requested', tone: 'done' },
      { label: 'Verifying', tone: 'done' },
      { label: 'Disbursing', tone: 'upcoming' },
      { label: 'Cancelled', tone: 'danger' },
    ];
  }

  if (status === 'Processing') {
    return [
      { label: 'Requested', tone: 'done' },
      { label: 'Verifying', tone: 'done' },
      { label: 'Disbursing', tone: 'current' },
      { label: 'Completed', tone: 'upcoming' },
    ];
  }

  return [
    { label: 'Requested', tone: 'done' },
    { label: 'Verifying', tone: 'current' },
    { label: 'Disbursing', tone: 'upcoming' },
    { label: 'Completed', tone: 'upcoming' },
  ];
}

function getTimeline(status: OrderStatus): TimelineEvent[] {
  if (status === 'Completed') {
    return [
      {
        time: '14:45 UTC',
        title: 'Funds Delivered',
        description: 'Final payout settled successfully.',
        tone: 'active',
      },
      {
        time: '14:32 UTC',
        title: 'Disbursement Completed',
        description: 'Counter released funds to the destination.',
        tone: 'active',
      },
      {
        time: '14:22 UTC',
        title: 'Payment Received',
        description: 'Funds cleared via instant bridge.',
        tone: 'active',
      },
      {
        time: '14:10 UTC',
        title: 'Order Created',
        description: 'Reference ID registered in ledger.',
        tone: 'muted',
      },
    ];
  }

  if (status === 'Cancelled') {
    return [
      {
        time: '14:28 UTC',
        title: 'Order Cancelled',
        description: 'The request was closed before disbursement.',
        tone: 'danger',
      },
      {
        time: '14:22 UTC',
        title: 'Verification Completed',
        description: 'Compliance checks finished before cancellation.',
        tone: 'active',
      },
      {
        time: '14:10 UTC',
        title: 'Order Created',
        description: 'Reference ID registered in ledger.',
        tone: 'muted',
      },
    ];
  }

  if (status === 'Processing') {
    return [
      {
        time: '14:45 UTC',
        title: 'Security Check Completed',
        description: 'Multi-factor validation successful.',
        tone: 'active',
      },
      {
        time: '14:22 UTC',
        title: 'Payment Received',
        description: 'Funds cleared via instant bridge.',
        tone: 'active',
      },
      {
        time: '14:10 UTC',
        title: 'Order Created',
        description: 'Reference ID registered in ledger.',
        tone: 'muted',
      },
      {
        time: 'Estimated 16:00 UTC',
        title: 'Final Completion',
        description: 'Awaiting final settlement confirmation.',
        tone: 'muted',
      },
    ];
  }

  return [
    {
      time: '14:18 UTC',
      title: 'Verification Queue Started',
      description: 'The order is waiting on compliance review.',
      tone: 'active',
    },
    {
      time: '14:10 UTC',
      title: 'Order Created',
      description: 'Reference ID registered in ledger.',
      tone: 'muted',
    },
    {
      time: 'Estimated 14:45 UTC',
      title: 'Payment Review',
      description: 'Funds will move once verification clears.',
      tone: 'muted',
    },
  ];
}

function getProgressWidth(status: OrderStatus) {
  if (status === 'Completed' || status === 'Cancelled') return '100%';
  if (status === 'Processing') return '66.666%';
  return '33.333%';
}

function getProgressColor(status: OrderStatus) {
  return status === 'Cancelled' ? '#DC2626' : '#E65C00';
}

function getStatusCopy(status: OrderStatus) {
  if (status === 'Completed') {
    return {
      eyebrow: 'Settlement Complete',
      description: 'This order has been completed and funds have been delivered.',
      note: 'This order is finalized. Refresh is available only for audit confirmation.',
      protectionBadge: 'Completed',
    };
  }

  if (status === 'Cancelled') {
    return {
      eyebrow: 'Order Closed',
      description: 'This order was cancelled before funds were fully disbursed.',
      note: 'This order is finalized. Refresh is available only for audit confirmation.',
      protectionBadge: 'Cancelled',
    };
  }

  if (status === 'Processing') {
    return {
      eyebrow: 'Funds In Motion',
      description: 'Detailed status for your kinetic asset acquisition.',
      note: 'Updates may have a 2-3 minute latency depending on blockchain node propagation.',
      protectionBadge: 'Verified',
    };
  }

  return {
    eyebrow: 'Transaction Tracker',
    description: 'This order is still moving through verification before release.',
    note: 'Updates may have a 2-3 minute latency depending on blockchain node propagation.',
    protectionBadge: 'In Review',
  };
}

function StepIcon({ tone }: { tone: StepTone }) {
  if (tone === 'done' || tone === 'success') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (tone === 'danger') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }

  if (tone === 'current') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

export default function OrderStatusPage() {
  const params = useParams<{ id: string }>();
  const routeId = params?.id ?? '';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const order = useMemo(
    () => orders.find((entry) => entry.id === routeId),
    [routeId]
  );

  const statusCopy = useMemo(
    () => (order ? getStatusCopy(order.status) : null),
    [order]
  );
  const steps = useMemo(
    () => (order ? getStepConfig(order.status) : []),
    [order]
  );
  const timeline = useMemo(
    () => (order ? getTimeline(order.status) : []),
    [order]
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate network pull
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const handleSupport = () => {
    const orderId = order?.orderNumber ?? `#${routeId}`;
    const message = `I need help with Order ${orderId}`;
    
    // Simulate opening chat with auto-paste
    alert(`[Support Chat] Auto-pasted: "${message}"\n\nConnecting to support agent...`);
    // In a real app, this would open a widget like Intercom/Zendesk with:
    // window.Intercom('showNewMessage', message);
  };

  if (!order || !statusCopy) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[560px] rounded-[32px] border border-gray-100 bg-white p-10 text-center shadow-[0_20px_60px_rgba(17,24,39,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Order Lookup
          </p>
          <h1 className="mt-4 text-[34px] font-black tracking-tight text-gray-900">
            Order Not Found
          </h1>
          <p className="mt-4 text-[15px] font-medium leading-7 text-gray-500">
            We couldn&apos;t find an order matching this route. Return to the
            orders workspace and pick a valid record.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/orders" className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary px-6 text-[14px] font-bold text-white hover:bg-[#E65C00] transition-colors">
              Back to Orders
            </Link>
            <Link href="/support" className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-gray-200 px-6 text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 pb-24">
      <div className="container max-w-[1140px] mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h3 className="text-[11px] font-bold text-[#D95D1A] uppercase tracking-widest mb-3">{statusCopy.eyebrow}</h3>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <h1 className="text-[38px] md:text-[42px] font-bold text-[#111827] leading-[1.1] tracking-tight">{order.orderNumber}</h1>
              <span className={`inline-flex w-max rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] ${statusStyles[order.status]}`}>
                {order.status}
              </span>
            </div>
            <p className="text-gray-500 text-[15.5px] font-medium leading-relaxed mt-3">{statusCopy.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-8 md:mt-0 items-center">
            <button className="h-[48px] px-6 bg-white border border-gray-200 text-gray-700 font-bold text-[13.5px] rounded-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download Invoice
            </button>
            <button 
              onClick={handleSupport}
              className="h-[48px] px-6 bg-[#E65C00] hover:bg-[#CC5200] text-white font-bold text-[13.5px] rounded-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(230,92,0,0.3)] hover:scale-105"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Message Support about this Order
            </button>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-white border border-gray-100 rounded-[32px] py-14 px-6 md:px-14 mb-8 shadow-sm relative">
          <div className="hidden md:block absolute left-[10%] right-[10%] top-[45%] h-1.5 bg-[#F3F4F6] z-0 rounded-full"></div>
          <div
            className="hidden md:block absolute left-[10%] top-[45%] h-1.5 z-0 rounded-full transition-all duration-500"
            style={{
              width: `calc(80% * ${Number.parseFloat(getProgressWidth(order.status)) / 100})`,
              backgroundColor: getProgressColor(order.status),
            }}
          ></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 max-w-5xl mx-auto">
            {steps.map((step) => {
              const sizeClass = step.tone === 'current' ? 'w-[60px] h-[60px] rounded-[20px]' : 'w-[52px] h-[52px] rounded-[16px]';
              const toneClass =
                step.tone === 'done'
                  ? 'bg-[#E65C00] text-white shadow-[0_6px_16px_rgba(230,92,0,0.3)]'
                  : step.tone === 'current'
                    ? 'bg-white border-[4px] border-[#E65C00] text-[#E65C00] shadow-[0_8px_20px_rgba(230,92,0,0.2)]'
                    : step.tone === 'success'
                      ? 'bg-[#16A34A] text-white shadow-[0_6px_16px_rgba(22,163,74,0.25)]'
                      : step.tone === 'danger'
                        ? 'bg-[#DC2626] text-white shadow-[0_6px_16px_rgba(220,38,38,0.22)]'
                        : 'bg-[#F3F4F6] text-gray-400';

              return (
                <div
                  key={step.label}
                  className={`flex flex-col items-center bg-white px-4 ${
                    step.tone === 'upcoming' ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  <div className={`${sizeClass} ${toneClass} flex items-center justify-center mb-4 md:mb-5 transition-all duration-300`}>
                    <StepIcon tone={step.tone} />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${
                    step.tone === 'success'
                      ? 'text-[#16A34A]'
                      : step.tone === 'danger'
                        ? 'text-[#DC2626]'
                        : step.tone === 'upcoming'
                          ? 'text-gray-500'
                          : 'text-gray-900'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              
              {/* Transaction Details Card */}
              <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-10 shadow-sm relative overflow-hidden h-full">
                <svg className="absolute -right-6 -top-6 w-[160px] h-[160px] text-gray-50 pointer-events-none stroke-[2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                
                <h4 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest mb-10 relative z-10">Transaction Details</h4>
                
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex justify-between items-end border-b border-gray-100/60 pb-5">
                    <span className="text-[14px] text-gray-500 font-medium pb-1">Amount</span>
                    <span className="text-[26px] font-bold text-gray-900 leading-none">{order.amount}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100/60 pb-5">
                    <span className="text-[14px] text-gray-500 font-medium">Recipient</span>
                    <span className="text-[15px] font-bold text-gray-900">{order.recipient}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100/60 pb-5">
                    <span className="text-[14px] text-gray-500 font-medium">Counter</span>
                    <span className="text-[15px] font-bold text-gray-900">{order.counter}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-[14px] text-gray-500 font-medium">Date Initiated</span>
                    <span className="text-[15px] font-bold text-gray-900">{order.date}</span>
                  </div>
                </div>
              </div>

              {/* Kinetic Protection Card */}
              <div className="bg-[#F8F9FA] border border-gray-100/80 rounded-[32px] p-8 md:p-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-[42px] h-[42px] rounded-[12px] bg-white border border-[#FFE8D6] text-primary flex items-center justify-center shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md ${
                    order.status === 'Completed'
                      ? 'bg-[#DCFCE7] text-[#16A34A]'
                      : order.status === 'Cancelled'
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : 'bg-[#E65C00]/10 text-[#CC5200]'
                  }`}>{statusCopy.protectionBadge}</span>
                </div>
                
                <h3 className="text-[18px] font-bold text-gray-900 mb-3 tracking-tight">Kinetic Protection</h3>
                <p className="text-[#64748B] text-[14px] leading-[1.8] font-medium">
                  {order.status === 'Cancelled'
                    ? 'This order remains logged in the protected audit trail. Funds were not fully released after cancellation.'
                    : order.status === 'Completed'
                      ? 'This order is encrypted using SwiftGuard\'s 256-bit kinetic architecture and has completed settlement successfully.'
                      : 'This order is encrypted using SwiftGuard\'s 256-bit kinetic architecture. Your assets are insured during transit.'}
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-2">
               <Link href="/counter-market" className="inline-flex items-center text-gray-400 hover:text-gray-700 font-bold text-[14px] transition-colors">
                  <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Back to Counter Market
               </Link>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-[18px] font-bold text-gray-900 flex items-center gap-3">
                  <svg className="text-[#E65C00]" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Real-time Updates
                </h3>
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing || order.status === 'Completed' || order.status === 'Cancelled'}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-primary hover:text-[#CC5200] transition-colors disabled:opacity-50"
                  title={order.status === 'Completed' || order.status === 'Cancelled' ? 'This order is already finalized' : 'Pull latest status from Admin'}
                >
                  <svg className={`${isRefreshing ? 'animate-spin opacity-80' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.8-11.45L2 8"></path></svg>
                  {isRefreshing ? 'Refreshing...' : order.status === 'Completed' || order.status === 'Cancelled' ? 'Finalized' : 'Refresh Status'}
                </button>
              </div>

              <div className="relative pl-6 border-l-[2px] border-gray-100 pb-10 flex-1 ml-2">
                {timeline.map((item, index) => (
                  <div key={`${item.time}-${item.title}`} className={`${index === timeline.length - 1 ? 'relative' : 'mb-10 relative'}`}>
                    <div className={`absolute ${item.tone === 'active' ? 'w-[12px] h-[12px] -left-[31px] top-1 outline outline-[4px]' : item.tone === 'danger' ? 'w-[12px] h-[12px] -left-[31px] top-1 outline outline-[4px]' : 'w-[10px] h-[10px] -left-[30px] top-1.5 outline outline-[4px]'} outline-white rounded-full ${
                      item.tone === 'active'
                        ? 'bg-[#E65C00] shadow-sm'
                        : item.tone === 'danger'
                          ? 'bg-[#DC2626] shadow-sm'
                          : 'bg-gray-300'
                    }`}></div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
                      item.tone === 'active'
                        ? 'text-[#E65C00]'
                        : item.tone === 'danger'
                          ? 'text-[#DC2626]'
                          : 'text-gray-400'
                    }`}>{item.time}</p>
                    <h4 className={`text-[15px] font-bold mb-1 ${
                      item.tone === 'active'
                        ? 'text-gray-900'
                        : item.tone === 'danger'
                          ? 'text-[#991B1B]'
                          : 'text-gray-600'
                    }`}>{item.title}</h4>
                    {item.description ? (
                      <p className="text-[12.5px] text-gray-400 font-medium">{item.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className={`mt-8 rounded-[16px] p-5 flex items-start gap-4 border ${
                order.status === 'Cancelled'
                  ? 'bg-[#FFF5F5] border-[#FECACA]'
                  : order.status === 'Completed'
                    ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                    : 'bg-[#FFF6F0] border-[#FFE8D6]/60'
              }`}>
                <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 ${
                  order.status === 'Cancelled'
                    ? 'border border-[#DC2626]/30 text-[#DC2626]'
                    : order.status === 'Completed'
                      ? 'border border-[#16A34A]/30 text-[#16A34A]'
                      : 'border border-[#E65C00]/30 text-[#E65C00]'
                }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <p className={`text-[12.5px] font-medium leading-[1.6] ${
                  order.status === 'Cancelled'
                    ? 'text-[#991B1B]'
                    : order.status === 'Completed'
                      ? 'text-[#166534]'
                      : 'text-[#CC5200]'
                }`}>
                  {statusCopy.note}
                </p>
              </div>

            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
