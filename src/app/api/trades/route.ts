import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { calculateQuantity, calculatePnl, calculatePnlPercent, calculateCharges, calculateRR, detectOutcome } from '@/lib/options'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

// GET /api/trades - Get all trades for authenticated user
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const symbol = searchParams.get('symbol')
    const strategy = searchParams.get('strategy')
    const outcome = searchParams.get('outcome')
    const optionType = searchParams.get('optionType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { userId }

    if (symbol) where.symbol = symbol
    if (strategy) where.strategy = strategy
    if (outcome) where.outcome = outcome
    if (optionType) where.optionType = optionType
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
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in our DB
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `user-${userId}@tradediary.ai`,
        name: 'Trader',
      },
    })

    const body = await request.json()

    const {
      symbol, optionType, strikePrice, expiryDate, tradeType, lots,
      entryPrice, exitPrice, stopLoss, target, strategy, outcome, notes, date,
      confidence, satisfaction, emotionalState, mistakes, lessonsLearned,
    } = body

    const ep = parseFloat(entryPrice)
    const xp = exitPrice ? parseFloat(exitPrice) : null
    const sl = stopLoss ? parseFloat(stopLoss) : null
    const tgt = target ? parseFloat(target) : null
    const numLots = parseInt(lots)
    const numStrike = parseInt(strikePrice)
    const tradeTypeVal = tradeType || 'BUY'

    // Calculate with lot size logic
    const quantity = calculateQuantity(symbol, numLots)
    let pnl = 0
    let pnlPercent = 0
    let brokerage = 0
    let netPnl = 0

    if (xp && ep) {
      pnl = calculatePnl(tradeTypeVal, ep, xp, quantity)
      pnlPercent = calculatePnlPercent(tradeTypeVal, ep, xp, quantity)
      brokerage = calculateCharges(tradeTypeVal, ep, xp, quantity, pnl)
      netPnl = pnl - brokerage
    }

    // Calculate R:R ratio
    let rrRatio = 0
    if (sl && tgt && ep) {
      rrRatio = calculateRR(ep, sl, tgt)
    }

    // Auto-detect outcome if exit price provided
    const finalOutcome = xp ? detectOutcome(pnl) : (outcome || 'PENDING')

    const trade = await db.trade.create({
      data: {
        userId,
        symbol,
        optionType: optionType || 'PE',
        strikePrice: numStrike,
        expiryDate: new Date(expiryDate),
        tradeType: tradeTypeVal,
        lots: numLots,
        quantity,
        date: new Date(date),
        entryPrice: ep,
        exitPrice: xp,
        stopLoss: sl,
        target: tgt,
        strategy: strategy || null,
        outcome: finalOutcome,
        notes: notes || null,
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        brokerage: Math.round(brokerage * 100) / 100,
        netPnl: Math.round(netPnl * 100) / 100,
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
