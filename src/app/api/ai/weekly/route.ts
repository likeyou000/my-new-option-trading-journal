import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

async function getDemoUserId() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: { email: 'demo@tradediary.ai', name: 'Demo Trader' },
    })
  }
  return user.id
}

// POST /api/ai/weekly - Generate weekly AI report
export async function POST(request: Request) {
  try {
    const userId = await getDemoUserId()
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

    // Get overall stats for context
    const allTrades = await db.trade.findMany({
      where: { userId },
      include: { psychology: true },
    })

    const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)
    const wins = trades.filter(t => (t.pnl || 0) > 0).length
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert trading performance coach. Generate a comprehensive weekly trading report based on the provided data.
Use markdown formatting with headers, bullet points, and emojis where appropriate.

Structure the report as:
## 📈 Weekly Performance Summary
Overall numbers and key metrics.

## 🏆 Key Wins This Week
Highlight the best trades and what went right.

## ⚠️ Key Mistakes This Week
Identify recurring mistakes and patterns.

## 📋 Improvement Plan
Specific, actionable steps for next week.

## 🎯 Next Week's Focus
Top 3 priorities to work on.`
        },
        {
          role: 'user',
          content: `Generate a weekly trading report.

Period: Last ${days} days
Total Trades: ${trades.length}
Win Rate: ${winRate.toFixed(1)}%
Total P&L: ₹${totalPnl.toFixed(2)}

Recent Trades:
${JSON.stringify(trades.slice(0, 20), null, 2)}

All-time stats for context:
Total all-time trades: ${allTrades.length}
All-time P&L: ₹${allTrades.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2)}
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
