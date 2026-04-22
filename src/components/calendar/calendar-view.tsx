"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const calendarData = useMemo(() => {
    const dailyMap = new Map<string, { pnl: number; count: number }>()
    ;(data?.dailyPnl || []).forEach((d: { date: string; pnl: number; count: number }) => {
      dailyMap.set(d.date, { pnl: d.pnl, count: d.count })
    })

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const monthName = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

    let monthlyTotal = 0
    let monthlyTradeCount = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayData = dailyMap.get(dateKey)
      if (dayData) {
        monthlyTotal += dayData.pnl
        monthlyTradeCount += dayData.count
      }
    }

    return {
      dailyMap,
      year,
      month,
      daysInMonth,
      firstDayOfMonth,
      monthName,
      monthlyPnl: { total: Math.round(monthlyTotal * 100) / 100, tradeCount: monthlyTradeCount },
    }
  }, [data, currentDate])

  const { dailyMap, year, month, daysInMonth, firstDayOfMonth, monthName, monthlyPnl } = calendarData

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const dayNamesFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayNamesShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Calendar View</h3>
        <p className="text-muted-foreground text-sm">Daily net P&L overview on a calendar</p>
      </div>

      {/* Monthly Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Net P&L</p>
            <p className={`text-lg sm:text-xl font-bold ${monthlyPnl.total >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              ₹{monthlyPnl.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="text-lg sm:text-xl font-bold">{monthlyPnl.tradeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Daily P&L</p>
            <p className={`text-lg sm:text-xl font-bold ${monthlyPnl.total / Math.max(monthlyPnl.tradeCount, 1) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              ₹{(monthlyPnl.tradeCount > 0 ? monthlyPnl.total / monthlyPnl.tradeCount : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{monthName}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNamesFull.map((day, i) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                <span className="sm:hidden">{dayNamesShort[i]}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 sm:h-20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayData = dailyMap.get(dateKey)
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

              return (
                <div
                  key={day}
                  className={cn(
                    "h-14 sm:h-20 rounded-lg border p-1 sm:p-2 transition-colors",
                    isToday && "ring-2 ring-emerald-500",
                    dayData
                      ? dayData.pnl >= 0
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                      : "border-border/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium",
                      isToday ? "text-emerald-500" : "text-foreground"
                    )}>
                      {day}
                    </span>
                    {dayData && (
                      <Badge variant="outline" className="text-[8px] sm:text-[10px] h-3 sm:h-4 px-0.5 sm:px-1">
                        {dayData.count}T
                      </Badge>
                    )}
                  </div>
                  {dayData && (
                    <p className={cn(
                      "text-[10px] sm:text-xs font-bold mt-0.5 sm:mt-1",
                      dayData.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      ₹{dayData.pnl.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
