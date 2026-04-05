import type { FakeUserRole } from '@/data/fake/users';

const ROLE_BY_PORT: Record<string, FakeUserRole> = {
  '3000': 'user',
  '3001': 'supporter',
  '3002': 'admin',
};

type PortalConfig = {
  heading: string;
  description: string;
  inviteEnabled: boolean;
};

const PORTAL_CONFIG: Record<FakeUserRole, PortalConfig> = {
  user: {
    heading: 'User login',
    description: 'Sign in to continue to the customer workspace.',
    inviteEnabled: true,
  },
  supporter: {
    heading: 'Supporter login',
    description: 'This portal only accepts supporter accounts.',
    inviteEnabled: false,
  },
  admin: {
    heading: 'Admin login',
    description: 'This portal only accepts admin accounts.',
    inviteEnabled: false,
  },
};

export function resolvePortalRoleFromPort(port?: string | null): FakeUserRole {
  if (!port) {
    return 'user';
  }

  return ROLE_BY_PORT[port] ?? 'user';
}

export function getClientPortalRole(): FakeUserRole {
  if (typeof window === 'undefined') {
    return 'user';
  }

  return resolvePortalRoleFromPort(window.location.port);
}

export function getPortalConfig(role: FakeUserRole): PortalConfig {
  return PORTAL_CONFIG[role];
}
