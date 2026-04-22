import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { LOT_SIZES } from '@/lib/options'

async function getDemoUserId() {
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: { email: 'demo@tradediary.ai', name: 'Demo Trader' },
    })
  }
  return user.id
}

// POST /api/ai/analyze - Analyze a single trade or recent trades
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tradeId } = body

    const userId = await getDemoUserId()

    let tradeData
    if (tradeId) {
      const trade = await db.trade.findUnique({
        where: { id: tradeId },
        include: { psychology: true },
      })
      if (!trade) {
        return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
      }
      tradeData = trade
    } else {
      const trades = await db.trade.findMany({
        where: { userId },
        include: { psychology: true },
        orderBy: { date: 'desc' },
        take: 10,
      })
      tradeData = trades
    }

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert Indian options trading coach and analyst. The trader trades options on NIFTY (lot: 50), BANKNIFTY (lot: 15), and FINNIFTY (lot: 40).

Key terms in the data:
- optionType: CE = Call Option, PE = Put Option
- tradeType: BUY = Option Buying, SELL = Option Writing/Selling
- lots: Number of lots traded
- quantity: lotSize × lots (auto-calculated)
- entryPrice/exitPrice: Premium prices (not underlying price)
- strikePrice: The strike of the option
- pnl: Gross P&L = (exitPrice - entryPrice) × quantity for BUY, reversed for SELL
- brokerage: Estimated charges (brokerage + STT + GST + exchange charges)
- netPnl: Net P&L after charges
- rrRatio: Risk:Reward ratio based on SL and target premiums

Analyze the provided trade journal data and provide detailed insights.
Return your analysis in the following structured format using markdown:

## 🔍 Mistake Detection
List any mistakes detected in the option trades.

## 💪 Strengths
List the trader's strengths observed.

## 📊 Discipline Score
Give a discipline score from 0-100 with explanation.

## 💡 Suggestions
Provide specific, actionable suggestions for improvement in options trading.

## 🎯 Confidence Score
Give an overall confidence score from 0-100 based on the data.`
        },
        {
          role: 'user',
          content: `Analyze the following option trade journal data. Look at option types (CE/PE), trade types (BUY/SELL), premiums, lot sizes, strike prices, and net P&L after charges.

Data:
${JSON.stringify(tradeData, null, 2)}

Lot Sizes: NIFTY=50, BANKNIFTY=15, FINNIFTY=40

Return:
- Mistakes
- Strengths
- Suggestions
- Confidence score
- Discipline score`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const analysis = completion.choices[0]?.message?.content

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json({ error: 'Failed to analyze trade' }, { status: 500 })
  }
}
