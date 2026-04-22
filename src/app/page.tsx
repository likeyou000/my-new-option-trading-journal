"use client"

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { LiveMarket } from "@/components/market/live-market"
import { Button } from "@/components/ui/button"
import { Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useSyncExternalStore } from "react"

function SeedPrompt({ onSeeded }: { onSeeded: () => void }) {
  const queryClient = useQueryClient()
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seed", { method: "POST" })
      if (!res.ok) throw new Error("Failed to seed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Demo data loaded! Explore the app with sample trades.")
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      onSeeded()
    },
    onError: () => toast.error("Failed to load demo data"),
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="h-20 w-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
        <Database className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold">Welcome to TradeDiary AI</h3>
        <p className="text-muted-foreground max-w-md text-sm">
          Start by loading demo data to explore the app, or add your first trade manually.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {seedMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading Demo Data...</>
          ) : (
            <><Database className="h-4 w-4 mr-2" />Load Demo Data</>
          )}
        </Button>
      </div>
    </div>
  )
}

// Responsive hook - detect if mobile
const emptySubscribe = () => () => {}
function useIsMobile() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && window.innerWidth < 1024,
    () => false
  )
}

export default function HomePage() {
  const { currentView, sidebarOpen } = useAppStore()
  const isMobile = useIsMobile()

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const hasData = useMemo(() => {
    if (!statsData) return null
    return statsData.totalTrades > 0
  }, [statsData])

  const renderView = () => {
    if (hasData === false) {
      return <SeedPrompt onSeeded={() => queryClient.invalidateQueries({ queryKey: ["stats"] })} />
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
      case "live-market":
        return <LiveMarket />
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

  const queryClient = useQueryClient()

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        // On mobile, always full width; on desktop, offset by sidebar
        !isMobile && (sidebarOpen ? "ml-60" : "ml-16"),
        isMobile && "ml-0"
      )}>
        <AppHeader />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {renderView()}
        </main>
        <footer className="border-t border-border py-2 sm:py-3 px-4 text-center text-[10px] sm:text-xs text-muted-foreground">
          TradeDiary AI — Smart Trading Journal · Powered by AI
        </footer>
      </div>
    </div>
  )
}
