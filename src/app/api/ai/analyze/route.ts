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

// POST /api/ai/analyze - Analyze a single trade
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
      // Analyze last 10 trades
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
          content: `You are an expert Indian options trading coach and analyst. The trader trades options on NIFTY, BANKNIFTY and Indian stocks. Direction "LONG" means they bought CALL options, "SHORT" means they bought PUT options. Analyze the provided trade journal data and provide detailed insights.
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
          content: `Analyze the following option trade journal data. Direction LONG = CALL option, SHORT = PUT option. Find mistakes, patterns, and improvements.

Data:
${JSON.stringify(tradeData, null, 2)}

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
