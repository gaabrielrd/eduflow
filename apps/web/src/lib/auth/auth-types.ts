export type AuthUser = {
  email: string;
  id: string;
  name: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  role: string;
  slug: string;
};

export type SessionSnapshot = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
