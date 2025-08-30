"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// next-themes v0.2+ exports types from the root entry
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
