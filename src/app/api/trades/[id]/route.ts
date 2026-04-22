import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/trades/[id] - Get a specific trade
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trade = await db.trade.findUnique({
      where: { id },
      include: { psychology: true },
    })

    if (!trade) {
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
    const { id } = await params
    const body = await request.json()

    const {
      symbol, date, entryPrice, exitPrice, quantity, direction,
      stopLoss, target, strategy, outcome, notes,
      confidence, satisfaction, emotionalState, mistakes, lessonsLearned,
    } = body

    // Calculate P&L
    let pnl = 0
    let pnlPercent = 0
    const ep = parseFloat(entryPrice)
    const xp = exitPrice ? parseFloat(exitPrice) : null
    const qty = parseInt(quantity)

    if (xp && ep) {
      if (direction === 'LONG') {
        pnl = (xp - ep) * qty
        pnlPercent = ((xp - ep) / ep) * 100
      } else {
        pnl = (ep - xp) * qty
        pnlPercent = ((ep - xp) / ep) * 100
      }
    }

    let rrRatio = 0
    if (stopLoss && target && ep) {
      const risk = Math.abs(ep - parseFloat(stopLoss))
      const reward = Math.abs(parseFloat(target) - ep)
      rrRatio = risk > 0 ? reward / risk : 0
    }

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
        date: new Date(date),
        entryPrice: ep,
        exitPrice: xp,
        quantity: qty,
        direction,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        target: target ? parseFloat(target) : null,
        strategy: strategy || null,
        outcome: outcome || 'PENDING',
        notes: notes || null,
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
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
    const { id } = await params

    // Psychology will be cascade deleted
    await db.trade.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trade:', error)
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 })
  }
}
