"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Sparkles, FileText, Target, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"

export function AIAnalyzer() {
  const [selectedTrade, setSelectedTrade] = useState<string>("")

  const { data: tradesData } = useQuery({
    queryKey: ["trades-for-ai"],
    queryFn: async () => {
      const res = await fetch("/api/trades?limit=20")
      if (!res.ok) throw new Error("Failed to fetch trades")
      return res.json()
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: async (tradeId?: string) => {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: tradeId || undefined }),
      })
      if (!res.ok) throw new Error("Failed to analyze")
      return res.json()
    },
  })

  const weeklyMutation = useMutation({
    mutationFn: async (days: number = 7) => {
      const res = await fetch("/api/ai/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) throw new Error("Failed to generate report")
      return res.json()
    },
  })

  const strategyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/strategy", {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to get strategy feedback")
      return res.json()
    },
  })

  const trades = tradesData?.trades || []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-7 w-7 text-emerald-500" />
          AI Analyzer
        </h3>
        <p className="text-muted-foreground text-sm">Get AI-powered insights on your trading performance</p>
      </div>

      <Tabs defaultValue="trade-review" className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="grid w-full grid-cols-3 max-w-lg min-w-[280px] h-11">
            <TabsTrigger value="trade-review" className="text-xs sm:text-sm">Trade Review</TabsTrigger>
            <TabsTrigger value="weekly-report" className="text-xs sm:text-sm">Weekly Report</TabsTrigger>
            <TabsTrigger value="strategy-feedback" className="text-xs sm:text-sm">Strategy Feedback</TabsTrigger>
          </TabsList>
        </div>

        {/* Trade Review AI */}
        <TabsContent value="trade-review" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI Trade Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px] w-full sm:w-auto">
                  <p className="text-sm text-muted-foreground mb-2">Select a trade to analyze (or leave empty to analyze recent trades)</p>
                  <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a trade..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent 10 Trades</SelectItem>
                      {trades.map((t: Record<string, unknown>) => (
                        <SelectItem key={t.id as string} value={t.id as string}>
                          {t.symbol as string} - {new Date(t.date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ₹{(t.pnl as number).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => analyzeMutation.mutate(selectedTrade === "recent" ? undefined : selectedTrade || undefined)}
                  disabled={analyzeMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Analyze</>
                  )}
                </Button>
              </div>

              {analyzeMutation.data?.analysis && (
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                  <ReactMarkdown>{analyzeMutation.data.analysis}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Report AI */}
        <TabsContent value="weekly-report" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                AI Weekly Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Generate an AI-powered weekly report</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => weeklyMutation.mutate(7)}
                      disabled={weeklyMutation.isPending}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => weeklyMutation.mutate(14)}
                      disabled={weeklyMutation.isPending}
                    >
                      Last 14 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => weeklyMutation.mutate(30)}
                      disabled={weeklyMutation.isPending}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                </div>
              </div>

              {weeklyMutation.isPending && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  <p className="text-sm text-muted-foreground">Generating your weekly report...</p>
                </div>
              )}

              {weeklyMutation.data?.report && (
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                  <ReactMarkdown>{weeklyMutation.data.report}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Feedback */}
        <TabsContent value="strategy-feedback" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-rose-500" />
                AI Strategy Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get AI-powered analysis of your strategy performance and optimization suggestions.
              </p>
              <Button
                onClick={() => strategyMutation.mutate()}
                disabled={strategyMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {strategyMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                ) : (
                  <><Target className="h-4 w-4 mr-2" />Analyze Strategies</>
                )}
              </Button>

              {strategyMutation.data?.feedback && (
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                  <ReactMarkdown>{strategyMutation.data.feedback}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
