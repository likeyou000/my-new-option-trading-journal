"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Activity, TrendingUp, TrendingDown, ArrowUpDown, RefreshCw, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const WATCHLIST = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC', 'WIPRO', 'HCLTECH', 'AXISBANK', 'KOTAKBANK', 'LT', 'MARUTI', 'TATAMOTORS', 'TATASTEEL', 'SUNPHARMA']

interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  dayHigh: number
  dayLow: number
  prevClose: number
}

interface OptionStrike {
  strikePrice: number
  call: { oi: number; changeInOI: number; volume: number; iv: number; ltp: number; change: number; bidQty: number; bidPrice: number; askQty: number; askPrice: number }
  put: { oi: number; changeInOI: number; volume: number; iv: number; ltp: number; change: number; bidQty: number; bidPrice: number; askQty: number; askPrice: number }
}

export function LiveMarket() {
  const [optionSymbol, setOptionSymbol] = useState("NIFTY")
  const [selectedExpiry, setSelectedExpiry] = useState<string>("")

  const { data: quotesData, isLoading: quotesLoading, refetch: refetchQuotes, isFetching } = useQuery({
    queryKey: ["market-quotes"],
    queryFn: async () => {
      const res = await fetch(`/api/market/quotes?symbols=${WATCHLIST.join(',')}`)
      if (!res.ok) throw new Error("Failed to fetch quotes")
      return res.json()
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  const { data: optionData, isLoading: optionLoading, refetch: refetchOptions } = useQuery({
    queryKey: ["option-chain", optionSymbol, selectedExpiry],
    queryFn: async () => {
      const params = new URLSearchParams({ symbol: optionSymbol })
      if (selectedExpiry) params.set('expiry', selectedExpiry)
      const res = await fetch(`/api/market/option-chain?${params}`)
      if (!res.ok) throw new Error("Failed to fetch option chain")
      return res.json()
    },
    refetchInterval: 60000,
  })

  const quotes: Quote[] = quotesData?.quotes || []
  const strikes: OptionStrike[] = optionData?.strikes || []
  const expiryDates: string[] = optionData?.expiryDates || []
  const underlyingValue = optionData?.underlyingValue || 0
  const maxPain = optionData?.maxPain || 0
  const pcr = optionData?.pcr || 0

  const formatNum = (n: number) => n.toLocaleString('en-IN')
  const formatOI = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-emerald-500" />
            Live Market
          </h3>
          <p className="text-muted-foreground text-sm">
            Real-time Indian stock market data & option chain
            {quotesData?.source === 'simulated' && (
              <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/50 text-[10px]">Simulated</Badge>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchQuotes(); refetchOptions() }}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="watchlist" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="option-chain">Option Chain</TabsTrigger>
        </TabsList>

        {/* Watchlist */}
        <TabsContent value="watchlist" className="space-y-4">
          {/* Index Cards */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {quotes.filter(q => q.symbol === 'NIFTY' || q.symbol === 'BANKNIFTY').map(quote => (
              <Card key={quote.symbol} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{quote.name}</p>
                      <p className="text-2xl font-bold">₹{formatNum(quote.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-bold", quote.change >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)}
                      </p>
                      <Badge className={cn("text-xs", quote.changePercent >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500")}>
                        {quote.changePercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>H: ₹{formatNum(quote.dayHigh)}</span>
                    <span>L: ₹{formatNum(quote.dayLow)}</span>
                    <span>V: {formatNum(quote.volume)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stock Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Stock Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">LTP</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Chg %</TableHead>
                      <TableHead className="text-right hidden md:table-cell">High</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Low</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotesLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-16" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      quotes.filter(q => q.symbol !== 'NIFTY' && q.symbol !== 'BANKNIFTY' && q.symbol !== 'NSEI').map(quote => (
                        <TableRow key={quote.symbol} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{quote.symbol}</p>
                              <p className="text-[10px] text-muted-foreground hidden sm:block">{quote.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">₹{formatNum(quote.price)}</TableCell>
                          <TableCell className={cn("text-right font-mono text-sm", quote.change >= 0 ? "text-emerald-500" : "text-red-500")}>
                            {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)}
                          </TableCell>
                          <TableCell className={cn("text-right hidden sm:table-cell", quote.changePercent >= 0 ? "text-emerald-500" : "text-red-500")}>
                            <Badge variant="outline" className={cn("text-[10px]", quote.changePercent >= 0 ? "border-emerald-500/50 text-emerald-500" : "border-red-500/50 text-red-500")}>
                              {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs hidden md:table-cell">₹{formatNum(quote.dayHigh)}</TableCell>
                          <TableCell className="text-right font-mono text-xs hidden md:table-cell">₹{formatNum(quote.dayLow)}</TableCell>
                          <TableCell className="text-right text-xs hidden lg:table-cell">{formatNum(quote.volume)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Option Chain */}
        <TabsContent value="option-chain" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Select value={optionSymbol} onValueChange={setOptionSymbol}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIFTY">NIFTY</SelectItem>
                    <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                  </SelectContent>
                </Select>
                
                {expiryDates.length > 0 && (
                  <Select value={selectedExpiry || expiryDates[0] || ''} onValueChange={setSelectedExpiry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      {expiryDates.map(d => (
                        <SelectItem key={d} value={d}>
                          {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex gap-4 ml-auto">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Underlying</p>
                    <p className="text-sm font-bold">₹{formatNum(underlyingValue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Max Pain</p>
                    <p className="text-sm font-bold text-amber-500">₹{formatNum(maxPain)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">PCR</p>
                    <p className={cn("text-sm font-bold", pcr > 1 ? "text-emerald-500" : "text-red-500")}>{pcr.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option Chain Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]" colSpan={4}>CALLS</TableHead>
                      <TableHead className="text-center bg-muted/80 text-[10px]">
                        <ArrowUpDown className="h-3 w-3 inline" /> Strike
                      </TableHead>
                      <TableHead className="text-center bg-red-500/10 text-red-600 dark:text-red-400 text-[10px]" colSpan={4}>PUTS</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-[10px] text-center bg-emerald-500/5">OI</TableHead>
                      <TableHead className="text-[10px] text-center bg-emerald-500/5">Chg OI</TableHead>
                      <TableHead className="text-[10px] text-center bg-emerald-500/5">Vol</TableHead>
                      <TableHead className="text-[10px] text-center bg-emerald-500/5">LTP</TableHead>
                      <TableHead className="text-[10px] text-center bg-muted/50 font-bold">₹</TableHead>
                      <TableHead className="text-[10px] text-center bg-red-500/5">LTP</TableHead>
                      <TableHead className="text-[10px] text-center bg-red-500/5">Vol</TableHead>
                      <TableHead className="text-[10px] text-center bg-red-500/5">Chg OI</TableHead>
                      <TableHead className="text-[10px] text-center bg-red-500/5">OI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optionLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-12 mx-auto" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      strikes.map((strike) => {
                        const isATM = Math.abs(strike.strikePrice - underlyingValue) < (optionSymbol === 'BANKNIFTY' ? 100 : 50)
                        const isITMCall = strike.strikePrice < underlyingValue
                        const isITMPut = strike.strikePrice > underlyingValue
                        
                        return (
                          <TableRow
                            key={strike.strikePrice}
                            className={cn(
                              "hover:bg-muted/50 text-xs",
                              isATM && "bg-amber-500/10 font-bold"
                            )}
                          >
                            {/* CALL Side */}
                            <TableCell className={cn("text-center font-mono", isITMCall && "bg-emerald-500/5")}>{formatOI(strike.call.oi)}</TableCell>
                            <TableCell className={cn("text-center font-mono", isITMCall && "bg-emerald-500/5", strike.call.changeInOI >= 0 ? "text-emerald-500" : "text-red-500")}>{strike.call.changeInOI >= 0 ? '+' : ''}{formatOI(Math.abs(strike.call.changeInOI))}</TableCell>
                            <TableCell className={cn("text-center font-mono", isITMCall && "bg-emerald-500/5")}>{formatOI(strike.call.volume)}</TableCell>
                            <TableCell className={cn("text-center font-mono", isITMCall && "bg-emerald-500/5", strike.call.change >= 0 ? "text-emerald-500" : "text-red-500")}>{strike.call.ltp.toFixed(1)}</TableCell>
                            
                            {/* Strike */}
                            <TableCell className={cn("text-center font-bold font-mono bg-muted/30", isATM && "bg-amber-500/20")}>
                              {formatNum(strike.strikePrice)}
                            </TableCell>
                            
                            {/* PUT Side */}
                            <TableCell className={cn("text-center font-mono", isITMPut && "bg-red-500/5", strike.put.change >= 0 ? "text-emerald-500" : "text-red-500")}>{strike.put.ltp.toFixed(1)}</TableCell>
                            <TableCell className={cn("text-center font-mono", isITMPut && "bg-red-500/5")}>{formatOI(strike.put.volume)}</TableCell>
                            <TableCell className={cn("text-center font-mono", isITMPut && "bg-red-500/5", strike.put.changeInOI >= 0 ? "text-emerald-500" : "text-red-500")}>{strike.put.changeInOI >= 0 ? '+' : ''}{formatOI(Math.abs(strike.put.changeInOI))}</TableCell>
                            <TableCell className={cn("text-center font-mono", isITMPut && "bg-red-500/5")}>{formatOI(strike.put.oi)}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
