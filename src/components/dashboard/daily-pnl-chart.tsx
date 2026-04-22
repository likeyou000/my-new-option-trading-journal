"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"

interface DailyPnlChartProps {
  data: { date: string; pnl: number; count: number }[]
}

const chartConfig: ChartConfig = {
  pnl: { label: "Daily P&L", color: "hsl(160, 84%, 39%)" },
}

export function DailyPnlChart({ data }: DailyPnlChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              className="text-xs"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`}
              className="text-xs"
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, "P&L"]}
                />
              }
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
