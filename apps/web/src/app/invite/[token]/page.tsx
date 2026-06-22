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

  try {
    const invitation = await apiClient<PublicInvitation>({
      baseUrl: getApiBaseUrl(),
      method: "GET",
      path: `/invitations/${token}`,
      retryOnUnauthorized: false
    });

    return <InvitationScreen invitation={invitation} token={token} />;
  } catch (error) {
    if (error instanceof ApiError) {
      return <InvitationScreen errorStatus={error.statusCode} invitation={null} token={token} />;
    }

    return <InvitationScreen invitation={null} token={token} />;
  }
}
