'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';

export default function SettingsPage() {
  const { t } = useI18n();
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@swiftguard.global');

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-20">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Main Content */}
        <main className="pt-12">
        
        {/* Sub Header */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
           <div className="flex items-center gap-10">
              <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">{t('user.settings.title')}</h1>
              <nav className="hidden md:flex gap-8">
                 <Link href="/commission-table" className="text-[13px] font-bold text-gray-400 hover:text-gray-600">{t('user.settings.marketRates')}</Link>
                 <Link href="/support" className="text-[13px] font-bold text-gray-400 hover:text-gray-600">{t('user.settings.helpCenter')}</Link>
              </nav>
           </div>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8">
              <div className="bg-white rounded-[36px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-50">
                 
                 {/* Basic User Info */}
                 <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                       <div className="w-20 h-20 rounded-[28px] bg-orange-50 overflow-hidden shadow-inner flex items-center justify-center p-2 border-4 border-white shadow-orange-100/50">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="Large Avatar" className="w-full h-full object-cover" />
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                       </div>
                    </div>
                    <div>
                       <h2 className="text-[24px] font-black text-gray-900 tracking-tight leading-none mb-2">{name}</h2>
                       <p className="text-gray-400 text-[14px] font-medium">{t('user.settings.basicInfo')}</p>
                    </div>
                 </div>

                 {/* Basic Fields */}
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-8">
                       <div className="space-y-2 md:col-span-2">
                          <label htmlFor="settings-name" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t('user.settings.fullName')}</label>
                          <div className="relative">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>
                             </div>
                             <input
                                id="settings-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-[52px] pl-12 pr-4 bg-gray-50 border-none rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label htmlFor="settings-email" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t('user.settings.emailAddress')}</label>
                          <div className="relative">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                             </div>
                             <input 
                                id="settings-email"
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-[52px] pl-12 pr-4 bg-gray-50 border-none rounded-xl font-bold text-gray-800 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" 
                             />
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-end pt-2">
                       <button className="bg-primary hover:bg-[#E65C00] text-white px-8 py-3.5 rounded-xl font-bold text-[15px] shadow-[0_8px_25px_rgba(255,102,0,0.3)] transition-all">
                          {t('user.settings.saveChanges')}
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4">
              <div className="bg-primary rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-[0_25px_60px_rgba(255,102,0,0.3)] sticky top-28 group">
                 {/* Decorative Wallet Icon Background */}
                 <div className="absolute -right-10 -top-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                    <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                 </div>
                 
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-10">
                       <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-widest text-white/60 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">SwiftCard • 8821</span>
                    </div>

                    <div className="mb-12">
                       <p className="text-white/60 text-[12px] font-bold uppercase tracking-widest mb-1.5">Total Balance</p>
                       <p className="text-[44px] font-black leading-none tracking-tight">$142,850.00</p>
                       <p className="mt-3 text-[16px] font-bold text-[#86EFAC]">
                         Lợi nhuận mỗi ngày: 20$
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Bottom Grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
           <div className="h-full min-h-[408px] bg-white rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-gray-50">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-[16px] font-bold text-gray-900 leading-none">Recent Activity</h3>
                 <Link href="/order-status/1" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">View All</Link>
              </div>
              <div className="space-y-8">
                 {[
                   { title: 'Inbound Wire Transfer', desc: 'CHASE BANK • TODAY', amount: '+$12,400.00', status: 'Completed', color: 'text-emerald-500' },
                   { title: 'Invoice #SG-9921', desc: 'APPLE INC. • YESTERDAY', amount: '-$1,299.00', status: 'Completed', color: 'text-gray-900' },
                   { title: 'Currency Swap (USD/EUR)', desc: 'SELF TRANSFER • 2 DAYS AGO', amount: '$5,000.00', status: 'Settled', color: 'text-gray-900' },
                 ].map((item, i) => (
                   <div key={i} className="flex justify-between items-start gap-4">
                      <div className="flex gap-4 items-center">
                         <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                            {item.amount.includes('+') ? '📈' : '📉'}
                         </div>
                         <div>
                            <p className="text-[13.5px] font-bold text-gray-900 mb-0.5">{item.title}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.desc}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[14px] font-bold ${item.color} mb-0.5`}>{item.amount}</p>
                         <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{item.status}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="h-full min-h-[408px] bg-white rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col">
              <h3 className="text-[16px] font-bold text-gray-900 mb-10">Security</h3>
              <div className="space-y-6 flex-1">
                 <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                    <div className="flex gap-4 items-center">
                       <span className="text-xl">📱</span>
                       <div>
                          <p className="text-[13px] font-bold text-gray-900">Two-Factor Auth</p>
                          <p className="text-[10px] text-gray-400 font-medium">Active via Google Authenticator</p>
                       </div>
                    </div>
                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest bg-white h-8 px-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">Manage</button>
                 </div>
                 <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                    <div className="flex gap-4 items-center">
                       <span className="text-xl">🔑</span>
                       <div>
                          <p className="text-[13px] font-bold text-gray-900">Security Password</p>
                          <p className="text-[10px] text-gray-400 font-medium">Last updated 42 days ago</p>
                       </div>
                    </div>
                    <button className="text-[10px] font-bold text-white uppercase tracking-widest bg-primary h-8 px-4 rounded-lg shadow-sm shadow-orange-200">Update</button>
                 </div>
              </div>
              <div className="pt-6 mt-6 border-t border-gray-50">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                       Active Sessions
                    </span>
                    <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">3 Active</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center group">
                       <span className="text-[12px] font-bold text-gray-800">MacBook Pro 16&quot; • NYC</span>
                       <span className="text-[10px] font-bold text-orange-500 uppercase">Current</span>
                    </div>
                    <div className="flex justify-between items-center group">
                       <span className="text-[12px] font-medium text-gray-500">iPhone 15 Pro • London</span>
                       <span className="text-[10px] font-bold text-gray-300 uppercase">4h ago</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="h-full min-h-[408px] bg-white rounded-[40px] p-8 text-gray-900 border border-gray-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
              <div className="relative z-10">
                 <div className="mb-6 flex items-center justify-between gap-3">
                    <h4 className="text-[16px] font-bold">Exchange Balances</h4>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                       USDT
                    </span>
                 </div>

                 <div className="space-y-3">
                    {[
                      {
                        name: 'Binance',
                        logoSrc: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg',
                        logoAlt: 'Binance logo',
                      },
                      {
                        name: 'Bybit',
                        logoSrc: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Bybit_Logo.svg',
                        logoAlt: 'Bybit logo',
                      },
                      {
                        name: 'OKX',
                        logoSrc: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/OKX_logo.svg',
                        logoAlt: 'OKX logo',
                      },
                      {
                        name: 'Bitget',
                        logoSrc: 'https://www.bitget.com/baseasset/img/media-kit/logo-green-v3.svg',
                        logoAlt: 'Bitget logo',
                      },
                    ].map((exchange) => (
                      <div
                        key={exchange.name}
                        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                           <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
                              <img
                                src={exchange.logoSrc}
                                alt={exchange.logoAlt}
                                className="h-6 w-6 object-contain"
                              />
                           </div>
                           <span className="text-[14px] font-bold text-gray-900">{exchange.name}</span>
                        </div>
                        <span className="text-[14px] font-bold text-gray-600">0 USDT</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </main>
      </div>
    </div>
  );
}
