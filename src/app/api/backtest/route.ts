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

// GET /api/backtest - Get all backtest results
export async function GET() {
  try {
    const userId = await getDemoUserId()
    const results = await db.backtestResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error fetching backtest results:', error)
    return NextResponse.json({ error: 'Failed to fetch backtest results' }, { status: 500 })
  }
}

// POST /api/backtest - Run a backtest simulation
export async function POST(request: Request) {
  try {
    const userId = await getDemoUserId()
    const body = await request.json()

    const {
      name, symbol, startDate, endDate, strategy,
      entryCondition, exitCondition, stopLoss, takeProfit,
      initialCapital = 100000,
    } = body

    // Simulate backtest based on historical trade data
    const trades = await db.trade.findMany({
      where: {
        userId,
        symbol: symbol || undefined,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        strategy: strategy || undefined,
      },
      orderBy: { date: 'asc' },
    })

    // Simple simulation
    let capital = initialCapital
    let maxCapital = initialCapital
    let maxDrawdown = 0
    let wins = 0
    const equityCurve: { date: string; equity: number }[] = [{ date: startDate, equity: capital }]
    const tradeList: { date: string; pnl: number; type: string }[] = []

    trades.forEach((trade) => {
      const pnl = trade.pnl || 0
      capital += pnl

      if (pnl > 0) wins++
      if (capital > maxCapital) maxCapital = capital
      const drawdown = ((maxCapital - capital) / maxCapital) * 100
      if (drawdown > maxDrawdown) maxDrawdown = drawdown

      equityCurve.push({
        date: trade.date.toISOString().split('T')[0],
        equity: Math.round(capital * 100) / 100,
      })

      tradeList.push({
        date: trade.date.toISOString().split('T')[0],
        pnl: Math.round(pnl * 100) / 100,
        type: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE',
      })
    })

    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0
    const profitFactor = trades.length > 0
      ? Math.abs(trades.filter(t => (t.pnl || 0) > 0).reduce((s, t) => s + (t.pnl || 0), 0)) /
        Math.max(Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0)), 1)
      : 0

    const result = await db.backtestResult.create({
      data: {
        userId,
        name: name || `${strategy || 'Custom'} Backtest`,
        symbol: symbol || 'ALL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        strategy: strategy || 'Custom',
        entryCondition: entryCondition || '',
        exitCondition: exitCondition || '',
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        initialCapital,
        finalCapital: Math.round(capital * 100) / 100,
        totalTrades: trades.length,
        winRate: Math.round(winRate * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        equityCurve: JSON.stringify(equityCurve),
        tradeList: JSON.stringify(tradeList),
      },
    })

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error running backtest:', error)
    return NextResponse.json({ error: 'Failed to run backtest' }, { status: 500 })
  }
}
