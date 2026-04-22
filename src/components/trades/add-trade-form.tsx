"use client"

import { useState, useCallback, useMemo } from "react"
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
import {
  Save, RotateCcw, TrendingUp, TrendingDown, Calculator,
  ArrowUpCircle, ArrowDownCircle, Info
} from "lucide-react"
import {
  SYMBOLS, OPTION_TYPES, TRADE_TYPES, STRATEGIES, EMOTIONS, MISTAKE_OPTIONS,
  LOT_SIZES, calculateQuantity, calculatePnl, calculatePnlPercent,
  calculateCharges, calculateRR, generateTradeName, detectOutcome
} from "@/lib/options"

interface TradeForm {
  symbol: string
  optionType: string
  strikePrice: string
  expiryDate: string
  tradeType: string
  lots: string
  entryPrice: string
  exitPrice: string
  stopLoss: string
  target: string
  strategy: string
  outcome: string
  notes: string
  date: string
  // Psychology
  confidence: number
  satisfaction: number
  emotionalState: string
  mistakes: string[]
  lessonsLearned: string
}

const defaultForm: TradeForm = {
  symbol: "NIFTY",
  optionType: "PE",
  strikePrice: "",
  expiryDate: "",
  tradeType: "BUY",
  lots: "1",
  entryPrice: "",
  exitPrice: "",
  stopLoss: "",
  target: "",
  strategy: "",
  outcome: "PENDING",
  notes: "",
  date: new Date().toISOString().split("T")[0],
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

  // Load trade data for editing
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

  const populateForm = useCallback(() => {
    if (!editData?.trade) {
      setForm(defaultForm)
      return
    }
    const t = editData.trade
    setForm({
      symbol: t.symbol || "NIFTY",
      optionType: t.optionType || "PE",
      strikePrice: t.strikePrice?.toString() || "",
      expiryDate: t.expiryDate ? t.expiryDate.split("T")[0] : "",
      tradeType: t.tradeType || "BUY",
      lots: t.lots?.toString() || "1",
      entryPrice: t.entryPrice?.toString() || "",
      exitPrice: t.exitPrice?.toString() || "",
      stopLoss: t.stopLoss?.toString() || "",
      target: t.target?.toString() || "",
      strategy: t.strategy || "",
      outcome: t.outcome || "PENDING",
      notes: t.notes || "",
      date: t.date ? t.date.split("T")[0] : new Date().toISOString().split("T")[0],
      confidence: t.psychology?.confidence || 5,
      satisfaction: t.psychology?.satisfaction || 5,
      emotionalState: t.psychology?.emotionalState || "Calm",
      mistakes: t.psychology?.mistakes ? t.psychology.mistakes.split(",") : [],
      lessonsLearned: t.psychology?.lessonsLearned || "",
    })
  }, [editData])

  // Auto calculations
  const symbol = form.symbol
  const lots = parseInt(form.lots) || 0
  const entryPrice = parseFloat(form.entryPrice) || 0
  const exitPrice = parseFloat(form.exitPrice) || 0
  const stopLoss = parseFloat(form.stopLoss) || 0
  const target = parseFloat(form.target) || 0

  const lotSize = LOT_SIZES[symbol] || 0
  const quantity = useMemo(() => calculateQuantity(symbol, lots), [symbol, lots])
  const investment = useMemo(() => entryPrice * quantity, [entryPrice, quantity])

  const calculatedPnl = useMemo(() => {
    if (!exitPrice || !entryPrice || !quantity) return 0
    return calculatePnl(form.tradeType, entryPrice, exitPrice, quantity)
  }, [form.tradeType, entryPrice, exitPrice, quantity])

  const calculatedPnlPercent = useMemo(() => {
    if (!exitPrice || !entryPrice || !quantity) return 0
    return calculatePnlPercent(form.tradeType, entryPrice, exitPrice, quantity)
  }, [form.tradeType, entryPrice, exitPrice, quantity])

  const calculatedBrokerage = useMemo(() => {
    if (!exitPrice || !entryPrice || !quantity) return 0
    return calculateCharges(form.tradeType, entryPrice, exitPrice, quantity, calculatedPnl)
  }, [form.tradeType, entryPrice, exitPrice, quantity, calculatedPnl])

  const calculatedNetPnl = useMemo(() => {
    if (!exitPrice || !entryPrice) return 0
    return calculatedPnl - calculatedBrokerage
  }, [calculatedPnl, calculatedBrokerage, entryPrice, exitPrice])

  const calculatedRR = useMemo(() => {
    if (!stopLoss || !target || !entryPrice) return 0
    return calculateRR(entryPrice, stopLoss, target)
  }, [entryPrice, stopLoss, target])

  const autoOutcome = useMemo(() => {
    if (!exitPrice || !entryPrice) return "PENDING"
    return detectOutcome(calculatedPnl)
  }, [exitPrice, entryPrice, calculatedPnl])

  const tradeName = useMemo(() => {
    if (!symbol || !form.strikePrice || !form.optionType) return ""
    if (!form.expiryDate) return `${symbol} ${form.strikePrice} ${form.optionType}`
    return generateTradeName(symbol, parseInt(form.strikePrice), form.optionType, form.expiryDate)
  }, [symbol, form.strikePrice, form.optionType, form.expiryDate])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editingTradeId ? `/api/trades/${editingTradeId}` : "/api/trades"
      const method = editingTradeId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          strikePrice: parseInt(form.strikePrice),
          lots: parseInt(form.lots),
          quantity,
          mistakes: form.mistakes.join(","),
          outcome: form.exitPrice ? autoOutcome : form.outcome,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save trade")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(editingTradeId ? "Trade updated successfully!" : "Trade logged successfully!")
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      setForm(defaultForm)
      setEditingTradeId(null)
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save trade")
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Trade" : "Log New Trade"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isEditing ? "Update your trade details" : "Record your options trade with full details"}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="outline" size="sm" onClick={populateForm}>
              Load Trade Data
            </Button>
          )}
        </div>
      </div>

      {/* Trade Name Preview */}
      {tradeName && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{tradeName}</span>
          <span className="text-xs text-muted-foreground ml-1">
            • Lot Size: {lotSize} • Qty: {quantity}
          </span>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="general">Trade Details</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Options Contract Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Options Contract
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Symbol */}
                <div className="space-y-2">
                  <Label>Symbol *</Label>
                  <Select value={form.symbol} onValueChange={(v) => setForm(prev => ({ ...prev, symbol: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOLS.map(s => (
                        <SelectItem key={s} value={s}>{s} (Lot: {LOT_SIZES[s]})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Strike Price */}
                <div className="space-y-2">
                  <Label htmlFor="strikePrice">Strike Price *</Label>
                  <Input
                    id="strikePrice"
                    type="number"
                    placeholder="e.g., 22500"
                    value={form.strikePrice}
                    onChange={(e) => setForm(prev => ({ ...prev, strikePrice: e.target.value }))}
                  />
                </div>

                {/* Option Type CE/PE */}
                <div className="space-y-2">
                  <Label>Option Type *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.optionType === "CE" ? "default" : "outline"}
                      className={form.optionType === "CE" ? "bg-emerald-500 hover:bg-emerald-600 text-white flex-1" : "flex-1"}
                      onClick={() => setForm(prev => ({ ...prev, optionType: "CE" }))}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" /> CE
                    </Button>
                    <Button
                      type="button"
                      variant={form.optionType === "PE" ? "default" : "outline"}
                      className={form.optionType === "PE" ? "bg-red-500 hover:bg-red-600 text-white flex-1" : "flex-1"}
                      onClick={() => setForm(prev => ({ ...prev, optionType: "PE" }))}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" /> PE
                    </Button>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>

                {/* Trade Type BUY/SELL */}
                <div className="space-y-2">
                  <Label>Trade Type *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.tradeType === "BUY" ? "default" : "outline"}
                      className={form.tradeType === "BUY" ? "bg-emerald-500 hover:bg-emerald-600 text-white flex-1" : "flex-1"}
                      onClick={() => setForm(prev => ({ ...prev, tradeType: "BUY" }))}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-1" /> BUY
                    </Button>
                    <Button
                      type="button"
                      variant={form.tradeType === "SELL" ? "default" : "outline"}
                      className={form.tradeType === "SELL" ? "bg-amber-500 hover:bg-amber-600 text-white flex-1" : "flex-1"}
                      onClick={() => setForm(prev => ({ ...prev, tradeType: "SELL" }))}
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-1" /> SELL
                    </Button>
                  </div>
                </div>

                {/* Lots */}
                <div className="space-y-2">
                  <Label htmlFor="lots">Lots *</Label>
                  <Input
                    id="lots"
                    type="number"
                    min="1"
                    placeholder="e.g., 2"
                    value={form.lots}
                    onChange={(e) => setForm(prev => ({ ...prev, lots: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Qty = {lotSize} × {lots} = {quantity}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price & Risk */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Premium & Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Entry Premium */}
                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Premium *</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.05"
                    placeholder="₹0.00"
                    value={form.entryPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                  />
                </div>

                {/* Exit Premium */}
                <div className="space-y-2">
                  <Label htmlFor="exitPrice">Exit Premium</Label>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.05"
                    placeholder="₹0.00 (leave blank if open)"
                    value={form.exitPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                  />
                </div>

                {/* Trade Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Trade Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                {/* Stop Loss */}
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss (Premium)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.05"
                    placeholder="₹0.00"
                    value={form.stopLoss}
                    onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                  />
                </div>

                {/* Target */}
                <div className="space-y-2">
                  <Label htmlFor="target">Target (Premium)</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.05"
                    placeholder="₹0.00"
                    value={form.target}
                    onChange={(e) => setForm(prev => ({ ...prev, target: e.target.value }))}
                  />
                </div>

                {/* Strategy */}
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Setup Reason</Label>
                <Textarea
                  id="notes"
                  placeholder="Why did you take this trade? What was the setup?"
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
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Live Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Investment</p>
                  <p className="text-base sm:text-lg font-bold">
                    ₹{investment.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Gross P&L</p>
                  <p className={`text-base sm:text-lg font-bold ${calculatedPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ₹{calculatedPnl.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">P&L %</p>
                  <p className={`text-base sm:text-lg font-bold ${calculatedPnlPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {calculatedPnlPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Charges</p>
                  <p className="text-base sm:text-lg font-bold text-amber-500">
                    ₹{calculatedBrokerage.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Net P&L</p>
                  <p className={`text-base sm:text-lg font-bold ${calculatedNetPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ₹{calculatedNetPnl.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">R:R</p>
                  <p className="text-base sm:text-lg font-bold text-amber-500">
                    1:{calculatedRR.toFixed(1)}
                  </p>
                </div>
              </div>
              {exitPrice && entryPrice && (
                <div className="mt-3 flex items-center justify-center">
                  <Badge
                    className={
                      autoOutcome === "WIN" ? "bg-emerald-500/15 text-emerald-500 text-sm px-3 py-1" :
                      autoOutcome === "LOSS" ? "bg-red-500/15 text-red-500 text-sm px-3 py-1" :
                      "bg-yellow-500/15 text-yellow-600 text-sm px-3 py-1"
                    }
                  >
                    Auto Outcome: {autoOutcome}
                  </Badge>
                </div>
              )}
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
          disabled={saveMutation.isPending || !form.symbol || !form.entryPrice || !form.lots || !form.strikePrice || !form.expiryDate}
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
