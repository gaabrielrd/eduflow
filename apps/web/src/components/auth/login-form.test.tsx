import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import {
  fireEvent,
  render,
  screen,
  waitFor
} from "@/test/testing-library-react";

function deferredPromise() {
  let resolvePromise: () => void = () => undefined;

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise
  };
}

describe("LoginForm", () => {
  it("shows API errors returned by the submit handler", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Credenciais invalidas"));

    render(createElement(LoginForm, { onSubmit }));

    fireEvent.input(screen.getByLabelText("Email"), {
      target: { value: "user@eduflow.dev" }
    });
    fireEvent.input(screen.getByLabelText("Senha"), {
      target: { value: "strong-pass" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Credenciais invalidas"
    );
  });

  it("disables the submit button while the form is submitting", async () => {
    const pendingRequest = deferredPromise();
    const onSubmit = vi.fn().mockReturnValue(pendingRequest.promise);

    render(createElement(LoginForm, { onSubmit }));

    fireEvent.input(screen.getByLabelText("Email"), {
      target: { value: "user@eduflow.dev" }
    });
    fireEvent.input(screen.getByLabelText("Senha"), {
      target: { value: "strong-pass" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      (screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement).disabled
    ).toBe(true);

    pendingRequest.resolve();

    await waitFor(() => {
      expect(
        (screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement)
          .disabled
      ).toBe(false);
    });
  });
});
