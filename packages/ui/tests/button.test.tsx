import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../src";

describe("Button", () => {
  it("renders content and preserves click handlers", () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Salvar</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports disabled and loading states", () => {
    const onClick = vi.fn();

    const { rerender } = render(
      <Button disabled onClick={onClick}>
        Desabilitado
      </Button>
    );

    const disabledButton = screen.getByRole("button", { name: "Desabilitado" });
    expect(disabledButton).toBeDisabled();

    fireEvent.click(disabledButton);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button loading onClick={onClick}>
        Enviando
      </Button>
    );

    const loadingButton = screen.getByRole("button", { name: "Enviando" });
    expect(loadingButton).toBeDisabled();
  });
});
