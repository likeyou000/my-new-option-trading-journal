"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, BarChart3, Brain, Activity } from "lucide-react"
import { motion } from "framer-motion"

interface StatsData {
  totalPnl: number
  winRate: number
  avgRR: number
  totalTrades: number
  confidenceIndex: number
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

  const cards = [
    {
      title: "Total P&L",
      value: `₹${(data?.totalPnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: data?.totalPnl && data.totalPnl > 0 ? TrendingUp : TrendingDown,
      color: data?.totalPnl && data.totalPnl > 0 ? "text-emerald-500" : "text-red-500",
      bg: data?.totalPnl && data.totalPnl > 0 ? "bg-emerald-500/10" : "bg-red-500/10",
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
                  </div>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
