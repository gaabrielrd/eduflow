"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode
} from "react";

import type { BreadcrumbItem } from "@/lib/navigation";

type BreadcrumbContextValue = {
  setOverrideItems: (items: BreadcrumbItem[] | null) => void;
};

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(
  null
);

export function BreadcrumbProvider({
  children,
  value
}: {
  children: ReactNode;
  value: BreadcrumbContextValue;
}) {
  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useAppBreadcrumbs(items: BreadcrumbItem[] | null) {
  const context = useContext(BreadcrumbContext);

  useEffect(() => {
    if (!context) {
      return;
    }

    context.setOverrideItems(items);

    return () => {
      context.setOverrideItems(null);
    };
  }, [context, items]);
}
