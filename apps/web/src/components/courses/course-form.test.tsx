import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { CourseForm } from "@/components/courses/course-form";
import {
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";

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

describe("CourseForm", () => {
  it("shows validation messages for required course fields", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      createElement(CourseForm, {
        onSubmit,
        submitLabel: "Criar curso",
        title: "Dados basicos"
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Criar curso" }));

    expect(await screen.findByText("Informe o nome do curso")).toBeTruthy();
    expect(await screen.findByText("Informe um identificador")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed course values when the form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      createElement(CourseForm, {
        onSubmit,
        submitLabel: "Criar curso",
        title: "Dados basicos"
      })
    );

    fireEvent.input(screen.getByLabelText("Nome do curso"), {
      target: { value: "  Curso de onboarding  " }
    });
    fireEvent.input(screen.getByLabelText("Identificador"), {
      target: { value: "  curso_onboarding  " }
    });
    fireEvent.input(screen.getByLabelText("Descricao"), {
      target: { value: "  Primeiros passos no produto.  " }
    });

    fireEvent.click(screen.getByRole("button", { name: "Criar curso" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        description: "Primeiros passos no produto.",
        slug: "curso_onboarding",
        title: "Curso de onboarding"
      });
    });
  });

  it("shows API errors returned by the submit handler", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Slug ja esta em uso"));

    render(
      createElement(CourseForm, {
        initialValues: {
          description: "",
          slug: "curso-existente",
          title: "Curso existente"
        },
        onSubmit,
        submitLabel: "Salvar alteracoes",
        title: "Campos basicos"
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar alteracoes" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Slug ja esta em uso"
    );
  });

  it("disables submit while the form is submitting", async () => {
    const pendingRequest = deferredPromise();
    const onSubmit = vi.fn().mockReturnValue(pendingRequest.promise);

    render(
      createElement(CourseForm, {
        initialValues: {
          description: "",
          slug: "curso-em-andamento",
          title: "Curso em andamento"
        },
        onSubmit,
        submitLabel: "Criar curso",
        title: "Dados basicos"
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Criar curso" }));

    expect(
      (screen.getByRole("button", { name: "Criar curso" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);

    pendingRequest.resolve();

    await waitFor(() => {
      expect(
        (screen.getByRole("button", { name: "Criar curso" }) as HTMLButtonElement)
          .disabled
      ).toBe(false);
    });
  });
});
