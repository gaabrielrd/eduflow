import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "../src";

describe("Checkbox", () => {
  it("toggles checked state when clicked", () => {
    render(<Checkbox aria-label="Aceitar termos" />);

    const checkbox = screen.getByRole("checkbox", { name: "Aceitar termos" });

    expect(checkbox).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "checked");

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
  });
});
