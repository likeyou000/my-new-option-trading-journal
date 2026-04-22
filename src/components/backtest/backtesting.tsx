"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Play, History, TrendingUp, TrendingDown, Target, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

const STRATEGIES = ["Breakout", "Scalping", "Mean Reversion", "Momentum", "Trend Following", "VWAP", "Custom"]

const chartConfig: ChartConfig = {
  equity: { label: "Equity", color: "hsl(160, 84%, 39%)" },
}

export function Backtesting() {
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    strategy: "",
    entryCondition: "",
    exitCondition: "",
    stopLoss: "",
    takeProfit: "",
    initialCapital: "100000",
  })

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to run backtest")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Backtest completed!")
      queryClient.invalidateQueries({ queryKey: ["backtests"] })
    },
    onError: () => toast.error("Failed to run backtest"),
  })

  const queryClient = useQueryClient()

  const { data: backtestsData, isLoading } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const res = await fetch("/api/backtest")
      if (!res.ok) throw new Error("Failed to fetch backtests")
      return res.json()
    },
  })

  const [selectedBacktest, setSelectedBacktest] = useState<Record<string, unknown> | null>(null)

  const backtests = backtestsData?.results || []

  const equityCurve = selectedBacktest?.equityCurve
    ? JSON.parse(selectedBacktest.equityCurve as string)
    : []

  const tradeList = selectedBacktest?.tradeList
    ? JSON.parse(selectedBacktest.tradeList as string)
    : []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Play className="h-7 w-7 text-emerald-500" />
          Backtesting
        </h3>
        <p className="text-muted-foreground text-sm">Test your strategies against historical data</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Backtest Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Strategy Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input
                  placeholder="e.g., NIFTY Breakout Test"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g., NIFTY (empty for all)"
                  value={form.symbol}
                  onChange={(e) => setForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={form.strategy} onValueChange={(v) => setForm(prev => ({ ...prev, strategy: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Capital</Label>
                <Input
                  type="number"
                  value={form.initialCapital}
                  onChange={(e) => setForm(prev => ({ ...prev, initialCapital: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Entry Condition</Label>
              <Textarea
                placeholder="e.g., Price breaks above 20-day high with volume > 1.5x average"
                value={form.entryCondition}
                onChange={(e) => setForm(prev => ({ ...prev, entryCondition: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Exit Condition</Label>
              <Textarea
                placeholder="e.g., Price closes below 10-day low or RSI > 80"
                value={form.exitCondition}
                onChange={(e) => setForm(prev => ({ ...prev, exitCondition: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stop Loss (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 1.5"
                  value={form.stopLoss}
                  onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Take Profit (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 3.0"
                  value={form.takeProfit}
                  onChange={(e) => setForm(prev => ({ ...prev, takeProfit: e.target.value }))}
                />
              </div>
            </div>

            <Button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {runMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running Backtest...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Run Backtest</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Backtest Results */}
        <div className="space-y-4">
          {selectedBacktest && (
            <>
              {/* Results Summary */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Final Capital</p>
                        <p className="text-lg font-bold">₹{(selectedBacktest.finalCapital as number)?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="text-lg font-bold">{selectedBacktest.winRate as number}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Max Drawdown</p>
                        <p className="text-lg font-bold text-red-500">{selectedBacktest.maxDrawdown as number}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Profit Factor</p>
                        <p className="text-lg font-bold">{selectedBacktest.profitFactor as number}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Equity Curve */}
              {equityCurve.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <AreaChart data={equityCurve} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9 }} />
                        <Area type="monotone" dataKey="equity" stroke="hsl(160, 84%, 39%)" fill="url(#equityGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Trade List */}
              {tradeList.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Trade List ({tradeList.length} trades)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {tradeList.map((trade: { date: string; pnl: number; type: string }, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-muted/50">
                          <span className="text-muted-foreground">{trade.date}</span>
                          <Badge
                            variant="outline"
                            className={trade.type === "WIN" ? "border-emerald-500 text-emerald-500" : "border-red-500 text-red-500"}
                          >
                            {trade.type}
                          </Badge>
                          <span className={trade.pnl >= 0 ? "text-emerald-500" : "text-red-500"}>₹{trade.pnl.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Previous Backtests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" /> Previous Backtests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : backtests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No backtests yet. Run your first backtest above!</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {backtests.map((bt: Record<string, unknown>) => (
                <div
                  key={bt.id as string}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedBacktest?.id === bt.id ? "border-emerald-500 bg-emerald-500/5" : "border-border"
                  }`}
                  onClick={() => setSelectedBacktest(bt)}
                >
                  <div>
                    <p className="font-medium text-sm">{bt.name as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {bt.symbol as string} | {bt.strategy as string} | {new Date(bt.startDate as string).toLocaleDateString('en-IN')} - {new Date(bt.endDate as string).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="font-bold">{bt.winRate as number}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">P&L</p>
                      <p className={`font-bold ${((bt.finalCapital as number) - (bt.initialCapital as number)) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        ₹{((bt.finalCapital as number) - (bt.initialCapital as number)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
