"use client";

import { createContext, useContext } from "react";
import { DEFAULT_STORE_SETTINGS } from "@/lib/format";
import type { StoreSettings } from "@/types";

const CommerceSettingsContext = createContext<StoreSettings>(DEFAULT_STORE_SETTINGS);

export function CommerceSettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  return <CommerceSettingsContext.Provider value={settings}>{children}</CommerceSettingsContext.Provider>;
}

export function useCommerceSettings() {
  return useContext(CommerceSettingsContext);
}
