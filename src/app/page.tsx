"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/store/app-store"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/header"
import { Dashboard } from "@/components/dashboard/dashboard"
import { AddTradeForm } from "@/components/trades/add-trade-form"
import { TradeHistory } from "@/components/trades/trade-history"
import { Reports } from "@/components/reports/reports"
import { AIAnalyzer } from "@/components/ai-analyzer/ai-analyzer"
import { CalendarView } from "@/components/calendar/calendar-view"
import { Backtesting } from "@/components/backtest/backtesting"
import { AuthPage } from "@/components/auth/auth-page"
import { Button } from "@/components/ui/button"
import { PlusCircle, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSyncExternalStore } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// Responsive hook - detect if mobile
const emptySubscribe = () => () => {}
function useIsMobile() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && window.innerWidth < 1024,
    () => false
  )
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="h-20 w-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
        <BookOpen className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold">Welcome to TradeDiary AI</h3>
        <p className="text-muted-foreground max-w-md text-sm">
          Start logging your option trades — CALL & PUT — to track performance, analyze patterns, and get AI-powered insights.
        </p>
      </div>
      <Button
        onClick={onStart}
        className="bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Log Your First Trade
      </Button>
    </div>
  )
}

// Main app content (only shown when authenticated)
function AppContent({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { currentView, sidebarOpen } = useAppStore()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()

  // Sync user to DB on mount
  useEffect(() => {
    const syncUser = async () => {
      try {
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Trader",
          }),
        })
      } catch {
        // Silently fail - user will be created on first trade
      }
    }
    syncUser()
  }, [user])

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const hasData = useMemo(() => {
    if (!statsData) return null // still loading
    return statsData.totalTrades > 0
  }, [statsData])

  const renderView = () => {
    // Show empty state on dashboard when no trades exist
    if (hasData === false && currentView === "dashboard") {
      return <EmptyState onStart={() => useAppStore.getState().setCurrentView("add-trade")} />
    }

    // Always allow adding trades even with no data
    if (currentView === "add-trade") {
      return <AddTradeForm />
    }

    // Other views need at least some data to be meaningful
    if (hasData === false) {
      return <EmptyState onStart={() => useAppStore.getState().setCurrentView("add-trade")} />
    }

    switch (currentView) {
      case "dashboard":
        return <Dashboard />
      case "add-trade":
        return <AddTradeForm />
      case "history":
        return <TradeHistory />
      case "reports":
        return <Reports />
      case "ai-analyzer":
        return <AIAnalyzer />
      case "calendar":
        return <CalendarView />
      case "backtest":
        return <Backtesting />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        !isMobile && (sidebarOpen ? "ml-60" : "ml-16"),
        isMobile && "ml-0"
      )}>
        <AppHeader user={user} onLogout={onLogout} />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {renderView()}
        </main>
        <footer className="border-t border-border py-2 sm:py-3 px-4 text-center text-[10px] sm:text-xs text-muted-foreground mt-auto">
          TradeDiary AI — Options Trading Journal · Powered by AI
        </footer>
      </div>
    </div>
  )
}

export default function HomePage() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createClient(), [])

  // Check auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setAuthLoading(false)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setAuthLoading(false)
        // Invalidate queries when auth changes
        queryClient.invalidateQueries({ queryKey: ["trades"] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, queryClient])

  const handleAuthSuccess = useCallback(() => {
    // Auth state change listener will handle updating the user
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    queryClient.clear()
  }, [supabase, queryClient])

  // Show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 animate-pulse">
            <BookOpen className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  // Show main app when authenticated
  return <AppContent user={user} onLogout={handleLogout} />
}
