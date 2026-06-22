export type OrganizationMember = {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type OrganizationInvitation = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  inviteUrl: string;
  status: "accepted" | "expired" | "pending";
};

export type PublicInvitation = OrganizationInvitation & {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type CreateInvitationPayload = {
  email: string;
  role: string;
};

export type AcceptInvitationResponse = {
  invitation: PublicInvitation & {
    organizationId: string;
  };
  membership: {
    id: string;
    role: string;
    createdAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};
