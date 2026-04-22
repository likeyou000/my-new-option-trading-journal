"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { TrendingUp, TrendingDown, Target, Calendar, Brain, Award, IndianRupee } from "lucide-react"

const chartConfig: ChartConfig = {
  pnl: { label: "P&L", color: "hsl(160, 84%, 39%)" },
  winRate: { label: "Win Rate %", color: "hsl(48, 96%, 53%)" },
}

export function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Reports</h3>
          <p className="text-muted-foreground text-sm">Detailed performance analytics</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const adv = data?.advanced || {}

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Reports</h3>
        <p className="text-muted-foreground text-sm">Detailed options trading analytics</p>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-11">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win/Loss Ratio</p>
                    <p className="text-xl font-bold">{adv.winLossRatio || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Win</p>
                    <p className="text-xl font-bold text-emerald-500">₹{(adv.avgWin || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Loss</p>
                    <p className="text-xl font-bold text-red-500">₹{(adv.avgLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expectancy</p>
                    <p className="text-xl font-bold">₹{(adv.expectancy || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Brokerage</p>
                    <p className="text-xl font-bold text-amber-500">₹{(data?.totalBrokerage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Best Day</p>
                    <p className="text-xl font-bold text-emerald-500">₹{(adv.bestDay?.pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">{adv.bestDay?.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* Option Type Performance (CE vs PE) */}
          {data?.optionTypePerformance && data.optionTypePerformance.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CE vs PE Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                  <BarChart data={data.optionTypePerformance} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {data.optionTypePerformance.map((entry: { name: string; pnl: number }, index: number) => (
                        <Cell
                          key={index}
                          fill={entry.name === "CE" ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Strategy Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Strategy-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full">
                <BarChart data={data?.strategyPerformance || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `₹${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {(data?.strategyPerformance || []).map((entry: { pnl: number }, index: number) => (
                      <Cell key={index} fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Symbol Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Symbol-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full">
                <BarChart data={data?.symbolPerformance || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `₹${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {(data?.symbolPerformance || []).map((entry: { pnl: number }, index: number) => (
                      <Cell key={index} fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Weekday Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekday Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                  <BarChart data={data?.weekdayPerformance || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {(data?.weekdayPerformance || []).map((entry: { pnl: number }, index: number) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Emotional State Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Emotional State Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                  <BarChart data={data?.emotionalAnalysis || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} className="text-xs" tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {(data?.emotionalAnalysis || []).map((entry: { pnl: number }, index: number) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
