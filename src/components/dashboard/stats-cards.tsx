"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, BarChart3, Brain, Activity, IndianRupee, PieChart } from "lucide-react"
import { motion } from "framer-motion"

interface StatsData {
  totalPnl: number
  netPnl: number
  totalBrokerage: number
  winRate: number
  avgRR: number
  totalTrades: number
  confidenceIndex: number
  cePeBreakdown?: {
    ce: { count: number; pnl: number; winRate: number }
    pe: { count: number; pnl: number; winRate: number }
  }
}

interface StatsCardsProps {
  data?: StatsData
  isLoading: boolean
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const netPnl = data?.netPnl ?? data?.totalPnl ?? 0
  const grossPnl = data?.totalPnl ?? 0

  const cards = [
    {
      title: "Net P&L",
      value: `₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: data?.totalBrokerage ? `Charges: ₹${data.totalBrokerage.toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : undefined,
      icon: netPnl > 0 ? TrendingUp : TrendingDown,
      color: netPnl > 0 ? "text-emerald-500" : "text-red-500",
      bg: netPnl > 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      title: "Win Rate",
      value: `${data?.winRate?.toFixed(1) || 0}%`,
      icon: Target,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Avg R:R",
      value: `${data?.avgRR?.toFixed(2) || 0}`,
      icon: BarChart3,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      title: "Total Trades",
      value: `${data?.totalTrades || 0}`,
      icon: Activity,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      title: "Confidence",
      value: `${data?.confidenceIndex?.toFixed(0) || 0}%`,
      icon: Brain,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {card.title}
                      </p>
                      <p className={`text-xl lg:text-2xl font-bold mt-1 ${card.color}`}>
                        {card.value}
                      </p>
                      {card.subtitle && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{card.subtitle}</p>
                      )}
                    </div>
                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* CE/PE Breakdown */}
      {data?.cePeBreakdown && (data.cePeBreakdown.ce.count > 0 || data.cePeBreakdown.pe.count > 0) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">CE (Call) Trades</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-lg font-bold">{data.cePeBreakdown.ce.count} trades</p>
                    <p className={`text-sm font-medium ${data.cePeBreakdown.ce.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      ₹{data.cePeBreakdown.ce.pnl.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                    <BadgeCE winRate={data.cePeBreakdown.ce.winRate} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">PE (Put) Trades</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-lg font-bold">{data.cePeBreakdown.pe.count} trades</p>
                    <p className={`text-sm font-medium ${data.cePeBreakdown.pe.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      ₹{data.cePeBreakdown.pe.pnl.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                    <BadgeCE winRate={data.cePeBreakdown.pe.winRate} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function BadgeCE({ winRate }: { winRate: number }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      winRate >= 50 ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
    }`}>
      {winRate.toFixed(0)}% WR
    </span>
  )
}
