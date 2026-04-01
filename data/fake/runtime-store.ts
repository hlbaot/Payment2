'use client';

import { fakeUsers } from '@/data/fake/users';

export type SupportMessage = {
  id: string;
  sender: 'user' | 'supporter';
  text: string;
  time: string;
  status?: 'sending' | 'sent' | 'error';
  imageUrl?: string;
};

export type SupportConversation = {
  id: string;
  userName: string;
  userEmail: string;
  userCode: string;
  avatarSeed: string;
  preview: string;
  time: string;
  status: 'Open' | 'Unread' | 'Resolved';
  tier: 'Premium' | 'Platinum' | 'Standard';
  online: boolean;
  recentOrders: Array<{
    label: string;
    orderId: string;
    amount: string;
  }>;
  recentDeposits: Array<{
    id: string;
    label: string;
    amount: string;
    status: 'Pending' | 'Completed';
  }>;
  notes: string[];
  messages: SupportMessage[];
};

export type DepositRequest = {
  id: string;
  conversationId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: string;
  note: string;
  status: 'Pending' | 'Confirmed';
  createdAt: string;
  confirmedAt?: string;
};

const SUPPORT_STORAGE_KEY = 'shared-support-conversations';
const DEPOSIT_STORAGE_KEY = 'shared-deposit-requests';
const WALLET_STORAGE_KEY = 'shared-user-wallets';

export const SUPPORT_UPDATED_EVENT = 'shared-support-conversations-updated';
export const DEPOSITS_UPDATED_EVENT = 'shared-deposit-requests-updated';
export const WALLETS_UPDATED_EVENT = 'shared-user-wallets-updated';

const initialConversations: SupportConversation[] = [
  {
    id: 'conv-1',
    userName: 'John Doe',
    userEmail: 'user@kinetic.com',
    userCode: 'ID: 8829-XJ2',
    avatarSeed: 'john-doe',
    preview: 'Deposit ID #D-99231 has been pending for over 24 hours.',
    time: '14:22',
    status: 'Unread',
    tier: 'Premium',
    online: true,
    recentOrders: [
      { label: 'Apple Store Purchase', orderId: '#ORD-0922', amount: '$1,499.00' },
      { label: 'Cloud Hosting Monthly', orderId: '#ORD-0811', amount: '$89.00' },
    ],
    recentDeposits: [],
    notes: ['Priority customer. Requested same-day follow-up before 9 PM.'],
    messages: [
      {
        id: 'm-1',
        sender: 'user',
        text: 'Hello, I’m checking on the status of my deposit ID #D-99231. It has been pending for over 24 hours now. Is there an issue?',
        time: '14:18',
      },
      {
        id: 'm-2',
        sender: 'supporter',
        text: 'Hi John! I’m looking into this for you right now. Just a moment while I pull up your account details and transaction history.',
        time: '14:20',
      },
      {
        id: 'm-3',
        sender: 'user',
        text: 'Thank you for the quick update. I’m traveling and need those funds cleared by tonight if possible.',
        time: '14:22',
      },
    ],
  },
  {
    id: 'conv-2',
    userName: 'Elena Rodriguez',
    userEmail: 'elena@swiftguard.global',
    userCode: 'ID: 5512-ZB8',
    avatarSeed: 'elena-rodriguez',
    preview: 'I need help with my credit card authorization.',
    time: '09:15',
    status: 'Open',
    tier: 'Standard',
    online: false,
    recentOrders: [
      { label: 'Card Purchase', orderId: '#ORD-0671', amount: '$320.00' },
    ],
    recentDeposits: [],
    notes: ['Identity refresh was requested before retrying the card deposit.'],
    messages: [
      {
        id: 'm-4',
        sender: 'user',
        text: 'I need help with my credit card authorization. The deposit keeps failing at the last step.',
        time: '09:02',
      },
      {
        id: 'm-5',
        sender: 'supporter',
        text: 'I can help with that. Please give me a second to confirm whether your authorization lock has been cleared.',
        time: '09:15',
      },
    ],
  },
  {
    id: 'conv-3',
    userName: 'Marcus Sterling',
    userEmail: 'marcus@sterling.capital',
    userCode: 'ID: 7710-LQ1',
    avatarSeed: 'marcus-sterling',
    preview: 'The wire transfer was successful. Close the ticket please.',
    time: 'Yesterday',
    status: 'Resolved',
    tier: 'Platinum',
    online: false,
    recentOrders: [
      { label: 'Treasury Transfer', orderId: '#ORD-0991', amount: '$12,400.00' },
    ],
    recentDeposits: [
      { id: 'seed-dep-1', label: 'Wire Transfer', amount: '$12,400.00', status: 'Completed' },
    ],
    notes: ['Resolved after wire confirmation from operations.'],
    messages: [
      {
        id: 'm-6',
        sender: 'user',
        text: 'The wire transfer was successful. You can close the ticket now.',
        time: 'Yesterday',
      },
    ],
  },
];

function getDefaultWalletMap() {
  return fakeUsers.reduce<Record<string, number>>((accumulator, user) => {
    accumulator[user.email.toLowerCase()] = user.walletBalance;
    return accumulator;
  }, {});
}

function getNowLabel() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDateLabel() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatUsd(amount: number) {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeSupportConversations(rawConversations: unknown): SupportConversation[] {
  if (!Array.isArray(rawConversations) || rawConversations.length === 0) {
    return initialConversations;
  }

  return rawConversations.map((item, index) => {
    const conversation = item as Partial<SupportConversation>;
    const matchingFakeUser = fakeUsers.find(
      (user) => user.userName.toLowerCase() === (conversation.userName ?? '').toLowerCase()
    );

    return {
      id: conversation.id ?? `conv-restored-${index + 1}`,
      userName: conversation.userName ?? matchingFakeUser?.userName ?? 'Guest User',
      userEmail:
        conversation.userEmail ??
        matchingFakeUser?.email ??
        `guest-${index + 1}@support.local`,
      userCode: conversation.userCode ?? `ID: RESTORE-${index + 1}`,
      avatarSeed: conversation.avatarSeed ?? `restored-${index + 1}`,
      preview: conversation.preview ?? '',
      time: conversation.time ?? 'Now',
      status:
        conversation.status === 'Resolved' || conversation.status === 'Unread'
          ? conversation.status
          : 'Open',
      tier:
        conversation.tier === 'Premium' || conversation.tier === 'Platinum'
          ? conversation.tier
          : 'Standard',
      online: Boolean(conversation.online),
      recentOrders: Array.isArray(conversation.recentOrders) ? conversation.recentOrders : [],
      recentDeposits: Array.isArray(conversation.recentDeposits)
        ? conversation.recentDeposits.map((deposit, depositIndex) => ({
            id: deposit?.id ?? `restored-deposit-${index + 1}-${depositIndex + 1}`,
            label: deposit?.label ?? 'Deposit',
            amount: deposit?.amount ?? '$0.00',
            status: deposit?.status === 'Completed' ? 'Completed' : 'Pending',
          }))
        : [],
      notes: Array.isArray(conversation.notes) ? conversation.notes : [],
      messages: Array.isArray(conversation.messages)
          ? conversation.messages.map((message, messageIndex) => ({
              id: message?.id ?? `restored-message-${index + 1}-${messageIndex + 1}`,
              sender: message?.sender === 'supporter' ? 'supporter' : 'user',
              text: message?.text ?? '',
              time: message?.time ?? 'Now',
              status: message?.status,
              imageUrl: message?.imageUrl,
            }))
        : [],
    };
  });
}

function writeStorage(key: string, value: unknown, eventName: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(eventName));
}

export function loadSupportConversations() {
  const storedConversations = readStorage<unknown>(SUPPORT_STORAGE_KEY, initialConversations);
  return normalizeSupportConversations(storedConversations);
}

export function saveSupportConversations(conversations: SupportConversation[]) {
  writeStorage(SUPPORT_STORAGE_KEY, conversations, SUPPORT_UPDATED_EVENT);
}

export function loadDepositRequests() {
  return readStorage<DepositRequest[]>(DEPOSIT_STORAGE_KEY, []);
}

export function saveDepositRequests(requests: DepositRequest[]) {
  writeStorage(DEPOSIT_STORAGE_KEY, requests, DEPOSITS_UPDATED_EVENT);
}

export function loadUserWallets() {
  return readStorage<Record<string, number>>(WALLET_STORAGE_KEY, getDefaultWalletMap());
}

export function saveUserWallets(wallets: Record<string, number>) {
  writeStorage(WALLET_STORAGE_KEY, wallets, WALLETS_UPDATED_EVENT);
}

export function getWalletBalance(userEmail: string) {
  const wallets = loadUserWallets();
  const normalizedEmail = userEmail.trim().toLowerCase();
  return wallets[normalizedEmail] ?? getDefaultWalletMap()[normalizedEmail] ?? 0;
}

export function setWalletBalance(userEmail: string, amount: number) {
  const wallets = loadUserWallets();
  wallets[userEmail.trim().toLowerCase()] = amount;
  saveUserWallets(wallets);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('walletBalance', String(amount));
  }
}

export function appendConversationMessage(input: {
  conversationId?: string;
  userName: string;
  userEmail: string;
  sender: 'user' | 'supporter';
  text: string;
  imageUrl?: string;
}) {
  const trimmedText = input.text.trim();
  if (!trimmedText && !input.imageUrl) return null;

  const nextTime = getNowLabel();
  const conversations = loadSupportConversations();
  const normalizedEmail = input.userEmail.trim().toLowerCase();
  const existingConversation =
    conversations.find((conversation) => conversation.id === input.conversationId) ??
    conversations.find((conversation) => conversation.userEmail.toLowerCase() === normalizedEmail);

  const nextMessage: SupportMessage = {
    id: `${existingConversation?.id ?? 'conv'}-${Date.now()}`,
    sender: input.sender,
    text: trimmedText,
    time: nextTime,
    imageUrl: input.imageUrl,
  };

  let nextConversations: SupportConversation[];

  if (existingConversation) {
    nextConversations = conversations.map((conversation) =>
      conversation.id === existingConversation.id
        ? {
            ...conversation,
            userName: input.userName || conversation.userName,
            userEmail: normalizedEmail,
            preview: trimmedText,
            time: nextTime,
            status: input.sender === 'user' ? 'Unread' : 'Open',
            online: true,
            messages: [...conversation.messages, nextMessage],
          }
        : conversation
    );
  } else {
    nextConversations = [
      {
        id: `conv-${Date.now()}`,
        userName: input.userName,
        userEmail: normalizedEmail,
        userCode: `ID: ${Math.floor(1000 + Math.random() * 8999)}-UX${Math.floor(10 + Math.random() * 89)}`,
        avatarSeed: normalizedEmail.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
        preview: trimmedText,
        time: nextTime,
        status: input.sender === 'user' ? 'Unread' : 'Open',
        tier: 'Standard',
        online: true,
        recentOrders: [],
        recentDeposits: [],
        notes: [],
        messages: [nextMessage],
      },
      ...conversations,
    ];
  }

  saveSupportConversations(nextConversations);

  return nextConversations.find((conversation) => conversation.userEmail.toLowerCase() === normalizedEmail) ?? null;
}

export function createDepositRequest(input: {
  conversationId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: string;
  note: string;
}) {
  const requestId = `DEP-${Date.now().toString().slice(-6)}`;
  const nextRequest: DepositRequest = {
    id: requestId,
    conversationId: input.conversationId,
    userName: input.userName,
    userEmail: input.userEmail.trim().toLowerCase(),
    amount: input.amount,
    method: input.method,
    note: input.note.trim(),
    status: 'Pending',
    createdAt: getDateLabel(),
  };

  const requests = [nextRequest, ...loadDepositRequests()];
  saveDepositRequests(requests);

  const conversations: SupportConversation[] = loadSupportConversations().map((conversation) =>
    conversation.id === input.conversationId
      ? {
          ...conversation,
          preview: `Deposit order ${requestId} created for ${formatUsd(input.amount)}.`,
          time: getNowLabel(),
          recentDeposits: [
            {
              id: requestId,
              label: input.method,
              amount: formatUsd(input.amount),
              status: 'Pending',
            },
            ...conversation.recentDeposits,
          ],
          messages: [
            ...conversation.messages,
            {
              id: `${input.conversationId}-${Date.now()}`,
              sender: 'supporter',
              text: `We created deposit order ${requestId} for ${formatUsd(input.amount)} via ${input.method}. It is now waiting for admin confirmation.`,
              time: getNowLabel(),
            },
          ],
        }
      : conversation
  );
  saveSupportConversations(conversations);

  return nextRequest;
}

export function confirmDepositRequest(requestId: string) {
  const requests = loadDepositRequests();
  const target = requests.find((request) => request.id === requestId);
  if (!target || target.status === 'Confirmed') return;

  const nextRequests: DepositRequest[] = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: 'Confirmed',
          confirmedAt: getDateLabel(),
        }
      : request
  );
  saveDepositRequests(nextRequests);

  const currentBalance = getWalletBalance(target.userEmail);
  setWalletBalance(target.userEmail, currentBalance + target.amount);

  const conversations: SupportConversation[] = loadSupportConversations().map((conversation) =>
    conversation.id === target.conversationId
      ? {
          ...conversation,
          preview: `Deposit ${requestId} was confirmed and credited to the wallet.`,
          time: getNowLabel(),
          recentDeposits: conversation.recentDeposits.map((deposit) =>
            deposit.id === requestId ? { ...deposit, status: 'Completed' } : deposit
          ),
          messages: [
            ...conversation.messages,
            {
              id: `${target.conversationId}-${Date.now()}`,
              sender: 'supporter',
              text: `Deposit ${requestId} has been approved by admin. ${formatUsd(target.amount)} is now available in your wallet.`,
              time: getNowLabel(),
            },
          ],
        }
      : conversation
  );
  saveSupportConversations(conversations);
}

export function cancelDepositRequest(requestId: string) {
  const requests = loadDepositRequests();
  const target = requests.find((request) => request.id === requestId);
  if (!target) return;

  const nextRequests = requests.filter((request) => request.id !== requestId);
  saveDepositRequests(nextRequests);

  const conversations: SupportConversation[] = loadSupportConversations().map((conversation) =>
    conversation.id === target.conversationId
      ? {
          ...conversation,
          preview: `Deposit ${requestId} was cancelled by admin.`,
          time: getNowLabel(),
          recentDeposits: conversation.recentDeposits.filter((deposit) => deposit.id !== requestId),
          messages: [
            ...conversation.messages,
            {
              id: `${target.conversationId}-${Date.now()}`,
              sender: 'supporter',
              text: `Deposit ${requestId} was cancelled by admin and was not added to the wallet.`,
              time: getNowLabel(),
            },
          ],
        }
      : conversation
  );
  saveSupportConversations(conversations);
}

export function getDepositRequestsByEmail(userEmail: string) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  return loadDepositRequests().filter((request) => request.userEmail === normalizedEmail);
}
