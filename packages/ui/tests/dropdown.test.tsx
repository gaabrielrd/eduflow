import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "../src";

describe("Dropdown", () => {
  it("opens and triggers item selection", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <Dropdown>
        <DropdownTrigger asChild>
          <Button>Acoes</Button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onSelect={onSelect}>Editar</DropdownItem>
        </DropdownContent>
      </Dropdown>
    );

    await user.click(screen.getByRole("button", { name: "Acoes" }));

    const item = await screen.findByRole("menuitem", { name: "Editar" });
    await user.click(item);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
