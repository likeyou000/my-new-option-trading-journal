import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEMO_USER_ID = 'demo-user-id'

// Helper to get or create demo user
async function getDemoUserId() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: { email: 'demo@tradediary.ai', name: 'Demo Trader' },
    })
  }
  return user.id
}

// GET /api/trades - Get all trades
export async function GET(request: Request) {
  try {
    const userId = await getDemoUserId()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const symbol = searchParams.get('symbol')
    const strategy = searchParams.get('strategy')
    const outcome = searchParams.get('outcome')
    const direction = searchParams.get('direction')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { userId }

    if (symbol) where.symbol = symbol
    if (strategy) where.strategy = strategy
    if (outcome) where.outcome = outcome
    if (direction) where.direction = direction
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const trades = await db.trade.findMany({
      where,
      include: { psychology: true },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.trade.count({ where })

    return NextResponse.json({ trades, total })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: Request) {
  try {
    const userId = await getDemoUserId()
    const body = await request.json()

    const {
      symbol, date, entryPrice, exitPrice, quantity, direction,
      stopLoss, target, strategy, outcome, notes,
      confidence, satisfaction, emotionalState, mistakes, lessonsLearned,
    } = body

    // Calculate P&L
    let pnl = 0
    let pnlPercent = 0
    if (exitPrice && entryPrice) {
      if (direction === 'LONG') {
        pnl = (exitPrice - entryPrice) * quantity
        pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100
      } else {
        pnl = (entryPrice - exitPrice) * quantity
        pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100
      }
    }

    // Calculate R:R ratio
    let rrRatio = 0
    if (stopLoss && target && entryPrice) {
      const risk = Math.abs(entryPrice - stopLoss)
      const reward = Math.abs(target - entryPrice)
      rrRatio = risk > 0 ? reward / risk : 0
    }

    const trade = await db.trade.create({
      data: {
        userId,
        symbol,
        date: new Date(date),
        entryPrice: parseFloat(entryPrice),
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        quantity: parseInt(quantity),
        direction: direction || 'LONG',
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        target: target ? parseFloat(target) : null,
        strategy: strategy || null,
        outcome: outcome || 'PENDING',
        notes: notes || null,
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        rrRatio: Math.round(rrRatio * 100) / 100,
        psychology: confidence ? {
          create: {
            confidence: parseInt(confidence) || 5,
            satisfaction: parseInt(satisfaction) || 5,
            emotionalState: emotionalState || 'Calm',
            mistakes: mistakes || null,
            lessonsLearned: lessonsLearned || null,
          },
        } : undefined,
      },
      include: { psychology: true },
    })

    return NextResponse.json({ trade }, { status: 201 })
  } catch (error) {
    console.error('Error creating trade:', error)
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 })
  }
}
