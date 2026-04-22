"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface StrategyChartProps {
  data: { name: string; pnl: number; count: number; winRate: number }[]
}

const chartConfig: ChartConfig = {
  pnl: { label: "P&L", color: "hsl(160, 84%, 39%)" },
  winRate: { label: "Win Rate %", color: "hsl(48, 96%, 53%)" },
}

export function StrategyChart({ data }: StrategyChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Strategy Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
            <YAxis
              tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`}
              className="text-xs"
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    name === 'pnl' ? `₹${Number(value).toLocaleString('en-IN')}` : `${value}%`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                />
              }
            />
            <Bar dataKey="pnl" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
