import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/components/auth/auth-provider";
import { useSession } from "@/hooks/use-session";
import type { SessionData } from "@/lib/auth/auth-types";
import {
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";

vi.mock("@/lib/auth/auth-service", () => ({
  createOrganization: vi.fn(),
  getSession: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
  setOrganization: vi.fn()
}));

const authService = await import("@/lib/auth/auth-service");

const sessionWithoutOrganization: SessionData = {
  activeOrganizationId: null,
  organizations: [],
  user: {
    email: "user@eduflow.dev",
    id: "user-1",
    name: "User"
  }
};

const sessionWithOrganization: SessionData = {
  activeOrganizationId: "org-1",
  organizations: [
    {
      id: "org-1",
      name: "Org 1",
      role: "OWNER",
      slug: "org-1"
    }
  ],
  user: {
    email: "user@eduflow.dev",
    id: "user-1",
    name: "User"
  }
};

function SessionProbe() {
  const { isAuthenticated, isLoading, logout, user } = useSession();

  return (
    <div>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="user">{user?.email ?? "anon"}</p>
      <button onClick={() => void logout()} type="button">
        Sair
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("boots the session from the session endpoint", async () => {
    vi.mocked(authService.getSession).mockResolvedValue(sessionWithoutOrganization);

    render(
      createElement(
        AuthProvider,
        { initialSession: null },
        createElement(SessionProbe)
      )
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    expect(screen.getByTestId("user").textContent).toBe("user@eduflow.dev");
  });

  it("uses the initial server session without an extra bootstrap spinner", () => {
    render(
      createElement(
        AuthProvider,
        { initialSession: sessionWithOrganization },
        createElement(SessionProbe)
      )
    );

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("user@eduflow.dev");
  });

  it("clears the session on logout", async () => {
    vi.mocked(authService.logoutUser).mockResolvedValue(undefined);

    render(
      createElement(
        AuthProvider,
        { initialSession: sessionWithOrganization },
        createElement(SessionProbe)
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });

    expect(screen.getByTestId("user").textContent).toBe("anon");
  });
});
