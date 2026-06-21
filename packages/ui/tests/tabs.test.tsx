import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src";

describe("Tabs", () => {
  it("switches panels by click and keyboard", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Painel 1</TabsContent>
        <TabsContent value="details">Painel 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText("Painel 1")).toBeVisible();

    const detailsTab = screen.getByRole("tab", { name: "Details" });
    await user.click(detailsTab);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Painel 2");

    const overviewTab = screen.getByRole("tab", { name: "Overview" });
    overviewTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});
