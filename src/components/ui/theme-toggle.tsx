"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "@/components/ui/icons"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="w-9 h-9 p-0">
        <span className="sr-only">Toggle theme</span>
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-9 h-9 p-0"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <span className="sr-only">Toggle theme</span>
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
