import { ApiError, apiClient, getApiBaseUrl } from "@/lib/api/api-client";
import { InvitationScreen } from "@/components/invitations/invitation-screen";
import type { PublicInvitation } from "@/lib/organizations/organization-members-types";

type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  let invitation: PublicInvitation | null = null;
  let errorStatus: number | undefined;

  try {
    invitation = await apiClient<PublicInvitation>({
      baseUrl: getApiBaseUrl(),
      method: "GET",
      path: `/invitations/${token}`,
      retryOnUnauthorized: false
    });
  } catch (error) {
    if (error instanceof ApiError) {
      errorStatus = error.statusCode;
    }
  }

  return <InvitationScreen errorStatus={errorStatus} invitation={invitation} token={token} />;
}
