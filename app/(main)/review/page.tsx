'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';

export default function ReviewTransactionPage() {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleConfirm = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      router.push('/payment/success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 pb-20">
      <div className="container max-w-[1140px] mx-auto px-6 pt-12">
        
        <div className="mb-10">
          <h1 className="text-[34px] md:text-[38px] font-bold text-[#111827] mb-2 tracking-tight">
            {t('review.title')}
          </h1>
          <p className="text-gray-500 text-[15px] font-medium leading-relaxed">
            {t('review.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-gray-100/80">
              <h2 className="text-[18px] font-bold text-gray-900 mb-6">{t('review.paymentInfo')}</h2>
              <div className="border-b border-gray-100/60 mb-8"></div>
              
              <div className="flex items-start gap-5 mb-8">
               <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F8F9FA] border border-gray-100/50 flex items-center justify-center shrink-0">
                  <svg className="text-[#E65C00]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"></path><path d="M14 22v-6c0-1.1-.9-2-2-2s-2 .9-2 2v6"></path><path d="M9 10h.01"></path><path d="M15 10h.01"></path><path d="M9 14h.01"></path><path d="M15 14h.01"></path></svg>
               </div>
               <div className="flex flex-col pt-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('review.recipient')}</span>
                 <span className="text-[17px] font-bold text-gray-900">{t('review.recipientValue')}</span>
               </div>
              </div>
              
              <div className="flex items-start gap-5 mb-8">
               <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F8F9FA] border border-gray-100/50 flex items-center justify-center shrink-0">
                  <svg className="text-[#E65C00]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
               </div>
               <div className="flex flex-col pt-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('review.serviceType')}</span>
                 <span className="text-[17px] font-bold text-gray-900 tracking-tight">{t('review.serviceValue')}</span>
               </div>
              </div>

              <div className="flex items-start gap-5 mb-8">
               <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F8F9FA] border border-gray-100/50 flex items-center justify-center shrink-0">
                  <svg className="text-[#E65C00]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
               </div>
               <div className="flex flex-col pt-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('review.paymentMethod')}</span>
                 <div className="flex items-center gap-3">
                   <span className="text-[17px] font-bold text-gray-900">{t('review.paymentValue')}</span>
                   <span className="bg-[#EFF6FF] text-[#2563EB] text-[9.5px] font-bold uppercase tracking-widest px-2 py-1 rounded-md mb-0.5">{t('review.defaultBadge')}</span>
                 </div>
               </div>
              </div>

              <div className="flex items-start gap-5">
               <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F8F9FA] border border-gray-100/50 flex items-center justify-center shrink-0">
                  <svg className="text-[#E65C00]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               </div>
               <div className="flex flex-col pt-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('review.referenceNumber')}</span>
                 <span className="text-[17px] font-bold text-gray-600 tracking-wide">{t('review.referenceValue')}</span>
               </div>
              </div>
            </div>

            <div className="bg-[#F8F9FA] border border-gray-200/60 rounded-[16px] p-5 flex items-start gap-4">
               <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
               </div>
               <p className="text-[13.5px] font-medium text-gray-500 leading-snug pt-0.5">
                  {t('review.securityNote')}
               </p>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col">
               
               <div className="bg-[#FFF6F0] p-8 md:px-10 md:py-9 relative border-b border-[#FFE8D6]">
                 <svg className="absolute top-8 right-8 text-gray-300 pointer-events-none opacity-40 mix-blend-multiply" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                 <span className="block text-[#E65C00] font-bold text-[12px] tracking-widest uppercase mb-1">{t('review.paymentSummary')}</span>
                 <span className="block text-[12px] font-medium text-gray-500 mb-2">{t('review.currentBalance')}</span>
                 <span className="block text-[32px] font-black text-gray-900 leading-none tracking-tight">$142,550.00</span>
               </div>

               <div className="p-8 md:px-10 md:py-8 flex-1">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-[14.5px] font-medium text-gray-500">{t('review.paymentAmount')}</span>
                     <span className="text-[16px] font-bold text-gray-900">$50.00</span>
                  </div>
                  <div className="flex justify-between items-center mb-8">
                     <span className="text-[14.5px] font-medium text-gray-500">{t('review.processingFee')}</span>
                     <span className="text-[16px] font-bold text-gray-900">$1.50</span>
                  </div>

                  <div className="border-t border-gray-100/80 mb-6"></div>

                  <div className="flex justify-between items-end mb-8">
                     <span className="text-[16px] font-bold text-gray-900 pb-0.5">{t('review.totalToDeduct')}</span>
                     <span className="text-[26px] font-black text-[#E65C00] leading-none">$51.50</span>
                  </div>

                  <div className="bg-[#F8F9FA] border-l-[4px] border-[#0ea5e9] py-4 px-5 rounded-r-[12px] flex justify-between items-center mb-10 shadow-sm shadow-[#0ea5e9]/5">
                     <span className="text-[12px] font-bold text-gray-600">{t('review.balanceAfter')}</span>
                     <span className="text-[13px] font-bold text-gray-900">$142,498.50</span>
                  </div>

                  <div className="flex gap-4">
                     <button 
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex-1 h-[54px] bg-[#E65C00] hover:bg-[#CC5200] text-white font-bold text-[14.5px] rounded-[14px] flex justify-center items-center gap-2.5 transition-all shadow-[0_6px_20px_rgba(230,92,0,0.25)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                     >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                            {t('review.processing')}
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            {t('review.confirmPay')}
                          </>
                        )}
                     </button>
                     <Link href="/create-order" className="w-1/3 min-w-[110px] h-[54px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-[14px] rounded-[14px] flex justify-center items-center transition-all shadow-sm">
                       {t('review.cancel')}
                     </Link>
                  </div>
               </div>
            </div>

            <div className="flex justify-center items-center gap-8 mt-6 opacity-60">
               <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[10px] tracking-widest uppercase">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  {t('review.secureSocket')}
               </div>
               <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[10px] tracking-widest uppercase">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {t('review.instantSettlement')}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
