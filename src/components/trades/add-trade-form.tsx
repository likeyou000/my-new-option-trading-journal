"use client"

import { useState, useCallback } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/store/app-store"
import { toast } from "sonner"
import { Save, RotateCcw, TrendingUp, TrendingDown, Calculator } from "lucide-react"

const STRATEGIES = ["Breakout", "Scalping", "Mean Reversion", "Momentum", "Trend Following", "VWAP", "Other"]
const EMOTIONS = ["Calm", "FOMO", "Fear", "Overconfidence"]
const MISTAKE_OPTIONS = ["Overtrading", "No SL", "Early Exit", "Late Exit"]

interface TradeForm {
  symbol: string
  date: string
  entryPrice: string
  exitPrice: string
  quantity: string
  direction: string
  stopLoss: string
  target: string
  strategy: string
  outcome: string
  notes: string
  confidence: number
  satisfaction: number
  emotionalState: string
  mistakes: string[]
  lessonsLearned: string
}

const defaultForm: TradeForm = {
  symbol: "",
  date: new Date().toISOString().split("T")[0],
  entryPrice: "",
  exitPrice: "",
  quantity: "",
  direction: "LONG",
  stopLoss: "",
  target: "",
  strategy: "",
  outcome: "PENDING",
  notes: "",
  confidence: 5,
  satisfaction: 5,
  emotionalState: "Calm",
  mistakes: [],
  lessonsLearned: "",
}

export function AddTradeForm() {
  const { editingTradeId, setEditingTradeId } = useAppStore()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<TradeForm>(defaultForm)

  // Load trade data for editing using useQuery
  const { data: editData } = useQuery({
    queryKey: ["trade", editingTradeId],
    queryFn: async () => {
      if (!editingTradeId) return null
      const res = await fetch(`/api/trades/${editingTradeId}`)
      if (!res.ok) throw new Error("Failed to fetch trade")
      return res.json()
    },
    enabled: !!editingTradeId,
  })

  // Populate form when edit data is loaded
  const populateForm = useCallback(() => {
    if (!editData?.trade) {
      setForm(defaultForm)
      return
    }
    const t = editData.trade
    setForm({
      symbol: t.symbol,
      date: t.date.split("T")[0],
      entryPrice: t.entryPrice.toString(),
      exitPrice: t.exitPrice?.toString() || "",
      quantity: t.quantity.toString(),
      direction: t.direction,
      stopLoss: t.stopLoss?.toString() || "",
      target: t.target?.toString() || "",
      strategy: t.strategy || "",
      outcome: t.outcome,
      notes: t.notes || "",
      confidence: t.psychology?.confidence || 5,
      satisfaction: t.psychology?.satisfaction || 5,
      emotionalState: t.psychology?.emotionalState || "Calm",
      mistakes: t.psychology?.mistakes ? t.psychology.mistakes.split(",") : [],
      lessonsLearned: t.psychology?.lessonsLearned || "",
    })
  }, [editData])

  // Auto calculations
  const entryPrice = parseFloat(form.entryPrice) || 0
  const exitPrice = parseFloat(form.exitPrice) || 0
  const stopLoss = parseFloat(form.stopLoss) || 0
  const target = parseFloat(form.target) || 0
  const quantity = parseInt(form.quantity) || 0

  const calculatedPnl = (() => {
    if (!exitPrice || !entryPrice || !quantity) return 0
    return form.direction === "LONG"
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity
  })()

  const calculatedPnlPercent = (() => {
    if (!exitPrice || !entryPrice) return 0
    return form.direction === "LONG"
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100
  })()

  const calculatedRR = (() => {
    if (!stopLoss || !target || !entryPrice) return 0
    const risk = Math.abs(entryPrice - stopLoss)
    const reward = Math.abs(target - entryPrice)
    return risk > 0 ? (reward / risk).toFixed(2) : "0"
  })()

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editingTradeId ? `/api/trades/${editingTradeId}` : "/api/trades"
      const method = editingTradeId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mistakes: form.mistakes.join(","),
        }),
      })
      if (!res.ok) throw new Error("Failed to save trade")
      return res.json()
    },
    onSuccess: () => {
      toast.success(editingTradeId ? "Trade updated successfully!" : "Trade logged successfully!")
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      setForm(defaultForm)
      setEditingTradeId(null)
    },
    onError: () => {
      toast.error("Failed to save trade")
    },
  })

  const toggleMistake = (mistake: string) => {
    setForm(prev => ({
      ...prev,
      mistakes: prev.mistakes.includes(mistake)
        ? prev.mistakes.filter(m => m !== mistake)
        : [...prev.mistakes, mistake],
    }))
  }

  const isEditing = !!editingTradeId && !!editData?.trade

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Trade" : "Log New Trade"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isEditing ? "Update your trade details" : "Record your trade with details and psychology"}
          </p>
        </div>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={populateForm}>
            Load Trade Data
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Trade Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., NIFTY"
                    value={form.symbol}
                    onChange={(e) => setForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Direction *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.direction === "LONG" ? "default" : "outline"}
                      className={form.direction === "LONG" ? "bg-emerald-500 hover:bg-emerald-600 text-white flex-1" : "flex-1"}
                      onClick={() => setForm(prev => ({ ...prev, direction: "LONG" }))}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" /> Long
                    </Button>
                    <Button
                      type="button"
                      variant={form.direction === "SHORT" ? "default" : "outline"}
                      className={form.direction === "SHORT" ? "bg-red-500 hover:bg-red-600 text-white flex-1" : "flex-1"}
                      onClick={() => setForm(prev => ({ ...prev, direction: "SHORT" }))}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" /> Short
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Price *</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.entryPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitPrice">Exit Price</Label>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.exitPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.stopLoss}
                    onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.target}
                    onChange={(e) => setForm(prev => ({ ...prev, target: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Strategy</Label>
                  <Select value={form.strategy} onValueChange={(v) => setForm(prev => ({ ...prev, strategy: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select value={form.outcome} onValueChange={(v) => setForm(prev => ({ ...prev, outcome: v }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAIL">Fail</SelectItem>
                    <SelectItem value="BE">Breakeven</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Trade Analysis / Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe your trade rationale, analysis, etc."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto Calculations Card */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Auto Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">P&L</p>
                  <p className={`text-base sm:text-lg font-bold ${calculatedPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ₹{calculatedPnl.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">P&L %</p>
                  <p className={`text-base sm:text-lg font-bold ${calculatedPnlPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {calculatedPnlPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Risk:Reward</p>
                  <p className="text-base sm:text-lg font-bold text-amber-500">
                    1:{calculatedRR}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="psychology" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Psychology & Emotions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Confidence</Label>
                  <Badge variant="outline" className="font-mono">{form.confidence}/10</Badge>
                </div>
                <Slider
                  value={[form.confidence]}
                  onValueChange={(v) => setForm(prev => ({ ...prev, confidence: v[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Satisfaction</Label>
                  <Badge variant="outline" className="font-mono">{form.satisfaction}/10</Badge>
                </div>
                <Slider
                  value={[form.satisfaction]}
                  onValueChange={(v) => setForm(prev => ({ ...prev, satisfaction: v[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Emotional State</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EMOTIONS.map(emotion => (
                    <Button
                      key={emotion}
                      type="button"
                      variant={form.emotionalState === emotion ? "default" : "outline"}
                      size="sm"
                      className={`min-h-[44px] ${form.emotionalState === emotion ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
                      onClick={() => setForm(prev => ({ ...prev, emotionalState: emotion }))}
                    >
                      {emotion === "Calm" && "🧘 "}
                      {emotion === "FOMO" && "😰 "}
                      {emotion === "Fear" && "😨 "}
                      {emotion === "Overconfidence" && "😎 "}
                      {emotion}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mistakes Checklist</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MISTAKE_OPTIONS.map(mistake => (
                    <div key={mistake} className="flex items-center space-x-2 min-h-[44px]">
                      <Checkbox
                        id={mistake}
                        checked={form.mistakes.includes(mistake)}
                        onCheckedChange={() => toggleMistake(mistake)}
                        className="h-5 w-5"
                      />
                      <label htmlFor={mistake} className="text-sm cursor-pointer">{mistake}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessons">Lessons Learned</Label>
                <Textarea
                  id="lessons"
                  placeholder="What did you learn from this trade?"
                  value={form.lessonsLearned}
                  onChange={(e) => setForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.symbol || !form.entryPrice || !form.quantity}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : isEditing ? "Update Trade" : "Log Trade"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setForm(defaultForm)
            setEditingTradeId(null)
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
