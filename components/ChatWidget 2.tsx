'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';

interface Message {
  id: number;
  from: 'user' | 'support';
  text: string;
  time: string;
}

function getAutoReply(msg: string, t: (key: string) => string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('order') || lower.includes('#sw')) return t('chat.auto.order');
  if (lower.includes('payment') || lower.includes('transfer') || lower.includes('money')) return t('chat.auto.payment');
  if (lower === 'hi' || lower === 'hello') return t('chat.auto.hello');
  return t('chat.auto.default');
}

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget({ prefillMessage }: { prefillMessage?: string }) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'support',
      text: t('chat.welcome'),
      time: nowTime(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextIsLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const savedEmail = localStorage.getItem('chatContactEmail') ?? '';
    setIsLoggedIn(nextIsLoggedIn);
    setContactEmail(savedEmail);
    if (!nextIsLoggedIn && !savedEmail) {
      setShowEmailPrompt(true);
    }
  }, []);

  // Auto-paste prefill message when opened
  useEffect(() => {
    if (isOpen && prefillMessage && messages.length === 1) {
      const timer = window.setTimeout(() => {
        setInput(prefillMessage);
        inputRef.current?.focus();
      }, 100);

      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, messages.length, prefillMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), from: 'user', text, time: nowTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        from: 'support',
        text: getAutoReply(text, t),
        time: nowTime(),
      };
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
      if (!isOpen) setUnread(u => u + 1);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const saveEmail = () => {
    const value = emailInput.trim();
    if (!isEmailValid(value)) {
      setEmailError(t('chat.email.invalid'));
      emailInputRef.current?.focus();
      return;
    }
    localStorage.setItem('chatContactEmail', value);
    setContactEmail(value);
    setEmailInput('');
    setEmailError('');
    setShowEmailPrompt(false);
  };

  const handleOpenChat = () => {
    const hasAccess = isLoggedIn || Boolean(contactEmail);
    if (!hasAccess) {
      setShowEmailPrompt(true);
      setIsOpen(false);
      return;
    }
    setIsOpen((current) => !current);
    setUnread(0);
  };

  return (
    <>
      {/* Chat Bubble */}
      <button
        onClick={handleOpenChat}
        className={`fixed bottom-6 right-6 z-50 w-[62px] h-[62px] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(255,102,0,0.4)] transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-900 rotate-0 scale-100' 
            : 'bg-primary hover:scale-110 hover:shadow-[0_12px_40px_rgba(255,102,0,0.5)]'
        }`}
        aria-label={t('chat.open')}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 512 512" fill="white">
            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/>
          </svg>
        )}
        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}
        {/* Live dot when closed */}
        {!isOpen && (
          <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"/>
          </span>
        )}
      </button>

      {showEmailPrompt ? (
        <div className="fixed bottom-[88px] right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-[16px] font-bold text-gray-900">{t('chat.email.title')}</h4>
              <p className="mt-1 text-[12px] leading-5 text-gray-500">{t('chat.email.desc')}</p>
            </div>
            <button
              type="button"
              aria-label={t('common.close')}
              className="text-gray-400 hover:text-gray-700"
              onClick={() => setShowEmailPrompt(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={emailInputRef}
              type="email"
              value={emailInput}
              onChange={(event) => {
                setEmailInput(event.target.value);
                if (emailError) setEmailError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveEmail();
                }
              }}
              aria-label={t('chat.email.inputLabel')}
              placeholder={t('chat.email.placeholder')}
              className="h-[44px] flex-1 rounded-xl border border-gray-200 px-3 text-[13px] outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={saveEmail}
              className="h-[44px] rounded-xl bg-primary px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#E65C00]"
            >
              {t('chat.email.continue')}
            </button>
          </div>
          {emailError ? <p className="mt-2 text-[12px] text-red-500">{emailError}</p> : null}
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => setShowEmailPrompt(false)}
              className="mt-2 text-[12px] font-medium text-primary underline underline-offset-4"
            >
              {t('chat.email.forgot')}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Chat Panel */}
      <div className={`fixed bottom-[88px] right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6600] to-[#E65C00] px-6 py-5 flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-[16px] bg-white/20 flex items-center justify-center text-white text-xl font-bold shadow-inner">
              RS
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"/>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-[15px] leading-none mb-1">{t('chat.supportTitle')}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
              <span className="text-white/70 text-[11px] font-medium">{t('chat.onlineStatus')}</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label={t('common.close')} className="text-white/60 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-[320px] max-h-[380px] bg-[#F9FAFB]">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2.5 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              {msg.from === 'support' && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 mb-1">
                  RS
                </div>
              )}

              <div className={`flex flex-col gap-1 max-w-[72%] ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-[13.5px] font-medium leading-[1.6] ${
                  msg.from === 'user'
                    ? 'bg-primary text-white rounded-br-sm shadow-sm shadow-orange-200'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 font-medium px-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                RS
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"/>

        {/* Input Area */}
        <div className="px-4 py-4 bg-white flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              aria-label={t('chat.messageSupport')}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              className="w-full h-[46px] pl-4 pr-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-gray-300"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-[46px] h-[46px] bg-primary hover:bg-[#E65C00] text-white rounded-2xl flex items-center justify-center shadow-sm shadow-orange-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        {/* Footer note */}
        <div className="px-5 pb-4 flex items-center justify-center gap-1.5 bg-white">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-300"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span className="text-[10px] text-gray-300 font-medium">
            {locale === 'vi' ? 'Ma hoa dau-cuoi · Ria Support' : 'End-to-end encrypted · Ria Support'}
          </span>
        </div>

      </div>
    </>
  );
}
