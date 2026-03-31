'use client';

import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { I18nProvider } from "@/components/I18nProvider";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
});

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const hideFooterRoutes = new Set(["/find-a-location", "/orders"]);
  const shouldHideFooter = hideFooterRoutes.has(pathname);
  const shouldUseOwnHeaderOffset = pathname === "/find-a-location";
  const requiresLogin = useMemo(
    () =>
      [
        '/api-access',
        '/counter-market',
        '/create-order',
        '/order-status',
        '/orders',
        '/payment',
        '/portfolio',
        '/review',
        '/settings',
        '/wallet',
      ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  useEffect(() => {
    if (!requiresLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthorized(true);
      return;
    }

    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
      setIsAuthorized(false);
      router.replace('/');
      return;
    }

    setIsAuthorized(true);
  }, [requiresLogin, router]);

  if (requiresLogin && !isAuthorized) {
    return (
      <I18nProvider>
        <Navbar />
        <main
          className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6"
          style={{ marginTop: 'var(--header-height)' }}
        >
          <div className="rounded-[28px] border border-gray-100 bg-white px-8 py-6 text-center shadow-[0_20px_50px_rgba(17,24,39,0.06)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6" />
                <path d="M2.1 11a10 10 0 1 0 3-6.7L8 8" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-700">Checking your session...</p>
          </div>
        </main>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <Navbar />
      <main style={{ marginTop: shouldUseOwnHeaderOffset ? 0 : 'var(--header-height)' }}>
        {children}
      </main>
      {shouldHideFooter ? null : <Footer />}
      <ChatWidget />
    </I18nProvider>
  );
}
