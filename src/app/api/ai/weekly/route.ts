import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

// POST /api/ai/weekly - Generate weekly AI report
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { days = 7 } = body

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const trades = await db.trade.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      include: { psychology: true },
      orderBy: { date: 'desc' },
    })

    const allTrades = await db.trade.findMany({
      where: { userId },
      include: { psychology: true },
    })

    const totalPnl = trades.reduce((s, t) => s + (t.netPnl || t.pnl || 0), 0)
    const totalBrokerage = trades.reduce((s, t) => s + (t.brokerage || 0), 0)
    const wins = trades.filter(t => (t.pnl || 0) > 0).length
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0

    // CE vs PE breakdown
    const ceTrades = trades.filter(t => t.optionType === 'CE')
    const peTrades = trades.filter(t => t.optionType === 'PE')

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert Indian options trading performance coach. The trader trades options (CE=Call, PE=Put) on NIFTY (lot: 50), BANKNIFTY (lot: 15), and FINNIFTY (lot: 40).

Key terms:
- optionType: CE = Call Option, PE = Put Option
- tradeType: BUY = Option Buying, SELL = Option Writing
- lots: Number of lots
- entryPrice/exitPrice: Premium prices
- strikePrice: Option strike
- netPnl: Net P&L after brokerage charges
- brokerage: Total estimated charges

Generate a comprehensive weekly trading report.
Use markdown formatting with headers, bullet points, and emojis.

Structure:
## 📈 Weekly Performance Summary
Overall numbers, net P&L after charges, CE vs PE breakdown.

## 🏆 Key Wins This Week
Highlight the best option trades and what went right.

## ⚠️ Key Mistakes This Week
Identify recurring mistakes and patterns.

## 💰 Charges Impact
Analyze how brokerage/charges affected net returns.

## 📋 Improvement Plan
Specific, actionable steps for next week.

## 🎯 Next Week's Focus
Top 3 priorities to work on.`
        },
        {
          role: 'user',
          content: `Generate a weekly options trading report.

Period: Last ${days} days
Total Trades: ${trades.length}
Win Rate: ${winRate.toFixed(1)}%
Gross P&L: ₹${trades.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2)}
Total Charges: ₹${totalBrokerage.toFixed(2)}
Net P&L: ₹${totalPnl.toFixed(2)}

CE Trades: ${ceTrades.length} (P&L: ₹${ceTrades.reduce((s, t) => s + (t.netPnl || t.pnl || 0), 0).toFixed(2)})
PE Trades: ${peTrades.length} (P&L: ₹${peTrades.reduce((s, t) => s + (t.netPnl || t.pnl || 0), 0).toFixed(2)})

Recent Trades:
${JSON.stringify(trades.slice(0, 20), null, 2)}

All-time stats for context:
Total all-time trades: ${allTrades.length}
All-time Net P&L: ₹${allTrades.reduce((s, t) => s + (t.netPnl || t.pnl || 0), 0).toFixed(2)}
All-time win rate: ${allTrades.length > 0 ? ((allTrades.filter(t => (t.pnl || 0) > 0).length / allTrades.length) * 100).toFixed(1) : 0}%`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const report = completion.choices[0]?.message?.content

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error generating weekly report:', error)
    return NextResponse.json({ error: 'Failed to generate weekly report' }, { status: 500 })
  }
}
