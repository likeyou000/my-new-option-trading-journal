"use client"

import { useAppStore, type ViewType } from "@/store/app-store"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Menu, LogOut, User } from "lucide-react"
import { useSyncExternalStore } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const viewTitles: Record<ViewType, string> = {
  dashboard: "Dashboard",
  "add-trade": "Add Trade",
  history: "Trade History",
  reports: "Reports",
  "ai-analyzer": "AI Analyzer",
  calendar: "Calendar View",
  backtest: "Backtesting",
}

const emptySubscribe = () => () => {}

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client snapshot
    () => false   // server snapshot
  )
}

interface AppHeaderProps {
  user?: SupabaseUser | null
  onLogout?: () => void
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useIsMounted()

  const userEmail = user?.email || ""
  const userName = user?.user_metadata?.name || userEmail.split("@")[0] || "Trader"
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

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
          {!mounted
            ? <Sun className="h-4 w-4" />
            : (resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)
          }
        </Button>

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-emerald-500/20 text-emerald-500 font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-500"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
