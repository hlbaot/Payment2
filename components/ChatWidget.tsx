'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  appendConversationMessage,
  loadSupportConversations,
  SUPPORT_UPDATED_EVENT,
} from '@/data/fake/runtime-store';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string | number;
  from: 'user' | 'support';
  text: string;
  time: string;
  status?: 'sending' | 'sent' | 'error';
  imageUrl?: string;
}

const CHAT_CONTACT_EMAIL_STORAGE_KEY = 'chatContactEmail';
const SUPPORT_STORAGE_KEY = 'shared-support-conversations';

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
  const BUBBLE_SIZE = 62;
  const PANEL_WIDTH = 380;
  const EMAIL_PROMPT_WIDTH = 360;
  const VIEWPORT_PADDING = 24;
  const BUBBLE_BOTTOM_OFFSET = 24;
  const PANEL_GAP = 26;
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentRole, setCurrentRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sessionUserName, setSessionUserName] = useState('John Doe');
  const [sessionUserEmail, setSessionUserEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [input, setInput] = useState('');
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number } | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'support',
      text: t('chat.welcome'),
      time: nowTime(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [supportOnline, setSupportOnline] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousMessageCountRef = useRef(0);
  const notificationPermissionRef = useRef<NotificationPermission>('default');
  const socketRef = useRef<Socket | null>(null);
  const isOpenRef = useRef(false);
  const socketIdentityRef = useRef('');
  const activeEmailRef = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutIdsRef = useRef<Set<number>>(new Set());
  const storageSyncTimerRef = useRef<number | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const messageSignatureRef = useRef('');
  const typingSignalActiveRef = useRef(false);

  // Request Notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          notificationPermissionRef.current = perm;
        });
      }
    }
  }, []);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const dragMovedRef = useRef(false);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const clearTrackedTimeout = useCallback((timerId: number | null) => {
    if (timerId === null) return;
    window.clearTimeout(timerId);
    timeoutIdsRef.current.delete(timerId);
  }, []);
  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      timeoutIdsRef.current.delete(timerId);
      callback();
    }, delay);
    timeoutIdsRef.current.add(timerId);
    return timerId;
  }, []);
  const getMessageSignature = useCallback((items: Message[]) =>
    JSON.stringify(
      items.map((message) => ({
        from: message.from,
        text: message.text,
        time: message.time,
        status: message.status ?? '',
        imageUrl: message.imageUrl ?? '',
      }))
    ), []);
  const setMessagesIfChanged = useCallback((updater: Message[] | ((current: Message[]) => Message[])) => {
    setMessages((current) => {
      const next = typeof updater === 'function' ? (updater as (value: Message[]) => Message[])(current) : updater;
      const currentSignature = messageSignatureRef.current || getMessageSignature(current);
      const nextSignature = getMessageSignature(next);

      if (nextSignature === currentSignature) {
        return current;
      }

      messageSignatureRef.current = nextSignature;
      return next;
    });
  }, [getMessageSignature]);
  const scheduleConversationSync = useCallback((syncFn: () => void) => {
    clearTrackedTimeout(storageSyncTimerRef.current);
    storageSyncTimerRef.current = scheduleTimeout(() => {
      storageSyncTimerRef.current = null;
      syncFn();
    }, 100);
  }, [clearTrackedTimeout, scheduleTimeout]);
  const playNotificationTone = useCallback((frequency: number, gainValue: number, duration: number) => {
    try {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;

      const context = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;

      if (context.state === 'suspended') {
        void context.resume().catch(() => undefined);
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch {
      // silent fail
    }
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    messageSignatureRef.current = getMessageSignature(messages);
  }, [getMessageSignature, messages]);

  useEffect(() => {
    activeEmailRef.current = (sessionUserEmail || contactEmail).trim().toLowerCase();
  }, [sessionUserEmail, contactEmail]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      clearTrackedTimeout(storageSyncTimerRef.current);
      clearTrackedTimeout(typingStopTimerRef.current);
      timeoutIds.forEach((timerId) => window.clearTimeout(timerId));
      timeoutIds.clear();
      socketRef.current?.disconnect();
      socketRef.current = null;
      socketIdentityRef.current = '';
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [clearTrackedTimeout]);

  useEffect(() => {
    const getDefaultBubblePosition = () => ({
      x: window.innerWidth - BUBBLE_SIZE - VIEWPORT_PADDING,
      y: window.innerHeight - BUBBLE_SIZE - BUBBLE_BOTTOM_OFFSET,
    });

    const clampBubblePosition = (position: { x: number; y: number }) => ({
      x: Math.min(Math.max(VIEWPORT_PADDING, position.x), window.innerWidth - BUBBLE_SIZE - VIEWPORT_PADDING),
      y: Math.min(Math.max(VIEWPORT_PADDING, position.y), window.innerHeight - BUBBLE_SIZE - VIEWPORT_PADDING),
    });

    const syncPosition = () => {
      setBubblePosition((current) => clampBubblePosition(current ?? getDefaultBubblePosition()));
    };

    syncPosition();
    window.addEventListener('resize', syncPosition);
    return () => {
      window.removeEventListener('resize', syncPosition);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextIsLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const savedEmail = localStorage.getItem(CHAT_CONTACT_EMAIL_STORAGE_KEY) ?? '';
    const nextUserName = sessionStorage.getItem('userName') ?? 'John Doe';
    const nextUserEmail = sessionStorage.getItem('userEmail') ?? savedEmail;
    const nextUserRole = sessionStorage.getItem('userRole') ?? '';
    setIsLoggedIn(nextIsLoggedIn);
    setCurrentRole(nextUserRole);
    setContactEmail(savedEmail);
    setSessionUserName(nextUserName);
    setSessionUserEmail(nextUserEmail);
    if (!nextIsLoggedIn && !savedEmail) {
      setShowEmailPrompt(true);
    }
  }, []);

  useEffect(() => {
    // Khởi tạo Socket.io client khi có email (đã login hoặc đã điền prompt)
    const currentEmail = (sessionUserEmail || contactEmail).trim().toLowerCase();
    if (!currentEmail) return undefined;
    let disposed = false;
    let socketIo: Socket | null = null;
    let removeListeners = () => undefined;

    if (socketRef.current && socketIdentityRef.current === currentEmail) {
      return undefined;
    }

    socketRef.current?.disconnect();
    socketRef.current = null;
    socketIdentityRef.current = '';

    // Kích hoạt custom server endpoint (Next.js serverless API cho Socket.io)
    void fetch('/api/socket').finally(() => {
      if (disposed) return;

      socketIo = io({
        path: '/api/socket',
        addTrailingSlash: false,
      });

      socketRef.current = socketIo;
      socketIdentityRef.current = currentEmail;
      removeListeners = () => {
        socketIo?.removeAllListeners();
      };

      // Trạng thái Online/Offline
      socketIo.on('connect', () => {
        socketIo?.emit('user-online', { email: currentEmail, role: 'user' });
      });

      socketIo.on('user-status', (data) => {
        if (data.role === 'supporter') {
          setSupportOnline((current) => {
            const nextOnline = data.status === 'online';
            return current === nextOnline ? current : nextOnline;
          });
        }
      });

      // Nhận tin nhắn mới từ Server (Push real-time)
      socketIo.on('receive-message', (data) => {
        if ((data.toEmail ?? '').trim().toLowerCase() === currentEmail && data.from === 'support') {
          let appended = false;
          setMessagesIfChanged((prev) => {
            const nextMessage: Message = {
              id: `support-${Date.now()}`,
              from: 'support',
              text: data.text ?? '',
              time: data.time || nowTime(),
              status: 'sent',
              imageUrl: data.imageUrl,
            };
            const lastMessage = prev[prev.length - 1];
            const isDuplicate =
              lastMessage?.from === nextMessage.from &&
              lastMessage?.text === nextMessage.text &&
              lastMessage?.time === nextMessage.time &&
              lastMessage?.imageUrl === nextMessage.imageUrl;

            if (isDuplicate) {
              return prev;
            }

            appended = true;
            previousMessageCountRef.current = Math.max(previousMessageCountRef.current, prev.length + 1);
            return [...prev, nextMessage];
          });

          // Unread badge
          if (appended && !isOpenRef.current) {
            setUnread((current) => current + 1);
          }

          // Browser Notification when tab is hidden
          if (appended && document.hidden && notificationPermissionRef.current === 'granted') {
            new Notification('💬 Hỗ trợ viên trả lời', {
              body: data.text || 'Gửi ảnh đính kèm',
              icon: '/favicon.ico',
              tag: 'support-reply',
            });
          }

          if (appended) {
            playNotificationTone(660, 0.1, 0.3);
          }
        }
      });

      // Trạng thái "Đang nhập..."
      socketIo.on('user-typing', (data) => {
        if ((data.toEmail ?? '').trim().toLowerCase() === currentEmail && data.from === 'support') {
          setIsTyping(true);
        }
      });

      socketIo.on('user-stop-typing', (data) => {
        if ((data.toEmail ?? '').trim().toLowerCase() === currentEmail && data.from === 'support') {
          setIsTyping(false);
        }
      });

    });

    return () => {
      disposed = true;
      removeListeners();
      socketIo?.disconnect();
      if (socketRef.current === socketIo) {
        socketRef.current = null;
        socketIdentityRef.current = '';
      }
    };
  }, [contactEmail, playNotificationTone, sessionUserEmail, setMessagesIfChanged]);

  // Xử lý kiện Gửi Trạng thái đang nhập báo lên Server
  useEffect(() => {
    const currentEmail = activeEmailRef.current;
    const socket = socketRef.current;
    if (!socket || !currentEmail) return undefined;

    clearTrackedTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = null;

    if (input.trim().length === 0) {
      if (typingSignalActiveRef.current) {
        socket.emit('stop-typing', { toEmail: currentEmail, from: 'user' });
        typingSignalActiveRef.current = false;
      }
      return undefined;
    }

    if (!typingSignalActiveRef.current) {
      socket.emit('typing', { toEmail: currentEmail, from: 'user' });
      typingSignalActiveRef.current = true;
    }

    typingStopTimerRef.current = scheduleTimeout(() => {
      socketRef.current?.emit('stop-typing', { toEmail: currentEmail, from: 'user' });
      typingSignalActiveRef.current = false;
      typingStopTimerRef.current = null;
    }, 2000);

    return () => {
      clearTrackedTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    };
  }, [clearTrackedTimeout, contactEmail, input, scheduleTimeout, sessionUserEmail]);

  useEffect(() => {
    if (!isLoggedIn || !sessionUserEmail) return undefined;

    const normalizedEmail = sessionUserEmail.toLowerCase();
    const syncConversation = () => {
      const conversation = loadSupportConversations().find(
        (item) => (item.userEmail ?? '').toLowerCase() === normalizedEmail
      );

      if (!conversation) return;

      const nextMessages: Message[] = conversation.messages.map((message) => ({
        id: message.id,
        from: message.sender === 'user' ? 'user' : 'support',
        text: message.text,
        time: message.time,
        imageUrl: message.imageUrl,
        status: 'sent',
      }));

      if (previousMessageCountRef.current > 0 && conversation.messages.length > previousMessageCountRef.current) {
        const newMessages = conversation.messages.slice(previousMessageCountRef.current);
        const supportReplies = newMessages.filter((message) => message.sender === 'supporter').length;
        if (supportReplies > 0 && !isOpenRef.current) {
          setUnread((current) => current + supportReplies);
        }
      }

      previousMessageCountRef.current = conversation.messages.length;
      setMessagesIfChanged(nextMessages);
    };

    syncConversation();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SUPPORT_STORAGE_KEY) {
        scheduleConversationSync(syncConversation);
      }
    };

    const handleSupportUpdated = () => {
      scheduleConversationSync(syncConversation);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SUPPORT_UPDATED_EVENT, handleSupportUpdated);

    return () => {
      clearTrackedTimeout(storageSyncTimerRef.current);
      storageSyncTimerRef.current = null;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SUPPORT_UPDATED_EVENT, handleSupportUpdated);
    };
  }, [clearTrackedTimeout, isLoggedIn, scheduleConversationSync, sessionUserEmail, setMessagesIfChanged]);

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
  }, [messages.length, isOpen]);

  useEffect(() => {
    const handleOpenChatGlobal = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChatGlobal);
    return () => window.removeEventListener('open-chat', handleOpenChatGlobal);
  }, []);

  // Retry helper: attempt fn up to maxRetries times with exponential backoff
  const withRetry = (fn: () => void, maxRetries = 3, delayMs = 600) => {
    let attempt = 0;
    const attempt_fn = () => {
      try {
        fn();
      } catch {
        attempt++;
        if (attempt < maxRetries) {
          scheduleTimeout(attempt_fn, delayMs * Math.pow(2, attempt));
        }
      }
    };
    attempt_fn();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (isOffline) {
      // Show offline error immediately on the optimistic message
      const tempId = Date.now();
      setMessagesIfChanged((prev) => [...prev, { id: tempId, from: 'user', text, time: nowTime(), status: 'error' }]);
      return;
    }
    const currentEmail = activeEmailRef.current;
    
    const tempId = Date.now();
    const nextTime = nowTime();

    if (isLoggedIn && sessionUserEmail) {
      // Optimistic update locally
      setMessagesIfChanged((prev) => [...prev, { id: tempId, from: 'user', text, time: nextTime, status: 'sending' }]);
      setInput('');

      // Simulate API call delay with retry on failure
      const sendWithRetry = () => {
        withRetry(() => {
          appendConversationMessage({
            userName: sessionUserName,
            userEmail: activeEmailRef.current || sessionUserEmail,
            sender: 'user',
            text,
          });
          setMessagesIfChanged((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)));

            const socket = socketRef.current;
            if (socket) {
              socket.emit('send-message', {
                toEmail: activeEmailRef.current || sessionUserEmail,
                from: 'user',
                text,
                time: nextTime
              });
          }
        });
      };
      scheduleTimeout(sendWithRetry, 500);
      return;
    }

    setMessagesIfChanged((prev) => [...prev, { id: tempId, from: 'user', text, time: nextTime, status: 'sending' }]);
    setInput('');

    scheduleTimeout(() => {
      setMessagesIfChanged((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)));
      setIsTyping(true);

      const socket = socketRef.current;
      if (socket && currentEmail) {
        socket.emit('send-message', {
          toEmail: currentEmail,
          from: 'user',
          text,
          time: nextTime
        });
      }

      scheduleTimeout(() => {
        const reply: Message = {
          id: Date.now() + 1,
          from: 'support',
          text: getAutoReply(text, t),
          time: nowTime(),
          status: 'sent'
        };
        setMessagesIfChanged((prev) => [...prev, reply]);
        setIsTyping(false);
        if (!isOpenRef.current) setUnread(u => u + 1);
      }, 1200 + Math.random() * 800);
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const nextTime = nowTime();
      const tempId = Date.now();
      
      // Optimistic upload
      setMessagesIfChanged((prev) => [...prev, { id: tempId, from: 'user', text: '', time: nextTime, status: 'sending', imageUrl }]);

      scheduleTimeout(() => {
        // Change to sent
        setMessagesIfChanged((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)));

        if (isLoggedIn && sessionUserEmail) {
           appendConversationMessage({
             userName: sessionUserName,
             userEmail: activeEmailRef.current || sessionUserEmail,
             sender: 'user',
             text: '',
             imageUrl
           });
        }

        const currentEmail = activeEmailRef.current;
        const socket = socketRef.current;
        if (socket && currentEmail) {
          socket.emit('send-message', {
            toEmail: currentEmail,
            from: 'user',
            text: '',
            imageUrl,
            time: nextTime
          });
        }
      }, 1500); 
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if ((localStorage.getItem(CHAT_CONTACT_EMAIL_STORAGE_KEY) ?? '') !== value) {
      localStorage.setItem(CHAT_CONTACT_EMAIL_STORAGE_KEY, value);
    }
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

  const handleBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!bubblePosition) return;

    dragMovedRef.current = false;
    setIsDragging(true);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: bubblePosition.x,
      originY: bubblePosition.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragMovedRef.current = true;
    }

    const nextX = dragState.originX + deltaX;
    const nextY = dragState.originY + deltaY;

    pendingPositionRef.current = {
      x: Math.min(Math.max(VIEWPORT_PADDING, nextX), window.innerWidth - BUBBLE_SIZE - VIEWPORT_PADDING),
      y: Math.min(Math.max(VIEWPORT_PADDING, nextY), window.innerHeight - BUBBLE_SIZE - VIEWPORT_PADDING),
    };

    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(() => {
        if (pendingPositionRef.current) {
          setBubblePosition(pendingPositionRef.current);
        }
        rafRef.current = null;
      });
    }
  };

  const handleBubblePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleBubbleClick = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }

    handleOpenChat();
  };

  if (!mounted) {
    return null;
  }

  if (currentRole === 'supporter') {
    return null;
  }

  const resolvedBubblePosition =
    bubblePosition ?? {
      x: VIEWPORT_PADDING,
      y: VIEWPORT_PADDING,
    };
  const panelLeft = Math.min(
    Math.max(VIEWPORT_PADDING, resolvedBubblePosition.x + BUBBLE_SIZE - PANEL_WIDTH),
    window.innerWidth - PANEL_WIDTH - VIEWPORT_PADDING
  );
  const panelTop = Math.max(VIEWPORT_PADDING, resolvedBubblePosition.y - PANEL_GAP - 520);
  const emailPromptLeft = Math.min(
    Math.max(VIEWPORT_PADDING, resolvedBubblePosition.x + BUBBLE_SIZE - EMAIL_PROMPT_WIDTH),
    window.innerWidth - EMAIL_PROMPT_WIDTH - VIEWPORT_PADDING
  );
  const emailPromptTop = Math.max(VIEWPORT_PADDING, resolvedBubblePosition.y - PANEL_GAP - 140);

  return (
    <>
      {/* Chat Bubble */}
      <button
        onClick={handleBubbleClick}
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={handleBubblePointerUp}
        onPointerCancel={handleBubblePointerUp}
        style={{ left: resolvedBubblePosition.x, top: resolvedBubblePosition.y }}
        className={`fixed z-50 w-[62px] h-[62px] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(255,102,0,0.4)] touch-none select-none will-change-transform ${
          isDragging ? 'transition-none cursor-grabbing' : 'transition-all duration-300 cursor-grab'
        } ${
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
        {!isOpen && supportOnline && (
          <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"/>
          </span>
        )}
      </button>

      {showEmailPrompt ? (
        <div
          style={{ left: emailPromptLeft, top: emailPromptTop }}
          className="fixed z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        >
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
      <div
        style={{ left: panelLeft, top: panelTop }}
        className={`fixed z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}
      >
        
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
              <span className={`w-1.5 h-1.5 ${supportOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'} rounded-full`}/>
              <span className="text-white/70 text-[11px] font-medium">
                {supportOnline ? t('chat.onlineStatus') : 'Ngoại tuyến'}
              </span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label={t('common.close')} className="text-white/60 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Offline banner */}
        {isOffline && (
          <div className="flex items-center gap-2 bg-red-500 px-4 py-2 text-[12px] font-semibold text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            Mất kết nối — Tin nhắn sẽ được gửi lại khi có mạng
          </div>
        )}

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
                } ${msg.status === 'sending' ? 'opacity-70' : 'opacity-100'}`}>
                  {msg.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.imageUrl} alt="attachment" className="max-w-full rounded-xl object-contain mb-2" />
                  ) : null}
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 font-medium px-1">
                  {msg.time}{' '}
                  {msg.from === 'user' && (
                    msg.status === 'sending' ? <span>• Đang gửi...</span>
                    : msg.status === 'error'
                      ? <button
                          type="button"
                          onClick={() => {
                            // Remove error msg and retry
                            setMessagesIfChanged((prev) => prev.filter((m) => m.id !== msg.id));
                            setInput(msg.text);
                            scheduleTimeout(() => handleSend(), 100);
                          }}
                          className="ml-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-200"
                        >
                          ⚠ Gửi lại
                        </button>
                      : <span>• Đã gửi</span>
                  )}
                </span>
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
        <div className="px-4 py-4 bg-white flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-[40px] h-[40px] rounded-2xl hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Upload Image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              aria-label={t('chat.messageSupport')}
              type="text"
              value={input}
              maxLength={500}
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
