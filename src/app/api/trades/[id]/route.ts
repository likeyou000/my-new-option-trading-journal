import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { calculateQuantity, calculatePnl, calculatePnlPercent, calculateCharges, calculateRR, detectOutcome } from '@/lib/options'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

// GET /api/trades/[id] - Get a specific trade
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const trade = await db.trade.findUnique({
      where: { id },
      include: { psychology: true },
    })

    if (!trade || trade.userId !== userId) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    return NextResponse.json({ trade })
  } catch (error) {
    console.error('Error fetching trade:', error)
    return NextResponse.json({ error: 'Failed to fetch trade' }, { status: 500 })
  }
}

// PUT /api/trades/[id] - Update a trade
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await db.trade.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

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

    // Update or create psychology data
    const existingPsychology = await db.psychology.findUnique({
      where: { tradeId: id },
    })

    if (confidence || existingPsychology) {
      if (existingPsychology) {
        await db.psychology.update({
          where: { tradeId: id },
          data: {
            confidence: confidence ? parseInt(confidence) : undefined,
            satisfaction: satisfaction ? parseInt(satisfaction) : undefined,
            emotionalState: emotionalState || undefined,
            mistakes: mistakes !== undefined ? mistakes : undefined,
            lessonsLearned: lessonsLearned !== undefined ? lessonsLearned : undefined,
          },
        })
      } else if (confidence) {
        await db.psychology.create({
          data: {
            tradeId: id,
            confidence: parseInt(confidence) || 5,
            satisfaction: parseInt(satisfaction) || 5,
            emotionalState: emotionalState || 'Calm',
            mistakes: mistakes || null,
            lessonsLearned: lessonsLearned || null,
          },
        })
      }
    }

    const trade = await db.trade.update({
      where: { id },
      data: {
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
      },
      include: { psychology: true },
    })

    return NextResponse.json({ trade })
  } catch (error) {
    console.error('Error updating trade:', error)
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
  }
}

// DELETE /api/trades/[id] - Delete a trade
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await db.trade.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    await db.trade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 })
  }
}
