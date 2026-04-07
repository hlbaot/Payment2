'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  DEPOSITS_UPDATED_EVENT,
  formatUsd,
  getDepositRequestsByEmail,
  getWalletBalance,
  WALLETS_UPDATED_EVENT,
  type DepositRequest,
} from '@/data/fake/runtime-store';
import { fakeUsers } from '@/data/fake/users';

export default function WalletPage() {
  const { t } = useI18n();
  const [walletBalance, setWalletBalance] = useState(0);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('user@kinetic.com');
  const [currentUserName, setCurrentUserName] = useState('John Doe');

  useEffect(() => {
    const fallbackUser = fakeUsers.find((user) => user.role === 'user');
    const nextEmail = sessionStorage.getItem('userEmail') ?? fallbackUser?.email ?? 'user@kinetic.com';
    const nextName = sessionStorage.getItem('userName') ?? fallbackUser?.userName ?? 'John Doe';

    const syncWalletData = () => {
      const nextBalance = getWalletBalance(nextEmail);
      setWalletBalance(nextBalance);
      sessionStorage.setItem('walletBalance', String(nextBalance));
      setDepositRequests(getDepositRequestsByEmail(nextEmail));
    };

    setCurrentUserEmail(nextEmail);
    setCurrentUserName(nextName);
    syncWalletData();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'shared-user-wallets' || event.key === 'shared-deposit-requests') {
        syncWalletData();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(WALLETS_UPDATED_EVENT, syncWalletData);
    window.addEventListener(DEPOSITS_UPDATED_EVENT, syncWalletData);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(WALLETS_UPDATED_EVENT, syncWalletData);
      window.removeEventListener(DEPOSITS_UPDATED_EVENT, syncWalletData);
    };
  }, []);

  const pendingDeposits = useMemo(
    () => depositRequests.filter((request) => request.status === 'Pending'),
    [depositRequests]
  );
  const depositHistory = useMemo(
    () => depositRequests.filter((request) => request.status === 'Confirmed'),
    [depositRequests]
  );

  const totalConfirmedAmount = depositHistory.reduce((total, request) => total + request.amount, 0);
  const totalPendingAmount = pendingDeposits.reduce((total, request) => total + request.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <main className="pt-12">
          <div className="mb-10 flex flex-col gap-3">
            <h1 className="text-[28px] font-black tracking-tight text-gray-900">{t('user.wallet.title')}</h1>
            <p className="text-[15px] font-medium text-[#64748B]">
              {currentUserName} {t('user.wallet.descSuffix')}
            </p>
          </div>

          <div className="mb-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-[36px] bg-primary p-10 text-white shadow-[0_25px_60px_rgba(255,102,0,0.3)]">
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-white/70">{t('user.wallet.availableBalance')}</p>
              <h2 className="mt-4 text-[58px] font-black leading-none tracking-tight">{formatUsd(walletBalance)}</h2>
              <p className="mt-3 text-[15px] font-bold text-[#86EFAC]">{t('user.wallet.dailyProfit')}</p>
              <p className="mt-5 text-[13px] font-medium text-white/80">{currentUserEmail}</p>

              <div className="mt-8 grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                 <button className="h-[52px] bg-white text-primary rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 hover:bg-orange-50 transition-all active:scale-95" onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    {t('user.wallet.deposit')}
                 </button>
                 <button className="h-[52px] bg-white/10 text-white border border-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-white/20 transition-all active:scale-95" onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17L17 7"/><polyline points="10 7 17 7 17 14"/></svg>
                    {t('user.wallet.withdraw')}
                 </button>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-white/12 p-5 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">{t('user.wallet.pendingDeposits')}</p>
                  <p className="mt-3 text-[26px] font-black">{formatUsd(totalPendingAmount)}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 p-5 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">{t('user.wallet.depositHistory')}</p>
                  <p className="mt-3 text-[26px] font-black">{formatUsd(totalConfirmedAmount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[36px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
              <h3 className="text-[20px] font-black tracking-tight text-gray-900">{t('user.wallet.pendingQueue')}</h3>
              <p className="mt-2 text-[14px] font-medium text-[#94A3B8]">
                {t('user.wallet.pendingQueueDesc')}
              </p>

              <div className="mt-6 space-y-3">
                {pendingDeposits.length > 0 ? (
                  pendingDeposits.map((request) => (
                    <div key={request.id} className="rounded-[24px] border border-[#F3E7DE] bg-[#FFF9F4] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-black text-gray-900">{request.id}</p>
                          <p className="mt-1 text-[12px] font-medium text-[#94A3B8]">{request.method}</p>
                        </div>
                        <span className="text-[14px] font-black text-primary">{formatUsd(request.amount)}</span>
                      </div>
                      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#D97706]">
                        {t('user.wallet.waitingAdmin')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-gray-200 px-5 py-10 text-center">
                    <p className="text-[15px] font-bold text-gray-900">{t('user.wallet.noPendingTitle')}</p>
                    <p className="mt-2 text-[13px] font-medium text-[#94A3B8]">
                      {t('user.wallet.noPendingDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[36px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
              <h3 className="text-[22px] font-black tracking-tight text-gray-900">{t('user.wallet.depositHistory')}</h3>
              <p className="text-[14px] font-medium text-[#94A3B8]">
                {t('user.wallet.historyDesc')}
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-[#8EA0BC]">
                    <th className="px-3 py-4">{t('user.wallet.depositId')}</th>
                    <th className="px-3 py-4">{t('user.wallet.method')}</th>
                    <th className="px-3 py-4">{t('user.wallet.created')}</th>
                    <th className="px-3 py-4">{t('user.wallet.confirmed')}</th>
                    <th className="px-3 py-4">{t('user.wallet.amount')}</th>
                    <th className="px-3 py-4">{t('user.wallet.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {depositHistory.length > 0 ? (
                    depositHistory.map((request) => (
                      <tr key={request.id} className="border-t border-gray-100">
                        <td className="px-3 py-5 text-[14px] font-black text-gray-900">{request.id}</td>
                        <td className="px-3 py-5 text-[14px] font-semibold text-[#52637A]">{request.method}</td>
                        <td className="px-3 py-5 text-[13px] font-medium text-[#94A3B8]">{request.createdAt}</td>
                        <td className="px-3 py-5 text-[13px] font-medium text-[#94A3B8]">{request.confirmedAt ?? '-'}</td>
                        <td className="px-3 py-5 text-[15px] font-black text-[#16A34A]">{formatUsd(request.amount)}</td>
                        <td className="px-3 py-5">
                          <span className="inline-flex min-h-[30px] items-center rounded-full bg-[#ECFDF3] px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#16A34A]">
                            {t('user.wallet.confirmedLabel')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-14 text-center">
                        <p className="text-[16px] font-bold text-gray-900">{t('user.wallet.noHistoryTitle')}</p>
                        <p className="mt-2 text-[13px] font-medium text-[#94A3B8]">
                          {t('user.wallet.noHistoryDesc')}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
