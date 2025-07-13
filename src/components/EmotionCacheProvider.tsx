"use client";
import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

export default function EmotionCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createCache({ key: "css", prepend: true }));
  return <CacheProvider value={cache}>{children}</CacheProvider>;
} 