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

// POST /api/ai/strategy - AI strategy feedback
export async function POST() {
  try {
    const userId = await getDemoUserId()

    const trades = await db.trade.findMany({
      where: { userId },
      include: { psychology: true },
      orderBy: { date: 'desc' },
    })

    // Group by strategy
    const strategyMap = new Map<string, typeof trades>()
    trades.forEach(t => {
      const strat = t.strategy || 'Other'
      if (!strategyMap.has(strat)) strategyMap.set(strat, [])
      strategyMap.get(strat)!.push(t)
    })

    const strategyStats = Array.from(strategyMap.entries()).map(([name, stratTrades]) => {
      const pnl = stratTrades.reduce((s, t) => s + (t.pnl || 0), 0)
      const wins = stratTrades.filter(t => (t.pnl || 0) > 0).length
      return {
        name,
        trades: stratTrades.length,
        pnl: Math.round(pnl * 100) / 100,
        winRate: stratTrades.length > 0 ? Math.round((wins / stratTrades.length) * 10000) / 100 : 0,
        avgPnl: stratTrades.length > 0 ? Math.round((pnl / stratTrades.length) * 100) / 100 : 0,
      }
    })

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert trading strategy analyst. Analyze the trader's strategy performance data and provide actionable insights.
Use markdown formatting with headers, bullet points, and emojis.

Structure your response as:
## 🏆 Best Performing Setups
Identify and explain which strategies work best and why.

## ⚠️ Underperforming Strategies
Identify which strategies need improvement.

## 🔧 Optimization Suggestions
Specific suggestions to optimize each strategy.

## 📊 Strategy Rankings
Rank strategies from best to worst with reasoning.

## 🎯 Recommended Focus
Which strategy to focus on and which to reconsider.`
        },
        {
          role: 'user',
          content: `Analyze my trading strategy performance and suggest optimizations.

Strategy Performance Data:
${JSON.stringify(strategyStats, null, 2)}

Total trades: ${trades.length}
Overall P&L: ₹${trades.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2)}

Please identify best-performing setups and suggest optimizations.`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const feedback = completion.choices[0]?.message?.content

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error generating strategy feedback:', error)
    return NextResponse.json({ error: 'Failed to generate strategy feedback' }, { status: 500 })
  }
}
