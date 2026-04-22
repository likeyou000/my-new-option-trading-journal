"use client"

import { useQuery } from "@tanstack/react-query"
import { StatsCards } from "./stats-cards"
import { PnlChart } from "./pnl-chart"
import { WinLossChart } from "./win-loss-chart"
import { StrategyChart } from "./strategy-chart"
import { DailyPnlChart } from "./daily-pnl-chart"
import { WeekdayAccuracyChart } from "./weekday-accuracy-chart"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function Dashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Trading Overview</h3>
          <p className="text-muted-foreground text-sm">Your options trading performance at a glance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <StatsCards data={data} isLoading={isLoading} />

      {/* Weekday Accuracy - Prominent placement */}
      <WeekdayAccuracyChart data={data?.weekdayPerformance || []} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <PnlChart data={data?.cumulativePnl || []} />
        <WinLossChart data={data?.winLossData || { wins: 0, losses: 0, breakeven: 0 }} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <StrategyChart data={data?.strategyPerformance || []} />
        <DailyPnlChart data={data?.dailyPnl || []} />
      </div>
    </div>
  )
}
