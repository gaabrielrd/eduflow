"use client";

import { useSession } from "@/hooks/use-session";

export function useCurrentUser() {
  return useSession().user;
}
