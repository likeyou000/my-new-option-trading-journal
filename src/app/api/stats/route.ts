import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

async function getDemoUserId() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: { email: 'demo@tradediary.ai', name: 'Demo Trader' },
    })
  }
  return user.id
}

// GET /api/stats - Get dashboard stats
export async function GET() {
  try {
    const userId = await getDemoUserId()

    const trades = await db.trade.findMany({
      where: { userId },
      include: { psychology: true },
      orderBy: { date: 'asc' },
    })

    if (trades.length === 0) {
      return NextResponse.json({
        totalPnl: 0,
        netPnl: 0,
        winRate: 0,
        avgRR: 0,
        totalTrades: 0,
        confidenceIndex: 0,
        cumulativePnl: [],
        winLossData: { wins: 0, losses: 0, breakeven: 0 },
        strategyPerformance: [],
        dailyPnl: [],
        optionTypePerformance: [],
        cePeBreakdown: { ce: { count: 0, pnl: 0, winRate: 0 }, pe: { count: 0, pnl: 0, winRate: 0 } },
      })
    }

    // Core stats - use netPnl for accurate P&L
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const totalNetPnl = trades.reduce((sum, t) => sum + (t.netPnl || t.pnl || 0), 0)
    const totalBrokerage = trades.reduce((sum, t) => sum + (t.brokerage || 0), 0)
    const wins = trades.filter(t => (t.pnl || 0) > 0).length
    const losses = trades.filter(t => (t.pnl || 0) < 0).length
    const breakeven = trades.filter(t => (t.pnl || 0) === 0).length
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0

    // Average R:R
    const tradesWithRR = trades.filter(t => t.rrRatio && t.rrRatio > 0)
    const avgRR = tradesWithRR.length > 0
      ? tradesWithRR.reduce((sum, t) => sum + (t.rrRatio || 0), 0) / tradesWithRR.length
      : 0

    // Confidence index
    const psychTrades = trades.filter(t => t.psychology)
    const confidenceIndex = psychTrades.length > 0
      ? psychTrades.reduce((sum, t) => sum + (t.psychology?.confidence || 0), 0) / psychTrades.length * 10
      : 50

    // Cumulative P&L data (using netPnl)
    let cumPnl = 0
    const cumulativePnl = trades.map(t => {
      cumPnl += t.netPnl || t.pnl || 0
      return {
        date: t.date.toISOString().split('T')[0],
        pnl: Math.round(cumPnl * 100) / 100,
      }
    })

    // Win/Loss donut data
    const winLossData = { wins, losses, breakeven }

    // Strategy performance
    const strategyMap = new Map<string, { pnl: number; count: number; wins: number }>()
    trades.forEach(t => {
      const strat = t.strategy || 'Other'
      const existing = strategyMap.get(strat) || { pnl: 0, count: 0, wins: 0 }
      existing.pnl += t.netPnl || t.pnl || 0
      existing.count += 1
      if ((t.pnl || 0) > 0) existing.wins += 1
      strategyMap.set(strat, existing)
    })
    const strategyPerformance = Array.from(strategyMap.entries()).map(([name, data]) => ({
      name,
      pnl: Math.round(data.pnl * 100) / 100,
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100 * 100) / 100,
    }))

    // Daily P&L
    const dailyMap = new Map<string, { pnl: number; count: number }>()
    trades.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { pnl: 0, count: 0 }
      existing.pnl += t.netPnl || t.pnl || 0
      existing.count += 1
      dailyMap.set(dateKey, existing)
    })
    const dailyPnl = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        pnl: Math.round(data.pnl * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Symbol performance
    const symbolMap = new Map<string, { pnl: number; count: number; wins: number }>()
    trades.forEach(t => {
      const existing = symbolMap.get(t.symbol) || { pnl: 0, count: 0, wins: 0 }
      existing.pnl += t.netPnl || t.pnl || 0
      existing.count += 1
      if ((t.pnl || 0) > 0) existing.wins += 1
      symbolMap.set(t.symbol, existing)
    })
    const symbolPerformance = Array.from(symbolMap.entries()).map(([name, data]) => ({
      name,
      pnl: Math.round(data.pnl * 100) / 100,
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100 * 100) / 100,
    }))

    // Option Type (CE/PE) performance
    const optionTypeMap = new Map<string, { pnl: number; count: number; wins: number }>()
    trades.forEach(t => {
      const ot = t.optionType || 'CE'
      const existing = optionTypeMap.get(ot) || { pnl: 0, count: 0, wins: 0 }
      existing.pnl += t.netPnl || t.pnl || 0
      existing.count += 1
      if ((t.pnl || 0) > 0) existing.wins += 1
      optionTypeMap.set(ot, existing)
    })
    const optionTypePerformance = Array.from(optionTypeMap.entries()).map(([name, data]) => ({
      name,
      pnl: Math.round(data.pnl * 100) / 100,
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100 * 100) / 100,
    }))

    // CE/PE Breakdown
    const ceData = optionTypeMap.get('CE') || { pnl: 0, count: 0, wins: 0 }
    const peData = optionTypeMap.get('PE') || { pnl: 0, count: 0, wins: 0 }
    const cePeBreakdown = {
      ce: {
        count: ceData.count,
        pnl: Math.round(ceData.pnl * 100) / 100,
        winRate: ceData.count > 0 ? Math.round((ceData.wins / ceData.count) * 100 * 100) / 100 : 0,
      },
      pe: {
        count: peData.count,
        pnl: Math.round(peData.pnl * 100) / 100,
        winRate: peData.count > 0 ? Math.round((peData.wins / peData.count) * 100 * 100) / 100 : 0,
      },
    }

    // Weekday performance
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weekdayMap = new Map<string, { pnl: number; count: number; wins: number }>()
    trades.forEach(t => {
      const dayName = weekdayNames[t.date.getDay()]
      const existing = weekdayMap.get(dayName) || { pnl: 0, count: 0, wins: 0 }
      existing.pnl += t.netPnl || t.pnl || 0
      existing.count += 1
      if ((t.pnl || 0) > 0) existing.wins += 1
      weekdayMap.set(dayName, existing)
    })
    const weekdayPerformance = weekdayNames
      .filter(d => weekdayMap.has(d))
      .map(name => {
        const data = weekdayMap.get(name)!
        return {
          name,
          pnl: Math.round(data.pnl * 100) / 100,
          count: data.count,
          winRate: Math.round((data.wins / data.count) * 100 * 100) / 100,
        }
      })

    // Emotional state analysis
    const emotionMap = new Map<string, { pnl: number; count: number; wins: number }>()
    trades.forEach(t => {
      if (t.psychology) {
        const emotion = t.psychology.emotionalState
        const existing = emotionMap.get(emotion) || { pnl: 0, count: 0, wins: 0 }
        existing.pnl += t.netPnl || t.pnl || 0
        existing.count += 1
        if ((t.pnl || 0) > 0) existing.wins += 1
        emotionMap.set(emotion, existing)
      }
    })
    const emotionalAnalysis = Array.from(emotionMap.entries()).map(([name, data]) => ({
      name,
      pnl: Math.round(data.pnl * 100) / 100,
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100 * 100) / 100,
    }))

    // Advanced metrics
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0)
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0)
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((s, t) => s + (t.netPnl || t.pnl || 0), 0) / winningTrades.length
      : 0
    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((s, t) => s + (t.netPnl || t.pnl || 0), 0) / losingTrades.length
      : 0
    const winLossRatio = wins > 0 && losses > 0 ? wins / losses : 0
    const expectancy = trades.length > 0
      ? (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss
      : 0

    // Best and worst day
    const bestDay = dailyPnl.reduce((best, d) => d.pnl > best.pnl ? d : best, dailyPnl[0])
    const worstDay = dailyPnl.reduce((worst, d) => d.pnl < worst.pnl ? d : worst, dailyPnl[0])

    return NextResponse.json({
      totalPnl: Math.round(totalPnl * 100) / 100,
      netPnl: Math.round(totalNetPnl * 100) / 100,
      totalBrokerage: Math.round(totalBrokerage * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      avgRR: Math.round(avgRR * 100) / 100,
      totalTrades: trades.length,
      confidenceIndex: Math.round(confidenceIndex * 100) / 100,
      cumulativePnl,
      winLossData,
      strategyPerformance,
      dailyPnl,
      symbolPerformance,
      weekdayPerformance,
      emotionalAnalysis,
      optionTypePerformance,
      cePeBreakdown,
      advanced: {
        winLossRatio: Math.round(winLossRatio * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        expectancy: Math.round(expectancy * 100) / 100,
        bestDay,
        worstDay,
        totalWins: wins,
        totalLosses: losses,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
