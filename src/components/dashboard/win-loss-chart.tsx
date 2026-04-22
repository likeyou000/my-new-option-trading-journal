"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Cell, Pie, PieChart } from "recharts"

interface WinLossChartProps {
  data: { wins: number; losses: number; breakeven: number }
}

const chartConfig: ChartConfig = {
  wins: { label: "Wins", color: "hsl(160, 84%, 39%)" },
  losses: { label: "Losses", color: "hsl(0, 84%, 60%)" },
  breakeven: { label: "Breakeven", color: "hsl(48, 96%, 53%)" },
}

const COLORS = ["hsl(160, 84%, 39%)", "hsl(0, 84%, 60%)", "hsl(48, 96%, 53%)"]

export function WinLossChart({ data }: WinLossChartProps) {
  const chartData = [
    { name: "Wins", value: data.wins, fill: COLORS[0] },
    { name: "Losses", value: data.losses, fill: COLORS[1] },
    { name: "Breakeven", value: data.breakeven, fill: COLORS[2] },
  ]

  const total = data.wins + data.losses + data.breakeven

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Win vs Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Wins</span>
              <span className="font-bold ml-auto">{data.wins} ({total > 0 ? ((data.wins / total) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Losses</span>
              <span className="font-bold ml-auto">{data.losses} ({total > 0 ? ((data.losses / total) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Breakeven</span>
              <span className="font-bold ml-auto">{data.breakeven} ({total > 0 ? ((data.breakeven / total) * 100).toFixed(1) : 0}%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
