/**
 * lib/api.ts — Centralized API Layer
 *
 * Strategy: Contract-First with environment toggle.
 * - NEXT_PUBLIC_USE_MOCK=true  → falls back to runtime-store (local fake data)
 * - NEXT_PUBLIC_USE_MOCK=false → calls real REST API endpoints
 *
 * Components should NEVER import from runtime-store directly.
 * All data access goes through this file.
 */

import {
  loadSupportConversations,
  loadDepositRequests,
  type SupportConversation,
  type SupportMessage,
} from '@/data/fake/runtime-store';

// ─────────────────────────────────────────────
// Types — mirrors the agreed API response schema
// ─────────────────────────────────────────────

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type ConversationListResponse = {
  data: SupportConversation[];
  meta: PaginatedMeta;
};

export type MessageListResponse = {
  data: SupportMessage[];
  meta: PaginatedMeta;
};

export type ReadReceiptResponse = {
  success: boolean;
  conversationId: string;
  readAt: string;
};

export type SendMessagePayload = {
  conversationId: string;
  text: string;
  imageUrl?: string;
  sender: 'user' | 'supporter';
};

export type SendMessageResponse = {
  success: boolean;
  message: SupportMessage;
};

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';
const PAGE_SIZE = 20;

// ─────────────────────────────────────────────
// Generic fetch wrapper (used for real API calls)
// ─────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth token here when BE is ready:
      // 'Authorization': `Bearer ${getToken()}`,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`API ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// 1. Conversations — List with pagination
// ─────────────────────────────────────────────

/**
 * Fetch paginated list of support conversations.
 * SWR key: ['/conversations', page, filter, search]
 */
export async function fetchConversations(
  page = 1,
  filter = 'all',
  search = ''
): Promise<ConversationListResponse> {
  if (USE_MOCK) {
    let all = loadSupportConversations();

    // Apply filter
    if (filter === 'unread') all = all.filter((c) => c.status === 'Unread');
    if (filter === 'resolved') all = all.filter((c) => c.status === 'Resolved');

    // Apply search
    const q = search.trim().toLowerCase();
    if (q) {
      all = all.filter(
        (c) =>
          c.userName.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.userEmail.toLowerCase().includes(q)
      );
    }

    const start = (page - 1) * PAGE_SIZE;
    const slice = all.slice(start, start + PAGE_SIZE);

    return {
      data: slice,
      meta: {
        page,
        limit: PAGE_SIZE,
        total: all.length,
        hasMore: start + PAGE_SIZE < all.length,
      },
    };
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    filter,
    ...(search ? { search } : {}),
  });

  return apiFetch<ConversationListResponse>(`/conversations?${params}`);
}

// ─────────────────────────────────────────────
// 2. Messages — Paginated by conversation
// ─────────────────────────────────────────────

/**
 * Fetch paginated messages for a conversation (newest page last = DESC then reverse).
 * Page 1 = most recent 20 messages.
 * SWR key: ['/messages', conversationId, page]
 */
export async function fetchMessages(
  conversationId: string,
  page = 1
): Promise<MessageListResponse> {
  if (USE_MOCK) {
    const conv = loadSupportConversations().find((c) => c.id === conversationId);
    const allMessages = conv?.messages ?? [];

    // Newest at the end — for "load older" we go backwards
    const total = allMessages.length;
    const end = total - (page - 1) * PAGE_SIZE;
    const start = Math.max(0, end - PAGE_SIZE);
    const slice = allMessages.slice(start, end);

    return {
      data: slice,
      meta: {
        page,
        limit: PAGE_SIZE,
        total,
        hasMore: start > 0,
      },
    };
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  return apiFetch<MessageListResponse>(
    `/conversations/${conversationId}/messages?${params}`
  );
}

// ─────────────────────────────────────────────
// 3. Mark as Read
// ─────────────────────────────────────────────

/**
 * Report that the user/supporter has read a conversation.
 * Call this on conversation select.
 */
export async function markConversationRead(
  conversationId: string
): Promise<ReadReceiptResponse> {
  if (USE_MOCK) {
    // Mock: optimistic — no actual persistence here, handled by component state
    return {
      success: true,
      conversationId,
      readAt: new Date().toISOString(),
    };
  }

  return apiFetch<ReadReceiptResponse>(
    `/conversations/${conversationId}/read`,
    { method: 'POST' }
  );
}

// ─────────────────────────────────────────────
// 4. Send Message
// ─────────────────────────────────────────────

/**
 * Send a message. Returns the confirmed server message object.
 * Call AFTER optimistic UI update, then sync status to 'sent'.
 */
export async function sendMessage(
  payload: SendMessagePayload
): Promise<SendMessageResponse> {
  if (USE_MOCK) {
    // Mock: simulate network delay
    await new Promise((r) => setTimeout(r, 400));
    const mockMessage: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: payload.sender,
      text: payload.text,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      imageUrl: payload.imageUrl,
      status: 'sent',
    };
    return { success: true, message: mockMessage };
  }

  return apiFetch<SendMessageResponse>('/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────
// 5. Deposit Requests (bonus — consistent pattern)
// ─────────────────────────────────────────────

export type DepositRequest = {
  id: string;
  conversationId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'Pending' | 'Completed';
  createdAt: string;
};

export async function fetchDepositRequests(): Promise<{ data: DepositRequest[]; pendingCount: number }> {
  if (USE_MOCK) {
    const all = loadDepositRequests();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = all.map((d: any) => ({
      id: d.id,
      conversationId: d.conversationId,
      userName: d.userName,
      userEmail: d.userEmail,
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt ?? new Date().toISOString(),
    }));
    return {
      data: mapped,
      pendingCount: mapped.filter((d) => d.status === 'Pending').length,
    };
  }

  return apiFetch<{ data: DepositRequest[]; pendingCount: number }>('/deposits');
}
