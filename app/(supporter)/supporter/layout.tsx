'use client';

import { I18nProvider, useI18n } from '@/components/I18nProvider';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
});

function SupporterSessionFallback() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] px-6">
      <div className="rounded-[28px] border border-gray-100 bg-white px-8 py-6 text-center shadow-[0_20px_50px_rgba(17,24,39,0.06)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6" />
            <path d="M2.1 11a10 10 0 1 0 3-6.7L8 8" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-gray-700">
          {t('supporter.sessionChecking')}
        </p>
      </div>
    </div>
  );
}

export default function SupporterLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const userRole = sessionStorage.getItem('userRole');

    if (!isLoggedIn || userRole !== 'supporter') {
      router.replace('/login');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return (
      <I18nProvider>
        <SupporterSessionFallback />
        <ChatWidget />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      {children}
      <ChatWidget />
    </I18nProvider>
  );
}
