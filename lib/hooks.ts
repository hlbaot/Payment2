/**
 * lib/hooks.ts — SWR data hooks
 *
 * Usage:
 *   const { conversations, isLoading, error, loadMore } = useConversations({ filter, search });
 *   const { messages, isLoading, loadOlder, hasMore } = useMessages(selectedId);
 */

'use client';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useCallback } from 'react';
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  type ConversationListResponse,
  type MessageListResponse,
} from '@/lib/api';
import type { SupportConversation, SupportMessage } from '@/data/fake/runtime-store';

// ─────────────────────────────────────────────
// Hook: Paginated Conversation List
// ─────────────────────────────────────────────

type UseConversationsOptions = {
  filter?: string;
  search?: string;
};

export function useConversations({ filter = 'all', search = '' }: UseConversationsOptions = {}) {
  // SWR Infinite — load more pages of conversations
  const getKey = (pageIndex: number, previousData: ConversationListResponse | null) => {
    // Stop fetching if previous page had no more
    if (previousData && !previousData.meta.hasMore) return null;
    return ['/conversations', pageIndex + 1, filter, search] as const;
  };

  const { data, error, isLoading, isValidating, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, page, f, s]) => fetchConversations(page, f, s),
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      dedupingInterval: 5000,
    }
  );

  // Flatten all pages into a single array
  const conversations: SupportConversation[] = data
    ? data.flatMap((page) => page.data)
    : [];

  const lastPage = data?.[data.length - 1];
  const hasMore = lastPage?.meta.hasMore ?? false;
  const totalCount = lastPage?.meta.total ?? 0;

  const loadMore = useCallback(() => {
    if (hasMore && !isValidating) {
      setSize((s) => s + 1);
    }
  }, [hasMore, isValidating, setSize]);

  return {
    conversations,
    isLoading,
    isValidating,
    error: error as Error | undefined,
    hasMore,
    totalCount,
    loadMore,
    /** Call after local mutation (e.g. status change) to sync with server */
    refresh: () => mutate(),
  };
}

// ─────────────────────────────────────────────
// Hook: Paginated Messages (Infinite scroll upward)
// ─────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  // Page 1 = most recent messages, Page 2 = older, etc.
  const getKey = (pageIndex: number, previousData: MessageListResponse | null) => {
    if (!conversationId) return null;
    // Stop if no older messages
    if (previousData && !previousData.meta.hasMore) return null;
    return ['/messages', conversationId, pageIndex + 1] as const;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, id, page]) => fetchMessages(id, page),
    {
      revalidateOnFocus: false,
      // Keep previous data when key changes (switching conversations)
      keepPreviousData: false,
      dedupingInterval: 2000,
    }
  );

  // Page 1 has the newest messages. Flatten in reverse so oldest is first in the UI.
  const allPages = data ?? [];
  const messages: SupportMessage[] = [...allPages]
    .reverse()
    .flatMap((page) => page.data);

  const lastPage = data?.[data.length - 1];
  const hasMore = lastPage?.meta.hasMore ?? false;

  /** Load older messages (scroll up) */
  const loadOlder = useCallback(() => {
    if (hasMore && !isValidating) {
      setSize((s) => s + 1);
    }
  }, [hasMore, isValidating, setSize]);

  /** Append a new message locally without waiting for revalidation */
  const appendMessage = useCallback(
    (newMsg: SupportMessage) => {
      mutate(
        (pages) => {
          if (!pages || pages.length === 0) return pages;
          const updated = [...pages];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            data: [...updated[lastIndex].data, newMsg],
            meta: {
              ...updated[lastIndex].meta,
              total: updated[lastIndex].meta.total + 1,
            },
          };
          return updated;
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  /** Update a message status (e.g. 'sending' → 'sent' | 'error') */
  const updateMessageStatus = useCallback(
    (messageId: string, status: 'sending' | 'sent' | 'error') => {
      mutate(
        (pages) =>
          pages?.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              m.id === messageId ? { ...m, status } : m
            ),
          })),
        { revalidate: false }
      );
    },
    [mutate]
  );

  return {
    messages,
    isLoading,
    isLoadingOlder: isValidating && size > 1,
    error: error as Error | undefined,
    hasMore,
    loadOlder,
    appendMessage,
    updateMessageStatus,
    refresh: () => mutate(),
  };
}

// ─────────────────────────────────────────────
// Hook: Single Conversation details
// ─────────────────────────────────────────────

export function useConversation(conversationId: string | null) {
  const { data, error, isLoading } = useSWR(
    conversationId ? ['/conversations', conversationId] : null,
    // Reuse the list fetch + find (mock) or call a detail endpoint
    async () => {
      const result = await fetchConversations(1, 'all', '');
      return result.data.find((c) => c.id === conversationId) ?? null;
    },
    { revalidateOnFocus: false, dedupingInterval: 3000 }
  );

  return {
    conversation: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}

// ─────────────────────────────────────────────
// Hook: Mark as read (fire-and-forget)
// ─────────────────────────────────────────────

export function useMarkAsRead() {
  return useCallback(async (conversationId: string) => {
    try {
      await markConversationRead(conversationId);
    } catch {
      // Non-critical — don't surface to user
    }
  }, []);
}
