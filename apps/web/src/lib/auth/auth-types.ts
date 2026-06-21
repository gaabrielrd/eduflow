export type AuthUser = {
  email: string;
  id: string;
  name: string;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  role: string;
  slug: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: AuthUser;
};

export type SessionData = {
  activeOrganizationId: string | null;
  organizations: OrganizationSummary[];
  user: AuthUser;
};

export type SessionResponse = {
  session: SessionData | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
};

export type CreateOrganizationPayload = {
  name: string;
  slug: string;
};
