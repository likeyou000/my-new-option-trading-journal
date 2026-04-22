"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { CalendarDays } from "lucide-react"

interface WeekdayAccuracyChartProps {
  data: { name: string; pnl: number; count: number; winRate: number }[]
}

const chartConfig: ChartConfig = {
  winRate: { label: "Win Rate %", color: "hsl(160, 84%, 39%)" },
  pnl: { label: "Avg P&L", color: "hsl(48, 96%, 53%)" },
}

export function WeekdayAccuracyChart({ data }: WeekdayAccuracyChartProps) {
  // Reorder data to show trading days in order (Mon-Fri) and abbreviate names
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const shortNames: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  }

  const orderedData = dayOrder
    .filter(day => data.some(d => d.name === day))
    .map(day => {
      const d = data.find(item => item.name === day)
      return d ? { ...d, shortName: shortNames[d.name] || d.name } : null
    })
    .filter(Boolean) as { name: string; shortName: string; pnl: number; count: number; winRate: number }[]

  // Add any extra days not in the standard trading day order
  data.forEach(d => {
    if (!dayOrder.includes(d.name)) {
      orderedData.push({ ...d, shortName: shortNames[d.name] || d.name })
    }
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-amber-500" />
          Accuracy by Trading Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orderedData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No trading day data yet
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[160px] sm:h-[200px] w-full">
              <BarChart data={orderedData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="shortName"
                  className="text-xs"
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        name === 'winRate' ? `${value}%` : `₹${Number(value).toLocaleString('en-IN')}`,
                        chartConfig[name as keyof typeof chartConfig]?.label || name,
                      ]}
                    />
                  }
                />
                <Bar dataKey="winRate" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {orderedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.winRate >= 60 ? "hsl(160, 84%, 39%)" :
                        entry.winRate >= 45 ? "hsl(48, 96%, 53%)" :
                        "hsl(0, 84%, 60%)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Day-by-day detail strip */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="grid grid-cols-5 gap-2 mt-3 min-w-[300px]">
                {orderedData.map((day) => (
                  <div
                    key={day.name}
                    className="text-center p-1.5 sm:p-2 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{day.shortName}</p>
                    <p className={`text-xs sm:text-sm font-bold ${
                      day.winRate >= 60 ? "text-emerald-500" :
                      day.winRate >= 45 ? "text-amber-500" :
                      "text-red-500"
                    }`}>
                      {day.winRate.toFixed(0)}%
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground">{day.count} trades</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
