"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppStore } from "@/store/app-store"
import { toast } from "sonner"
import { Edit, Trash2, Eye, Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"
import { useState } from "react"

export function TradeHistory() {
  const { setEditingTradeId, setCurrentView } = useAppStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filterStrategy, setFilterStrategy] = useState("all")
  const [filterOutcome, setFilterOutcome] = useState("all")
  const [selectedTrade, setSelectedTrade] = useState<Record<string, unknown> | null>(null)
  const [sortField, setSortField] = useState<string>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const { data, isLoading } = useQuery({
    queryKey: ["trades", search, filterStrategy, filterOutcome],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("symbol", search)
      if (filterStrategy && filterStrategy !== "all") params.set("strategy", filterStrategy)
      if (filterOutcome && filterOutcome !== "all") params.set("outcome", filterOutcome)
      const res = await fetch(`/api/trades?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch trades")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      toast.success("Trade deleted")
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
    onError: () => toast.error("Failed to delete trade"),
  })

  const trades = data?.trades || []

  const sortedTrades = [...trades].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    }
    return sortDir === "asc"
      ? String(aVal || "").localeCompare(String(bVal || ""))
      : String(bVal || "").localeCompare(String(aVal || ""))
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const uniqueStrategies = [...new Set(trades.map((t: Record<string, unknown>) => t.strategy).filter(Boolean))] as string[]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Trade History</h3>
        <p className="text-muted-foreground text-sm">View and manage all your trades</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by symbol..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value.toUpperCase())}
              />
            </div>
            <Select value={filterStrategy} onValueChange={setFilterStrategy}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {uniqueStrategies.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAIL">Fail</SelectItem>
                <SelectItem value="BE">Breakeven</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>
                    <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("entryPrice")}>
                    <div className="flex items-center gap-1">Entry <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Exit</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("pnl")}>
                    <div className="flex items-center gap-1">P&L <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">R:R</TableHead>
                  <TableHead className="hidden sm:table-cell">Strategy</TableHead>
                  <TableHead className="hidden sm:table-cell">Outcome</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sortedTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No trades found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTrades.map((trade: Record<string, unknown>) => {
                    const pnl = trade.pnl as number
                    const pnlPercent = trade.pnlPercent as number
                    return (
                      <TableRow key={trade.id as string} className="hover:bg-muted/50">
                        <TableCell className="text-xs">
                          {new Date(trade.date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell className="font-medium">{trade.symbol as string}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={trade.direction === "LONG"
                              ? "border-emerald-500 text-emerald-500"
                              : "border-red-500 text-red-500"
                            }
                          >
                            {trade.direction === "LONG" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {trade.direction === "LONG" ? "CALL" : "PUT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden md:table-cell">₹{(trade.entryPrice as number).toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs hidden md:table-cell">{trade.exitPrice ? `₹${(trade.exitPrice as number).toFixed(2)}` : "-"}</TableCell>
                        <TableCell className={pnl > 0 ? "text-emerald-500 font-medium" : pnl < 0 ? "text-red-500 font-medium" : ""}>
                          ₹{pnl.toFixed(2)}
                          <span className="text-xs ml-1">({pnlPercent.toFixed(1)}%)</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden lg:table-cell">{(trade.rrRatio as number)?.toFixed(2) || "-"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">{(trade.strategy as string) || "-"}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            className={
                              (trade.outcome as string) === "SUCCESS" ? "bg-emerald-500/15 text-emerald-500" :
                              (trade.outcome as string) === "FAIL" ? "bg-red-500/15 text-red-500" :
                              (trade.outcome as string) === "BE" ? "bg-yellow-500/15 text-yellow-600" :
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {trade.outcome as string}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => setSelectedTrade(trade)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => {
                                setEditingTradeId(trade.id as string)
                                setCurrentView("add-trade")
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-red-500 hover:text-red-600"
                              onClick={() => deleteMutation.mutate(trade.id as string)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Trade Detail Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(selectedTrade?.symbol as string)} - {new Date(selectedTrade?.date as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <span className={`font-medium ml-1 ${(selectedTrade.direction as string) === "LONG" ? "text-emerald-500" : "text-red-500"}`}>{(selectedTrade.direction as string) === "LONG" ? "CALL" : "PUT"}</span></div>
                <div><span className="text-muted-foreground">Outcome:</span> <span className="font-medium ml-1">{selectedTrade.outcome as string}</span></div>
                <div><span className="text-muted-foreground">Entry:</span> <span className="font-mono ml-1">₹{(selectedTrade.entryPrice as number).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">Exit:</span> <span className="font-mono ml-1">{selectedTrade.exitPrice ? `₹${(selectedTrade.exitPrice as number).toFixed(2)}` : "-"}</span></div>
                <div><span className="text-muted-foreground">Lots:</span> <span className="font-mono ml-1">{selectedTrade.quantity as number}</span></div>
                <div><span className="text-muted-foreground">Strategy:</span> <span className="font-medium ml-1">{(selectedTrade.strategy as string) || "-"}</span></div>
                <div><span className="text-muted-foreground">Stop Loss:</span> <span className="font-mono ml-1">{selectedTrade.stopLoss ? `₹${(selectedTrade.stopLoss as number).toFixed(2)}` : "-"}</span></div>
                <div><span className="text-muted-foreground">Target:</span> <span className="font-mono ml-1">{selectedTrade.target ? `₹${(selectedTrade.target as number).toFixed(2)}` : "-"}</span></div>
                <div><span className="text-muted-foreground">P&L:</span> <span className={`font-mono ml-1 ${(selectedTrade.pnl as number) >= 0 ? "text-emerald-500" : "text-red-500"}`}>₹{(selectedTrade.pnl as number).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">R:R:</span> <span className="font-mono ml-1">{(selectedTrade.rrRatio as number)?.toFixed(2) || "-"}</span></div>
              </div>

              {selectedTrade.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes:</p>
                  <p className="text-sm mt-1">{selectedTrade.notes as string}</p>
                </div>
              )}

              {selectedTrade.psychology && (
                <div className="border-t pt-3">
                  <p className="font-medium text-sm mb-2">Psychology</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Confidence:</span> <span className="font-mono ml-1">{(selectedTrade.psychology as Record<string, unknown>).confidence as number}/10</span></div>
                    <div><span className="text-muted-foreground">Satisfaction:</span> <span className="font-mono ml-1">{(selectedTrade.psychology as Record<string, unknown>).satisfaction as number}/10</span></div>
                    <div><span className="text-muted-foreground">Emotion:</span> <span className="ml-1">{(selectedTrade.psychology as Record<string, unknown>).emotionalState as string}</span></div>
                    {(selectedTrade.psychology as Record<string, unknown>).mistakes && <div className="col-span-2"><span className="text-muted-foreground">Mistakes:</span> <span className="ml-1">{(selectedTrade.psychology as Record<string, unknown>).mistakes as string}</span></div>}
                    {(selectedTrade.psychology as Record<string, unknown>).lessonsLearned && <div className="col-span-2"><span className="text-muted-foreground">Lessons:</span> <span className="ml-1">{(selectedTrade.psychology as Record<string, unknown>).lessonsLearned as string}</span></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
