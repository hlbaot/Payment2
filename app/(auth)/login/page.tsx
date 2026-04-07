'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider } from '@/components/I18nProvider';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import { fakeUsers, type FakeUserRole } from '@/data/fake/users';
import { getClientPortalRole, getPortalConfig } from '@/lib/portal';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portalRole, setPortalRole] = useState<FakeUserRole>('user');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalRole(getClientPortalRole());
  }, []);

  const portalConfig = getPortalConfig(portalRole);
  const demoAccounts = useMemo(
    () => fakeUsers.filter((account) => account.role === portalRole),
    [portalRole]
  );

  const saveSession = (role: FakeUserRole, userName: string, userEmail: string, walletBalance: number) => {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('userEmail', userEmail);
    sessionStorage.setItem('walletBalance', String(walletBalance));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      const normalizedEmail = email.trim().toLowerCase();

      const matchedUser = fakeUsers.find(
        (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
      );

      if (matchedUser) {
        if (matchedUser.role !== portalRole) {
          setError(`This portal only allows ${portalRole} accounts.`);
          return;
        }

        saveSession(
          matchedUser.role,
          matchedUser.userName,
          matchedUser.email,
          matchedUser.walletBalance
        );
        router.push(matchedUser.destination);
        return;
      }

      if (portalRole !== 'user') {
        setError(`Use a valid ${portalRole} account for this portal.`);
        return;
      }

      const validInviteCode = 'VIP888';

      if (inviteCode !== validInviteCode) {
        setError('Invite code is invalid. Please try again.');
        return;
      }

      saveSession('user', normalizedEmail.split('@')[0] || 'New User', normalizedEmail, 0);
      router.push('/counter-market');
    }, 1200);
  };

  const handleDemoLogin = (role: FakeUserRole) => {
    const selectedDemo = fakeUsers.find((account) => account.role === role);

    if (!selectedDemo || selectedDemo.role !== portalRole) {
      return;
    }

    setEmail(selectedDemo.email);
    setPassword(selectedDemo.password);
    saveSession(
      selectedDemo.role,
      selectedDemo.userName,
      selectedDemo.email,
      selectedDemo.walletBalance
    );

    router.push(selectedDemo.destination);
  };

  return (
    <I18nProvider>
      <>
        <Navbar />
        <ChatWidget />
        <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-white px-4 pb-8 pt-16 sm:px-6 sm:pb-10 sm:pt-20 md:px-8">
          <div className="mx-auto flex w-full items-center justify-center">
            <section className="mx-auto w-full max-w-[470px] rounded-[24px] border border-[#D7DCE5] bg-white px-6 py-7 shadow-[0_8px_22px_rgba(15,23,42,0.02)] sm:px-7 sm:py-8">
              <form onSubmit={handleLogin} className="mx-auto flex w-full max-w-[360px] flex-col">
                <h1 className="text-center text-[24px] font-bold tracking-[-0.04em] text-[#1C1C1C] sm:text-[28px]">
                  {portalConfig.heading}
                </h1>

                <p className="mt-3 text-center text-[13px] leading-6 text-[#6A7690] sm:text-[14px]">
                  {portalConfig.description}
                </p>

                {error ? (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-[13px] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  </div>
                ) : null}

                <div className="mt-7 sm:mt-8">
                  <label
                    htmlFor="login-email"
                    className="block text-[15px] font-bold tracking-[-0.03em] text-[#1F1F1F] sm:text-[16px]"
                  >
                    Phone or email
                  </label>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-3 h-[50px] w-full rounded-[10px] border border-[#D5DAE3] bg-white px-4 text-[15px] text-[#1F2937] outline-none transition-colors focus:border-[#B8C2D1] sm:h-[52px] sm:text-[16px]"
                    required
                  />
                </div>

                <div className="mt-6 sm:mt-7">
                  <label
                    htmlFor="login-password"
                    className="block text-[15px] font-bold tracking-[-0.03em] text-[#1F1F1F] sm:text-[16px]"
                  >
                    Password
                  </label>
                  <div className="relative mt-3">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[50px] w-full rounded-[10px] border border-[#D5DAE3] bg-white px-4 pr-14 text-[15px] text-[#1F2937] outline-none transition-colors focus:border-[#B8C2D1] sm:h-[52px] sm:text-[16px]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 text-[#6E7A92]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>

                {portalConfig.inviteEnabled ? (
                  <div className="mt-6 sm:mt-7">
                    <label
                      htmlFor="login-invite-code"
                      className="block text-[15px] font-bold tracking-[-0.03em] text-[#1F1F1F] sm:text-[16px]"
                    >
                      Invite code
                    </label>
                    <input
                      id="login-invite-code"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter your invite code"
                      className="mt-3 h-[50px] w-full rounded-[10px] border border-[#D5DAE3] bg-white px-4 text-[15px] text-[#1F2937] outline-none transition-colors focus:border-[#B8C2D1] sm:h-[52px] sm:text-[16px]"
                    />
                  </div>
                ) : null}

                <Link
                  href="/forgot-password"
                  className="mt-7 text-center text-[15px] font-bold tracking-[-0.03em] text-primary sm:mt-8 sm:text-[16px]"
                >
                  Forgot your password?
                </Link>

                <p className="mx-auto mt-8 max-w-[360px] text-center text-[11px] leading-[1.7] tracking-[-0.02em] text-[#6A7690] sm:mt-10 sm:text-[12px]">
                  By continuing you agree to our{' '}
                  <Link href="/terms" className="font-bold text-primary">
                    Terms and conditions
                  </Link>
                  ,{' '}
                  <Link href="/privacy" className="font-bold text-primary">
                    Privacy policy
                  </Link>
                  , and{' '}
                  <Link href="/cookie-settings" className="font-bold text-primary">
                    Cookie Notice.
                  </Link>
                </p>

                <div className="mt-6 grid gap-3 sm:mt-7">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => handleDemoLogin(account.role)}
                      className="flex w-full items-center justify-between rounded-[14px] border border-[#D7DCE5] bg-[#F8FAFC] px-4 py-3 text-left transition-colors hover:cursor-pointer hover:border-[#BFC7D6] hover:bg-[#F3F6FB]"
                    >
                      <span>
                        <span className="block text-[14px] font-bold text-[#1F1F1F] sm:text-[15px]">
                          {account.label}
                        </span>
                        <span className="mt-1 block text-[12px] text-[#6A7690] sm:text-[13px]">
                          {account.email}
                        </span>
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-primary">
                        Demo
                      </span>
                    </button>
                  ))}
                </div>



                <div className="mt-8 flex justify-end sm:mt-10">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-[48px] min-w-[112px] items-center justify-center rounded-full border-2 border-primary bg-primary px-7 text-[15px] font-bold tracking-[-0.03em] text-white shadow-[0_8px_20px_rgba(255,102,0,0.28)] transition-colors hover:cursor-pointer hover:bg-[#E65C00] disabled:cursor-wait disabled:opacity-70 sm:h-[50px] sm:min-w-[120px] sm:px-8 sm:text-[16px]"
                  >
                    {isLoading ? 'Loading...' : 'Login'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </>
    </I18nProvider>
  );
}

function EyeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
