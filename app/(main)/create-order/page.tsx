'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';

export default function CreateOrderPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('');
  const currentServiceStep = Number(searchParams?.get('serviceStep') ?? '0');
  const nextServiceStep = Math.min(currentServiceStep + 1, 2);

  const handleCreateOrder = () => {
    sessionStorage.setItem('counterDetailPreviousStep', String(currentServiceStep));
    sessionStorage.setItem('counterDetailCurrentStep', String(nextServiceStep));
    sessionStorage.setItem('counterDetailAdvancePending', 'true');
    router.push('/counter-market/1');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <div className="container max-w-[1140px] mx-auto px-6 pt-10">
        
        {/* Back Link */}
        <Link href="/counter-market/1" className="inline-flex items-center text-gray-500 hover:text-gray-900 font-medium text-[13px] tracking-wide mb-8 transition-colors">
          <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          {t('user.createOrder.back')}
        </Link>

        {/* Header Title */}
        <div className="mb-12">
          <h1 className="text-[36px] md:text-[42px] font-bold text-primary mb-3 tracking-tight">
            {t('user.createOrder.title')}
          </h1>
          <p className="text-gray-500 text-[15px] max-w-2xl leading-relaxed">
            {t('user.createOrder.desc')}
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Transaction Information */}
          <div className="lg:col-span-7 bg-[#FFF6F0] rounded-[32px] p-8 md:p-10 border border-[#FFE8D6]">
            
            <div className="flex items-start gap-4 mb-10">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex justify-center items-center font-bold text-[16px] shrink-0 shadow-sm shadow-orange-200">
                1
              </div>
              <div className="pt-0.5">
                <h2 className="text-[20px] font-bold text-gray-900 mb-1 tracking-tight">{t('user.createOrder.transactionInfo')}</h2>
                <p className="text-gray-500 text-[13px] font-medium">{t('user.createOrder.transactionInfoDesc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Counter Field */}
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">{t('user.createOrder.counterLabel')} *</label>
                <div className="relative">
                  <select defaultValue="" className="w-full h-[56px] pl-5 pr-12 bg-white border border-gray-200 rounded-xl appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px] font-medium text-gray-700 shadow-sm transition-all">
                    <option value="" disabled>{t('user.createOrder.selectCounter')}</option>
                    <option value="vip-1">{locale === 'vi' ? t('user.counter.featuredTitleVi') : t('user.counter.featuredTitleEn')}</option>
                    <option value="std-1">{locale === 'vi' ? t('user.createOrder.standardTransferVi') : t('user.createOrder.standardTransferEn')}</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              {/* Order Type Field */}
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">{t('user.createOrder.orderTypeLabel')} *</label>
                <div className="relative">
                  <select defaultValue="" className="w-full h-[56px] pl-5 pr-12 bg-white border border-gray-200 rounded-xl appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px] font-medium text-gray-700 shadow-sm transition-all">
                    <option value="" disabled>{t('user.createOrder.selectOrderType')}</option>
                    <option value="transfer">{locale === 'vi' ? t('user.counter.detail.transfer1TitleVi') : t('user.counter.detail.transfer1TitleEn')}</option>
                    <option value="payment">{locale === 'vi' ? t('user.createOrder.globalUtilityBillVi') : t('user.createOrder.globalUtilityBillEn')}</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Field */}
            <div className="mb-8">
              <label className="block text-[13px] font-bold text-gray-900 mb-2">{t('user.createOrder.amountLabel')} *</label>
              <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl h-[72px] shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden">
                <div className="pl-6 pr-3 flex items-center text-gray-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                  <span className="text-[20px] font-bold text-gray-300 ml-3">$</span>
                </div>
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="flex-1 h-full w-full appearance-none border-0 bg-transparent text-[24px] font-bold text-gray-900 placeholder:text-gray-300 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0"
                />
                <div className="pr-5 shrink-0">
                  <span className="bg-[#FFF0E6] text-primary text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    USD
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-3 pl-1">
                {t('user.createOrder.amountRange')}
              </p>
            </div>

            {/* Info Banner */}
            <div className="bg-[#FFF0E6] border border-[#FFE0CC] rounded-xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <p className="text-gray-800 text-[14px] font-medium leading-relaxed pt-0.5">
                {t('user.createOrder.infoBanner')}
              </p>
            </div>

          </div>


          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28">
            <h2 className="text-[22px] font-bold text-gray-900 mb-2 tracking-tight">{t('user.createOrder.orderSummary')}</h2>
            <p className="text-gray-500 text-[13px] font-medium mb-8">{t('user.createOrder.orderSummaryDesc')}</p>

            {/* Current Balance Row */}
            <div className="bg-[#FFF6F0] rounded-2xl p-5 flex items-center justify-between mb-8 border border-[#FFE8D6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] text-primary flex justify-center items-center shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                    <path d="M12 12h.01"></path>
                  </svg>
                </div>
                <span className="text-[14px] font-bold text-gray-700">{t('user.createOrder.currentBalance')}</span>
              </div>
              <span className="text-[18px] font-bold text-gray-900">$15,000.00</span>
            </div>

            {/* Status Rows */}
            <div className="flex justify-between items-center py-4">
              <span className="text-[14px] font-bold text-gray-500">{t('user.createOrder.requiredAmount')}</span>
              <span className="text-[16px] font-bold text-gray-900">{amount ? `$${amount}` : '$0.00'}</span>
            </div>
            
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-1.5 opacity-90">
                <span className="text-[14px] font-bold text-gray-500">{t('user.createOrder.expectedCommission')}</span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </button>
              </div>
              <span className="text-[16px] font-bold text-primary">2.2%</span>
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            <div className="flex justify-between items-center py-2 mb-8 bg-[#FFFDFB] rounded-lg">
              <span className="text-[14px] font-bold text-primary">{t('user.createOrder.remainingBalance')}</span>
              <span className="text-[20px] font-bold text-primary">$15,000.00</span>
            </div>

            {/* Security Badge */}
            <div className="flex items-start gap-3 mb-10 text-gray-500">
              <svg className="shrink-0 text-primary opacity-60 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <p className="text-[11.5px] font-medium leading-[1.6]">
                {t('user.createOrder.securityNotice')}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleCreateOrder}
                className="flex-1 h-[52px] bg-primary hover:bg-[#E65C00] text-white rounded-xl font-bold text-[14px] flex justify-center items-center gap-2 transition-all shadow-[0_6px_20px_rgba(255,102,0,0.25)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
                {t('user.createOrder.submit')}
              </button>
              <Link href="/counter-market/1" className="sm:w-[120px] h-[52px] bg-[#F4F5F7] hover:bg-[#EBECEF] text-gray-700 rounded-xl font-bold text-[14px] flex justify-center items-center transition-all">
                {t('user.createOrder.cancel')}
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
