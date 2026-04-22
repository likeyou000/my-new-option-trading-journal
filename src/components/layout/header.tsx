"use client"

import { useAppStore, type ViewType } from "@/store/app-store"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Menu } from "lucide-react"

const viewTitles: Record<ViewType, string> = {
  dashboard: "Dashboard",
  "add-trade": "Add Trade",
  history: "Trade History",
  reports: "Reports",
  "ai-analyzer": "AI Analyzer",
  calendar: "Calendar View",
  backtest: "Backtesting",
}

export function AppHeader() {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h2 className="text-lg font-semibold">{viewTitles[currentView]}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
