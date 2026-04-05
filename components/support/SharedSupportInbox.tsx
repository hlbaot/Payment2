'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  createDepositRequest,
  DEPOSITS_UPDATED_EVENT,
  formatUsd,
  getWalletBalance,
  loadDepositRequests,
  loadSupportConversations,
  saveSupportConversations,
  SUPPORT_UPDATED_EVENT,
  type SupportConversation,
} from '@/data/fake/runtime-store';
import { io, Socket } from 'socket.io-client';
import { useMessages, useMarkAsRead } from '@/lib/hooks';

type ConversationFilter = 'all' | 'unread' | 'resolved';
type ConversationsUpdater =
  | SupportConversation[]
  | ((current: SupportConversation[]) => SupportConversation[]);

const SUPPORT_STORAGE_KEY = 'shared-support-conversations';
const DEPOSIT_STORAGE_KEY = 'shared-deposit-requests';

type SharedSupportInboxProps = {
  mode?: 'messages' | 'operations' | 'full';
};

export default function SharedSupportInbox({ mode = 'full' }: SharedSupportInboxProps) {
  const { t } = useI18n();
  const [conversationSearch, setConversationSearch] = useState('');
  const [filter] = useState<ConversationFilter>('all');
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositModalConversationId, setDepositModalConversationId] = useState<string | null>(null);
  const [, setPendingDepositCount] = useState(0);
  const [currentRole, setCurrentRole] = useState<'admin' | 'supporter' | 'user' | ''>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const notificationPermissionRef = useRef<NotificationPermission>('default');
  const [loadError, setLoadError] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutIdsRef = useRef<Set<number>>(new Set());
  const syncTimerRef = useRef<number | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const shouldSyncDepositsRef = useRef(false);
  const hasLoadedInitialConversationsRef = useRef(false);
  const conversationsSnapshotRef = useRef('');
  const persistedConversationsSnapshotRef = useRef('');
  const selectedIdRef = useRef('');
  const typingSignalActiveRef = useRef(false);

  // Request browser notification permission once
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

  // Debounce search — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(conversationSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [conversationSearch]);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const isSaving = useRef(false);
  const isLoadingOlderRef = useRef(false);
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
  const serializeConversations = useCallback((items: SupportConversation[]) => JSON.stringify(items), []);
  const syncPendingDepositCount = useCallback(() => {
    const nextCount = loadDepositRequests().filter((request) => request.status === 'Pending').length;
    setPendingDepositCount((current) => (current === nextCount ? current : nextCount));
  }, []);
  const setConversationsSafely = useCallback((updater: ConversationsUpdater) => {
    setConversations((current) => {
      const next =
        typeof updater === 'function'
          ? (updater as (value: SupportConversation[]) => SupportConversation[])(current)
          : updater;
      
      const nextSnapshot = serializeConversations(next);
      if (nextSnapshot === conversationsSnapshotRef.current) {
        return current;
      }

      conversationsSnapshotRef.current = nextSnapshot;
      return next;
    });
  }, [serializeConversations]);
  const syncConversationsFromStorage = useCallback(() => {
    const nextConversations = loadSupportConversations();
    const nextSnapshot = serializeConversations(nextConversations);

    if (nextSnapshot !== conversationsSnapshotRef.current) {
      conversationsSnapshotRef.current = nextSnapshot;
      persistedConversationsSnapshotRef.current = nextSnapshot;
      setConversations(nextConversations);
    }

    setSelectedId((current) =>
      nextConversations.some((conversation) => conversation.id === current)
        ? current
        : nextConversations[0]?.id || ''
    );
  }, [serializeConversations]);
  const scheduleConversationsSync = useCallback((includeDeposits = false) => {
    if (includeDeposits) {
      shouldSyncDepositsRef.current = true;
    }

    clearTrackedTimeout(syncTimerRef.current);
    syncTimerRef.current = scheduleTimeout(() => {
      syncTimerRef.current = null;

      if (shouldSyncDepositsRef.current) {
        shouldSyncDepositsRef.current = false;
        syncPendingDepositCount();
      }

      syncConversationsFromStorage();
    }, 100);
  }, [clearTrackedTimeout, scheduleTimeout, syncConversationsFromStorage, syncPendingDepositCount]);
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
      // AudioContext not supported or blocked â€” silent fail
    }
  }, []);

  // SWR: paginated messages for selected conversation
  const {
    messages: pagedMessages,
    isLoading: isLoadingMessages,
    isLoadingOlder,
    hasMore: hasOlderMessages,
    loadOlder,
    refresh,
    appendMessage: _appendMessage,       // ready for real API: call after socket receive-message
    updateMessageStatus: _updateMessageStatus, // ready for real API: call after send confirmation
  } = useMessages(selectedId || null);

  const markAsRead = useMarkAsRead();

  // Keep SWR actions fresh for the socket callback
  const swrActionsRef = useRef({ refresh, appendMessage: _appendMessage, updateMessageStatus: _updateMessageStatus });
  useEffect(() => {
    swrActionsRef.current = { refresh, appendMessage: _appendMessage, updateMessageStatus: _updateMessageStatus };
  }, [refresh, _appendMessage, _updateMessageStatus]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    conversationsSnapshotRef.current = serializeConversations(conversations);
  }, [conversations, serializeConversations]);
  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      clearTrackedTimeout(syncTimerRef.current);
      clearTrackedTimeout(typingStopTimerRef.current);
      timeoutIds.forEach((timerId) => window.clearTimeout(timerId));
      timeoutIds.clear();
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [clearTrackedTimeout]);

  // Infinite scroll upward — load older messages when user scrolls to top
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop < 80 && hasOlderMessages && !isLoadingOlderRef.current) {
        isLoadingOlderRef.current = true;
        const prevHeight = el.scrollHeight;
        loadOlder();
        // Restore scroll position after older messages are prepended
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevHeight;
          isLoadingOlderRef.current = false;
        });
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasOlderMessages, loadOlder]);

  useEffect(() => {
    try {
      const initialData = loadSupportConversations();
      const initialSnapshot = serializeConversations(initialData);
      conversationsSnapshotRef.current = initialSnapshot;
      persistedConversationsSnapshotRef.current = initialSnapshot;
      setConversations(initialData);
      setSelectedId((current) => current || initialData[0]?.id || '');
      setCurrentRole((sessionStorage.getItem('userRole') as 'admin' | 'supporter' | 'user' | null) ?? '');
      syncPendingDepositCount();
      setLoadError(false);
      hasLoadedInitialConversationsRef.current = true;
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [serializeConversations, syncPendingDepositCount]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedInitialConversationsRef.current) return;

    const nextSnapshot = serializeConversations(conversations);
    if (nextSnapshot === persistedConversationsSnapshotRef.current) return;

    isSaving.current = true;
    persistedConversationsSnapshotRef.current = nextSnapshot;
    conversationsSnapshotRef.current = nextSnapshot;
    saveSupportConversations(conversations);
    
    // Reset saving flag after a short delay
    const timerId = window.setTimeout(() => {
      isSaving.current = false;
    }, 100);
    timeoutIdsRef.current.add(timerId);
  }, [conversations, serializeConversations]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SUPPORT_STORAGE_KEY) {
        if (event.newValue && event.newValue === persistedConversationsSnapshotRef.current) {
          return;
        }
        scheduleConversationsSync();
        if (selectedIdRef.current) {
          void swrActionsRef.current.refresh();
        }
      }
      if (event.key === DEPOSIT_STORAGE_KEY) {
        scheduleConversationsSync(true);
      }
    };

    const handleSupportUpdated = () => {
      if (isSaving.current) return;
      scheduleConversationsSync();
      if (selectedIdRef.current) {
        void swrActionsRef.current.refresh();
      }
    };

    const handleDepositUpdated = () => {
      scheduleConversationsSync(true);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SUPPORT_UPDATED_EVENT, handleSupportUpdated);
    window.addEventListener(DEPOSITS_UPDATED_EVENT, handleDepositUpdated);
    syncPendingDepositCount();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SUPPORT_UPDATED_EVENT, handleSupportUpdated);
      window.removeEventListener(DEPOSITS_UPDATED_EVENT, handleDepositUpdated);
    };
    /*

      socketIo.on('connect', () => {
        socketIo.emit('user-online', { email: 'supporter@domain.com', role: 'supporter' });
      });

      socketIo.on('user-status', (data) => {
        if (data.role === 'user' && data.email) {
          setOnlineUsers(prev => ({ ...prev, [data.email.toLowerCase()]: data.status === 'online' }));
        }
      });

      socketIo.on('receive-message', (data) => {
        // Re-fetch conversations from local store
        if (data.from === 'user') {
          setConversations(loadSupportConversations());
          swrActionsRef.current.refresh(); // Sync SWR state with local store

          // Browser Notification when tab is not focused
          if (document.hidden && notificationPermissionRef.current === 'granted') {
            new Notification('💬 Tin nhắn mới', {
              body: data.text || 'Khách hàng vừa gửi ảnh đính kèm',
              icon: '/favicon.ico',
              tag: 'new-chat-message',
            });
          }

          // Audio ping using Web Audio API
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.12, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.35);
            }
          } catch {
            // AudioContext not supported — silent fail
          }
        }
      });

      socketIo.on('user-typing', (data) => {
        if (data.from === 'user' && data.toEmail) {
          setTypingUsers(prev => ({ ...prev, [data.toEmail.toLowerCase()]: true }));
        }
      });

      socketIo.on('user-stop-typing', (data) => {
        if (data.from === 'user' && data.toEmail) {
          setTypingUsers(prev => ({ ...prev, [data.toEmail.toLowerCase()]: false }));
        }
      });

      return () => {
        socketIo.disconnect();
      };
    });
    */

  }, [scheduleConversationsSync, syncPendingDepositCount]);

  useEffect(() => {
    let disposed = false;
    let socketIo: Socket | null = null;
    let removeListeners = () => undefined;

    const connectSocket = () => {
      socketIo = io({
        path: '/api/socket',
        addTrailingSlash: false,
      });
      socketRef.current = socketIo;

      const handleConnect = () => {
        socketIo?.emit('user-online', { email: 'supporter@domain.com', role: 'supporter' });
      };

      const handleUserStatus = (data: { role?: string; email?: string; status?: string }) => {
        if (data.role !== 'user' || !data.email) return;

        const normalizedEmail = data.email.toLowerCase();
        const isOnline = data.status === 'online';
        setOnlineUsers((current) => {
          if (current[normalizedEmail] === isOnline) {
            return current;
          }
          return { ...current, [normalizedEmail]: isOnline };
        });
      };

      const handleReceiveMessage = (data: {
        from?: string;
        toEmail?: string;
        text?: string;
        time?: string;
        imageUrl?: string;
      }) => {
        const incomingSender =
          data.from === 'user'
            ? 'user'
            : data.from === 'support'
              ? 'supporter'
              : null;
        if (!incomingSender) return;

        const normalizedEmail = data.toEmail?.trim().toLowerCase();
        if (!normalizedEmail) {
          scheduleConversationsSync();
          return;
        }

        let appendedMessage: SupportConversation['messages'][number] | null = null;
        let shouldAppendToSelectedPanel = false;

        setConversationsSafely((current) => {
          const targetConversation = current.find(
            (conversation) => conversation.userEmail.toLowerCase() === normalizedEmail
          );
          if (!targetConversation) {
            return current;
          }

          const incomingMessage: SupportConversation['messages'][number] = {
            id: `${targetConversation.id}-${Date.now()}`,
            sender: incomingSender,
            text: data.text ?? '',
            time:
              data.time ??
              new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }),
            status: 'sent',
            imageUrl: data.imageUrl,
          };

          const lastMessage = targetConversation.messages[targetConversation.messages.length - 1];
          shouldAppendToSelectedPanel = targetConversation.id === selectedIdRef.current;
          const isDuplicate =
            lastMessage?.sender === incomingMessage.sender &&
            lastMessage?.text === incomingMessage.text &&
            lastMessage?.time === incomingMessage.time &&
            lastMessage?.imageUrl === incomingMessage.imageUrl;

          if (isDuplicate) {
            return current;
          }

          appendedMessage = incomingMessage;

          return current.map((conversation) =>
            conversation.id === targetConversation.id
              ? {
                  ...conversation,
                  preview: incomingMessage.text || 'KhÃ¡ch hÃ ng vá»«a gá»­i áº£nh Ä‘Ã­nh kÃ¨m',
                  time: incomingMessage.time,
                  status:
                    incomingSender === 'user'
                      ? shouldAppendToSelectedPanel
                        ? 'Open'
                        : 'Unread'
                      : 'Open',
                  messages: [...conversation.messages, incomingMessage],
                }
              : conversation
          );
        });

        if (appendedMessage && shouldAppendToSelectedPanel) {
          swrActionsRef.current.appendMessage(appendedMessage);
        }

        if (!appendedMessage) {
          if (shouldAppendToSelectedPanel) {
            swrActionsRef.current.refresh();
          }
          scheduleConversationsSync();
        }

        if (
          incomingSender === 'user' &&
          document.hidden &&
          notificationPermissionRef.current === 'granted'
        ) {
          new Notification('ðŸ’¬ Tin nháº¯n má»›i', {
            body: data.text || 'KhÃ¡ch hÃ ng vá»«a gá»­i áº£nh Ä‘Ã­nh kÃ¨m',
            icon: '/favicon.ico',
            tag: 'new-chat-message',
          });
        }

        if (incomingSender === 'user') {
          playNotificationTone(880, 0.12, 0.35);
        }
      };

      const handleUserTyping = (data: { from?: string; toEmail?: string }) => {
        if (data.from !== 'user' || !data.toEmail) return;

        const normalizedEmail = data.toEmail.toLowerCase();
        setTypingUsers((current) => {
          if (current[normalizedEmail]) {
            return current;
          }
          return { ...current, [normalizedEmail]: true };
        });
      };

      const handleUserStopTyping = (data: { from?: string; toEmail?: string }) => {
        if (data.from !== 'user' || !data.toEmail) return;

        const normalizedEmail = data.toEmail.toLowerCase();
        setTypingUsers((current) => {
          if (!current[normalizedEmail]) {
            return current;
          }
          return { ...current, [normalizedEmail]: false };
        });
      };

      socketIo.on('connect', handleConnect);
      socketIo.on('user-status', handleUserStatus);
      socketIo.on('receive-message', handleReceiveMessage);
      socketIo.on('user-typing', handleUserTyping);
      socketIo.on('user-stop-typing', handleUserStopTyping);

      removeListeners = () => {
        socketIo?.off('connect', handleConnect);
        socketIo?.off('user-status', handleUserStatus);
        socketIo?.off('receive-message', handleReceiveMessage);
        socketIo?.off('user-typing', handleUserTyping);
        socketIo?.off('user-stop-typing', handleUserStopTyping);
      };
    };

    void fetch('/api/socket').finally(() => {
      if (disposed) return;
      connectSocket();
    });

    return () => {
      disposed = true;
      removeListeners();
      socketIo?.disconnect();
      if (socketRef.current === socketIo) {
        socketRef.current = null;
      }
    };
  }, [playNotificationTone, scheduleConversationsSync, setConversationsSafely]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch =
        debouncedSearch.length === 0 ||
        conversation.userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        conversation.preview.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' && conversation.status === 'Unread') ||
        (filter === 'resolved' && conversation.status === 'Resolved');

      return matchesSearch && matchesFilter;
    });
  }, [debouncedSearch, conversations, filter]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ??
    conversations[0];

  useEffect(() => {
    scrollToBottom();
  }, [pagedMessages.length, selectedConversation?.messages.length, selectedId]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    setConversationsSafely((current) =>
      current.map((conversation) =>
        conversation.id === conversationId && conversation.status === 'Unread'
          ? { ...conversation, status: 'Open' }
          : conversation
      )
    );
    // Call API to mark as read (uses lib/api.ts → real API when BE ready)
    markAsRead(conversationId);
  };

  const handleSendReply = () => {
    const trimmedReply = reply.trim();
    if (!trimmedReply) return;
    const targetConversationId = selectedId;
    const targetConversation = selectedConversation;
    if (!targetConversationId || !targetConversation) return;

    const nextTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    // Optimistic UI: Add 'sending' message directly to state
    const tempId = `temp-${Date.now()}`;
    setConversationsSafely((current) =>
      current.map((conversation) =>
        conversation.id === targetConversationId
          ? {
              ...conversation,
              preview: trimmedReply,
              time: nextTime,
              status: 'Open',
              messages: [
                ...conversation.messages,
                {
                  id: tempId,
                  sender: 'supporter',
                  text: trimmedReply,
                  time: nextTime,
                  status: 'sending',
                },
              ],
            }
          : conversation
      )
    );
    
    // Explicitly update SWR state so the right panel updates instantly
    _appendMessage({
      id: tempId,
      sender: 'supporter',
      text: trimmedReply,
      time: nextTime,
      status: 'sending'
    });
    
    setReply('');

    // Simulate API delay
    scheduleTimeout(() => {
      setConversationsSafely((current) =>
        current.map((conversation) =>
          conversation.id === targetConversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((msg) =>
                  msg.id === tempId ? { ...msg, id: `${conversation.id}-${Date.now()}`, status: 'sent' } : msg
                ),
              }
            : conversation
        )
      );
      
      swrActionsRef.current.updateMessageStatus(tempId, 'sent');

      if (typingSignalActiveRef.current) {
        socketRef.current?.emit('stop-typing', {
          toEmail: targetConversation.userEmail,
          from: 'support'
        });
        typingSignalActiveRef.current = false;
      }
      socketRef.current?.emit('send-message', {
        toEmail: targetConversation.userEmail,
        from: 'support',
        text: trimmedReply,
        time: nextTime
      });
    }, 600);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const targetConversationId = selectedId;
    const targetConversation = selectedConversation;
    if (!targetConversationId || !targetConversation) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const nextTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const tempId = `temp-img-${Date.now()}`;
      
      // Optimistic upload
      setConversationsSafely((current) =>
        current.map((conversation) =>
          conversation.id === targetConversationId
            ? {
                ...conversation,
                preview: 'Gửi ảnh đính kèm',
                time: nextTime,
                status: 'Open',
                messages: [
                  ...conversation.messages,
                  { id: tempId, sender: 'supporter', text: '', time: nextTime, status: 'sending', imageUrl },
                ],
              }
            : conversation
        )
      );
      
      _appendMessage({
        id: tempId,
        sender: 'supporter',
        text: '',
        time: nextTime,
        status: 'sending',
        imageUrl
      });

      // Simulate upload delay
      scheduleTimeout(() => {
        setConversationsSafely((current) =>
          current.map((conversation) =>
            conversation.id === targetConversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((msg) =>
                    msg.id === tempId ? { ...msg, id: `${conversation.id}-${Date.now()}`, status: 'sent' } : msg
                  ),
                }
              : conversation
          )
        );
        
        swrActionsRef.current.updateMessageStatus(tempId, 'sent');

        socketRef.current?.emit('send-message', {
          toEmail: targetConversation.userEmail,
          from: 'support',
          text: '',
          imageUrl,
          time: nextTime
        });
      }, 1500);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const nextSocket = socketRef.current;
    const targetEmail = selectedConversation?.userEmail;
    if (!nextSocket || !targetEmail) return undefined;

    clearTrackedTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = null;

    if (reply.trim().length === 0) {
      if (typingSignalActiveRef.current) {
        nextSocket.emit('stop-typing', { toEmail: targetEmail, from: 'support' });
        typingSignalActiveRef.current = false;
      }
      return undefined;
    }

    if (!typingSignalActiveRef.current) {
      nextSocket.emit('typing', { toEmail: targetEmail, from: 'support' });
      typingSignalActiveRef.current = true;
    }

    typingStopTimerRef.current = scheduleTimeout(() => {
      socketRef.current?.emit('stop-typing', { toEmail: targetEmail, from: 'support' });
      typingSignalActiveRef.current = false;
      typingStopTimerRef.current = null;
    }, 2000);

    return () => {
      clearTrackedTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    };
  }, [clearTrackedTimeout, reply, scheduleTimeout, selectedConversation?.userEmail]);

  const handleAddNote = async () => {
    const trimmedNote = noteDraft.trim();
    if (!trimmedNote) return;

    // Attach author + timestamp metadata
    const authorLabel = currentRole === 'admin' ? '[Admin]' : '[Supporter]';
    const timestamp = new Date().toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const noteWithMeta = `${authorLabel} ${timestamp} — ${trimmedNote}`;

    setIsSavingNote(true);
    try {
      // Optimistic update
      setConversationsSafely((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? { ...conversation, notes: [noteWithMeta, ...conversation.notes] }
            : conversation
        )
      );
      setNoteDraft('');
      // TODO (real API): await apiFetch(`/conversations/${selectedId}/notes`, {
      //   method: 'POST', body: JSON.stringify({ text: noteWithMeta })
      // });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleResolveConversation = () => {
    setConversationsSafely((current) =>
      current.map((conversation) =>
        conversation.id === selectedId
          ? { ...conversation, status: 'Resolved' }
          : conversation
      )
    );
  };

  const handleCreateDepositRequest = async () => {
    const nextAmount = Number(depositAmount.replace(/[^0-9.]/g, ''));
    const targetConversation =
      conversations.find((conversation) => conversation.id === depositModalConversationId) ?? selectedConversation;
    if (!targetConversation || !Number.isFinite(nextAmount) || nextAmount <= 0) return;

    // RBAC: Only supporter or admin can create deposits
    if (currentRole !== 'supporter' && currentRole !== 'admin') return;

    setIsSubmittingDeposit(true);
    try {
      // Mock path: persist locally
      createDepositRequest({
        conversationId: targetConversation.id,
        userName: targetConversation.userName,
        userEmail: targetConversation.userEmail,
        amount: nextAmount,
        method: 'Support Wallet Credit',
        note: '',
      });
      // TODO (real API): await apiFetch('/deposits', { method: 'POST', body: JSON.stringify({...}) });

      syncConversationsFromStorage();
      syncPendingDepositCount();
      if (targetConversation.id === selectedIdRef.current) {
        await swrActionsRef.current.refresh();
      }
      setDepositAmount('');
      setDepositModalConversationId(null);
      setDepositSuccess(true);
      scheduleTimeout(() => setDepositSuccess(false), 3000);
    } catch {
      // Surface error to user if needed
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const activeDepositConversation =
    conversations.find((conversation) => conversation.id === depositModalConversationId) ?? null;

  if (!selectedConversation) {
    return null;
  }

  const getTierLabel = (tier: SupportConversation['tier']) =>
    tier === 'Premium'
      ? t('supporter.tierPremium')
      : tier === 'Platinum'
        ? t('supporter.tierPlatinum')
        : t('supporter.tierStandard');

  const showChatPanel = mode === 'messages' || mode === 'full';
  const showOperationsPanel = mode === 'operations' || mode === 'full';
  const gridClassName =
    showChatPanel && showOperationsPanel
      ? 'xl:grid-cols-[320px_minmax(420px,1fr)_290px]'
      : 'xl:grid-cols-[320px_minmax(520px,1fr)]';

  return (
    <div className={`grid h-[100dvh] min-h-[680px] grid-cols-1 ${gridClassName}`}>
      <aside className="flex min-h-0 flex-col border-b border-r border-gray-200 bg-white xl:border-b-0">
        <div className="border-b border-gray-100 px-5 py-5">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA7BD]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder={t('supporter.searchConversations')}
              className="h-[48px] w-full rounded-2xl border border-[#E8EDF4] bg-[#F8FAFD] pl-12 pr-4 text-[14px] font-medium text-gray-800 outline-none transition-colors focus:border-primary"
            />
          </label>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">

          {/* Loading skeleton */}
          {isLoadingConversations && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-3 rounded-[24px] border border-transparent bg-white px-4 py-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-gray-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-gray-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoadingConversations && loadError && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-700">Không thể tải hội thoại</p>
                <p className="mt-1 text-[12px] text-gray-400">Kiểm tra kết nối và thử lại</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoadingConversations(true);
                  setLoadError(false);
                  scheduleTimeout(() => {
                    try {
                      const data = loadSupportConversations();
                      const dataSnapshot = serializeConversations(data);
                      conversationsSnapshotRef.current = dataSnapshot;
                      persistedConversationsSnapshotRef.current = dataSnapshot;
                      setConversations(data);
                      setSelectedId((c) => c || data[0]?.id || '');
                      setLoadError(false);
                    } catch {
                      setLoadError(true);
                    } finally {
                      setIsLoadingConversations(false);
                    }
                  }, 400);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#E65C00]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingConversations && !loadError && filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-gray-400">Không tìm thấy hội thoại</p>
            </div>
          )}

          {/* Conversation list */}
          {!isLoadingConversations && !loadError && filteredConversations.map((conversation) => {
            const isActive = conversation.id === selectedId;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => handleSelectConversation(conversation.id)}
                className={`mb-3 w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                  isActive
                    ? 'border-[#F3E7DE] bg-[#FFF8F3] shadow-sm'
                    : 'border-transparent bg-white hover:border-gray-100 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3F5F8] text-[14px] font-black text-[#64748B]">
                    {conversation.userName
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                    {onlineUsers[conversation.userEmail.toLowerCase()] || conversation.online ? (
                      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22C55E]"></span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[18px] font-bold tracking-tight text-gray-900">
                            {conversation.userName}
                          </p>
                        </div>
                        <p className="mt-1 text-[12px] font-semibold tracking-[0.01em] text-[#94A3B8]">
                          {conversation.userEmail}
                        </p>
                        <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-6 text-[#64748B]">
                          {conversation.preview}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-[12px] font-medium text-[#9AA7BD]">
                          {conversation.time}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`inline-flex min-h-[24px] items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] ${
                          conversation.tier === 'Platinum'
                            ? 'bg-[#E7F0FF] text-[#0F6CBD]'
                            : conversation.tier === 'Premium'
                              ? 'bg-[#FFF1E7] text-primary'
                              : 'bg-[#EEF2FF] text-[#4F46E5]'
                        }`}
                      >
                        {getTierLabel(conversation.tier)}
                      </span>
                      {conversation.status === 'Unread' ? (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]"></span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {showChatPanel ? (
      <section className="flex min-h-0 flex-col border-b border-r border-gray-200 bg-white xl:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F5F8] text-[14px] font-black text-[#64748B]">
              {selectedConversation.userName
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
              {onlineUsers[selectedConversation.userEmail.toLowerCase()] || selectedConversation.online ? (
                <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22C55E]"></span>
              ) : null}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-black tracking-tight text-gray-900">
                  {selectedConversation.userName}
                </h1>
                {currentRole === 'supporter' || currentRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDepositAmount('');
                      setDepositModalConversationId(selectedConversation.id);
                    }}
                    className="inline-flex min-h-[34px] items-center justify-center rounded-full bg-[#FFF3E8] px-4 text-[11px] font-black uppercase tracking-[0.16em] text-primary transition-colors hover:bg-[#FFE8D6]"
                  >
                    Lên đơn
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#94A3B8]">
                {selectedConversation.userEmail}
              </p>
              <p className="mt-2 text-[12px] font-black uppercase tracking-[0.18em] text-[#22C55E]">
                {onlineUsers[selectedConversation.userEmail.toLowerCase()] || selectedConversation.online ? t('supporter.online') : t('supporter.offline')}
              </p>
            </div>
          </div>

          {currentRole !== 'supporter' ? (
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors hover:bg-gray-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </button>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors hover:bg-gray-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.72 19.72 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors hover:bg-gray-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto bg-[#FCFCFD] px-6 py-8">
          {/* Load older messages indicator */}
          {isLoadingOlder && (
            <div className="mb-4 flex items-center justify-center gap-2 text-[12px] font-medium text-[#9AA7BD]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D1D5DB] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D1D5DB] [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D1D5DB] [animation-delay:240ms]" />
              <span>Đang tải tin nhắn cũ...</span>
            </div>
          )}

          {hasOlderMessages && !isLoadingOlder && (
            <button
              type="button"
              onClick={loadOlder}
              className="mb-4 w-full rounded-xl border border-gray-100 bg-[#F8FAFD] py-2 text-[12px] font-semibold text-[#9AA7BD] hover:bg-gray-50 transition-colors"
            >
              ↑ Tải tin nhắn cũ hơn
            </button>
          )}

          <div className="mx-auto mb-8 w-max rounded-xl bg-[#F3F5F8] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">
            {t('supporter.today')}
          </div>

          {/* Messages loading skeleton when first load */}
          {isLoadingMessages && pagedMessages.length === 0 && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex items-end gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  {i % 2 !== 0 && <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-gray-100" />}
                  <div className={`h-12 animate-pulse rounded-[24px] bg-gray-100 ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {(pagedMessages.length > 0 ? pagedMessages : selectedConversation.messages).map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${
                  message.sender === 'supporter' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'user' ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F5F8] text-[12px] font-black text-[#64748B]">
                    {selectedConversation.userName
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                  </div>
                ) : null}

                <div
                  className={`max-w-[75%] rounded-[24px] px-5 py-4 text-[16px] font-medium leading-8 shadow-sm ${
                    message.sender === 'supporter'
                      ? 'rounded-br-md bg-gradient-to-br from-[#D45700] via-[#F36A00] to-[#FF7A00] text-white'
                      : 'rounded-bl-md border border-gray-100 bg-[#F3F5F8] text-gray-900'
                  } ${message.status === 'sending' ? 'opacity-70' : 'opacity-100'}`}
                >
                  {message.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.imageUrl} alt="attachment" className="max-w-full rounded-xl object-contain mb-2" />
                  ) : null}
                  {message.text}
                </div>

                {message.sender === 'supporter' ? (
                  <div className="text-[12px] font-medium text-[#9AA7BD] flex items-center gap-1 shrink-0">
                    {message.time} {message.status === 'sending' ? '• Đang gửi...' : message.status === 'sent' ? '• Đã gửi' : ''}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {typingUsers[selectedConversation.userEmail.toLowerCase()] && (
            <div className="mt-10 flex items-center gap-3 text-[14px] font-medium text-[#B0B8C6]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D1D5DB]"></span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D1D5DB] [animation-delay:120ms]"></span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D1D5DB] [animation-delay:240ms]"></span>
              {selectedConversation.userName} {t('supporter.isTyping')}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-white px-4 py-4">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <div className="flex items-center gap-3 rounded-[28px] border border-[#EEF2F6] bg-[#FBFCFD] p-3">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#94A3B8] transition-colors hover:bg-white" onClick={() => fileInputRef.current?.click()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#94A3B8] transition-colors hover:bg-white" onClick={() => fileInputRef.current?.click()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#94A3B8] transition-colors hover:bg-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 15s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            <input
              type="text"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              maxLength={500}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder={t('supporter.typeMessage')}
              className="h-[48px] flex-1 bg-transparent px-2 text-[15px] font-medium text-gray-800 outline-none placeholder:text-[#B0B8C6]"
            />
            <button
              type="button"
              onClick={handleSendReply}
              disabled={reply.trim().length === 0}
              className="flex h-[48px] w-[48px] items-center justify-center rounded-2xl bg-[#B45309] text-white shadow-[0_12px_24px_rgba(180,83,9,0.22)] transition-colors hover:bg-[#9A4307] disabled:cursor-not-allowed disabled:bg-[#D7DFEA] disabled:text-[#94A3B8]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </section>
      ) : null}

      {showOperationsPanel ? (
      <aside className="bg-[#FCFCFD] p-6">
        <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-[0_20px_50px_rgba(17,24,39,0.05)]">
          <div className="mx-auto flex h-[96px] w-[96px] items-center justify-center rounded-[28px] bg-[#F8FAFD] text-[28px] font-black text-[#64748B]">
            {selectedConversation.userName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')}
          </div>
          <h2 className="mt-6 text-center text-[20px] font-black tracking-tight text-gray-900">
            {selectedConversation.userName}
          </h2>
          <p className="mt-2 text-center text-[13px] font-semibold text-[#94A3B8]">
            {selectedConversation.userEmail}
          </p>
          <p className="mt-1 text-center text-[13px] font-medium text-[#B0B8C6]">
            {selectedConversation.userCode}
          </p>
          {currentRole === 'admin' ? (
            <Link
              href="/admin/deposits"
              className="mt-6 inline-flex min-h-[40px] w-full items-center justify-center rounded-2xl border border-[#FAD4B8] bg-[#FFF8F2] px-4 text-[12px] font-black uppercase tracking-[0.16em] text-primary transition-colors hover:bg-[#FFF3E8]"
            >
              Open Deposit Queue
            </Link>
          ) : null}

          <div className="mt-8">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#A0AEC0]">
              Create Deposit Order
            </p>
            <div className="overflow-hidden rounded-[28px] border border-[#F6D9C4] bg-gradient-to-br from-[#FFF8F2] via-white to-[#FFF4EA] shadow-[0_18px_40px_rgba(255,102,0,0.06)]">
              <div className="space-y-5 px-5 py-5">
                <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                    Current Wallet Balance
                  </p>
                  <h3 className="mt-2 text-[22px] font-black tracking-tight text-gray-900">
                    {formatUsd(getWalletBalance(selectedConversation.userEmail))}
                  </h3>
                  <p className="mt-1 text-[13px] font-medium text-[#7B879C]">
                    {selectedConversation.userName}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-[#A0AEC0]">
                    {selectedConversation.userEmail}
                  </p>
                </div>

                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">
                    Amount To Add Into Wallet
                  </span>
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    placeholder="5000"
                    className="mt-2 h-[58px] w-full rounded-[22px] border border-[#F1D7C0] bg-white px-5 text-[26px] font-black tracking-tight text-gray-900 outline-none placeholder:text-[#C4CCD8] focus:border-primary"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCreateDepositRequest}
                  disabled={Number(depositAmount.replace(/[^0-9.]/g, '')) <= 0 || isSubmittingDeposit}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[22px] bg-[#FF7A1A] px-4 text-[13px] font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_34px_rgba(255,122,26,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#FF8C38] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#FFC38F] disabled:text-white disabled:shadow-[0_12px_24px_rgba(255,122,26,0.16)]"
                >
                  {isSubmittingDeposit ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Đang xử lý...
                    </>
                  ) : depositSuccess ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      Thành công!
                    </>
                  ) : 'Submit'}
                </button>
              </div>
            </div>
          </div>

          {mode !== 'operations' ? (
            <>
              <div className="mt-8">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#A0AEC0]">
                  {t('supporter.recentDeposits')}
                </p>
                <div className="space-y-3">
                  {selectedConversation.recentDeposits.length > 0 ? (
                    selectedConversation.recentDeposits.map((deposit) => (
                      <div key={`${deposit.label}-${deposit.amount}`} className="rounded-2xl border border-gray-100 bg-[#FCFCFD] px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[14px] font-bold text-gray-900">{deposit.label}</p>
                          <span className="text-[13px] font-black text-gray-900">{deposit.amount}</span>
                        </div>
                        <p className="mt-2 text-[12px] font-black uppercase tracking-[0.16em] text-primary">
                          {deposit.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-[13px] font-medium text-[#94A3B8]">
                      {t('supporter.noDeposits')}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#A0AEC0]">
                  {t('supporter.supportNotes')}
                </p>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder={t('supporter.notePlaceholder')}
                  className="min-h-[140px] w-full rounded-[22px] border border-gray-100 bg-[#F8FAFD] px-4 py-4 text-[14px] font-medium text-gray-800 outline-none placeholder:text-[#B0B8C6] focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={isSavingNote || noteDraft.trim().length === 0}
                  className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-2xl border border-[#E8EDF4] bg-white px-4 text-[13px] font-bold text-[#52637A] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingNote ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Đang lưu...
                    </>
                  ) : t('supporter.saveNote')}
                </button>

                {/* Notes list — show author + timestamp in bold */}
                <div className="mt-4 space-y-3">
                  {selectedConversation.notes.map((note, idx) => (
                    <div key={idx} className="rounded-2xl bg-[#FCFCFD] px-4 py-3 text-[13px] font-medium leading-6 text-[#64748B]">
                      {note.startsWith('[Admin]') || note.startsWith('[Supporter]') ? (
                        <>
                          <span className="font-black text-[#334155] block text-[11px] mb-1">
                            {note.substring(0, note.indexOf('—') + 1).trim()}
                          </span>
                          <span>{note.substring(note.indexOf('—') + 1).trim()}</span>
                        </>
                      ) : note}
                    </div>
                  ))}
                </div>
              </div>

              {/* RBAC: Only Admin can resolve conversations */}
              {currentRole === 'admin' && (
                <button
                  type="button"
                  onClick={handleResolveConversation}
                  className="mt-8 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl border border-[#E8EDF4] bg-[#FCFCFD] px-5 text-[13px] font-black uppercase tracking-[0.18em] text-[#94A3B8] transition-colors hover:bg-gray-50"
                >
                  {t('supporter.resolveConversation')}
                </button>
              )}
            </>
          ) : null}
        </div>
      </aside>
      ) : null}

      {depositModalConversationId && activeDepositConversation ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/40 px-5 py-8">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t('common.close')}
            onClick={() => {
              setDepositModalConversationId(null);
              setDepositAmount('');
            }}
          />
          <div className="relative z-[81] w-full max-w-[420px] rounded-[28px] border border-[#F3E7DE] bg-white p-6 shadow-[0_28px_70px_rgba(17,24,39,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
                  Tạo đơn cộng ví
                </p>
                <h3 className="mt-2 text-[24px] font-black tracking-tight text-gray-900">
                  {activeDepositConversation.userName}
                </h3>
                <p className="mt-1 text-[13px] font-semibold text-[#94A3B8]">
                  {activeDepositConversation.userEmail}
                </p>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#74839B] transition-colors hover:bg-[#F1F5F9]"
                aria-label={t('common.close')}
                onClick={() => {
                  setDepositModalConversationId(null);
                  setDepositAmount('');
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 rounded-[22px] bg-[#FFF8F2] px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                Số dư ví hiện tại
              </p>
              <p className="mt-2 text-[26px] font-black tracking-tight text-gray-900">
                {formatUsd(getWalletBalance(activeDepositConversation.userEmail))}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">
                Số tiền cộng thêm
              </span>
              <input
                type="text"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                placeholder="5000"
                className="mt-2 h-[58px] w-full rounded-[22px] border border-[#F1D7C0] bg-white px-5 text-[26px] font-black tracking-tight text-gray-900 outline-none placeholder:text-[#C4CCD8] focus:border-primary"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDepositModalConversationId(null);
                  setDepositAmount('');
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[20px] bg-[#F3F4F6] px-4 text-[13px] font-bold text-[#64748B] transition-colors hover:bg-[#E5E7EB]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateDepositRequest}
                disabled={Number(depositAmount.replace(/[^0-9.]/g, '')) <= 0}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[20px] bg-[#FF7A1A] px-4 text-[13px] font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_34px_rgba(255,122,26,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#FF8C38] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#FFC38F] disabled:shadow-none"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
