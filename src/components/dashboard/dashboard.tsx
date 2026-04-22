"use client"

import { useQuery } from "@tanstack/react-query"
import { StatsCards } from "./stats-cards"
import { PnlChart } from "./pnl-chart"
import { WinLossChart } from "./win-loss-chart"
import { StrategyChart } from "./strategy-chart"
import { DailyPnlChart } from "./daily-pnl-chart"
import { WeekdayAccuracyChart } from "./weekday-accuracy-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { LOT_SIZES } from "@/lib/options"

export function Dashboard() {
  const { setCurrentView, setEditingTradeId } = useAppStore()
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  // Fetch open trades (trades without exit price)
  const { data: openTradesData } = useQuery({
    queryKey: ["open-trades"],
    queryFn: async () => {
      const res = await fetch("/api/trades?limit=50")
      if (!res.ok) throw new Error("Failed to fetch trades")
      return res.json()
    },
  })

  const openTrades = (openTradesData?.trades || []).filter(
    (t: Record<string, unknown>) => !t.exitPrice && t.outcome === "PENDING"
  )

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

      {/* Open Positions */}
      {openTrades.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-[10px] text-amber-500 font-bold">{openTrades.length}</span>
              </div>
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {openTrades.map((trade: Record<string, unknown>) => {
                const sym = trade.symbol as string
                const strike = trade.strikePrice as number
                const ot = trade.optionType as string
                const expiry = trade.expiryDate as string
                const tt = trade.tradeType as string
                const lotSize = LOT_SIZES[sym] || 0
                const qty = (trade.lots as number) * lotSize
                const investment = (trade.entryPrice as number) * qty
                let tradeName = `${sym} ${strike} ${ot}`
                if (expiry) {
                  const d = new Date(expiry)
                  const m = d.toLocaleString('en-IN', { month: 'short' }).toUpperCase()
                  tradeName = `${sym} ${strike} ${ot} (${d.getDate()} ${m})`
                }

                return (
                  <div
                    key={trade.id as string}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border hover:bg-background/80 cursor-pointer transition-colors"
                    onClick={() => {
                      setEditingTradeId(trade.id as string)
                      setCurrentView("add-trade")
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={ot === "CE"
                          ? "border-emerald-500 text-emerald-500"
                          : "border-red-500 text-red-500"
                        }
                      >
                        {ot === "CE" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {ot}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{tradeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {tt} • {trade.lots as number} lots • ₹{(trade.entryPrice as number).toFixed(2)} premium
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Investment</p>
                      <p className="text-sm font-medium">₹{investment.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Click a trade to update with exit price</p>
          </CardContent>
        </Card>
      )}

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
