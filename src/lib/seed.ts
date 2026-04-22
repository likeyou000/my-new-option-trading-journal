import { db } from '@/lib/db'

const STRATEGIES = ['Breakout', 'Scalping', 'Mean Reversion', 'Momentum', 'Trend Following', 'VWAP']
const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN']
const EMOTIONS = ['Calm', 'FOMO', 'Fear', 'Overconfidence']
const MISTAKES_LIST = ['Overtrading', 'No SL', 'Early Exit', 'Late Exit']

async function seed() {
  // Create a demo user
  const user = await db.user.create({
    data: {
      email: 'demo@tradediary.ai',
      name: 'Demo Trader',
    },
  })

  console.log('Created user:', user.id)

  // Generate 60 trades over the past 3 months
  const trades = []
  const now = new Date()

  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 90)
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    const direction = Math.random() > 0.4 ? 'LONG' : 'SHORT'
    const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]
    const entryPrice = Math.round((Math.random() * 500 + 100) * 100) / 100
    const isWin = Math.random() > 0.38 // ~62% win rate
    const pnlPercent = isWin
      ? Math.round((Math.random() * 4 + 0.5) * 100) / 100
      : -(Math.round((Math.random() * 3 + 0.3) * 100) / 100)
    const quantity = Math.floor(Math.random() * 50 + 10)
    const pnl = Math.round(entryPrice * quantity * (pnlPercent / 100) * 100) / 100
    const exitPrice = direction === 'LONG'
      ? Math.round(entryPrice * (1 + pnlPercent / 100) * 100) / 100
      : Math.round(entryPrice * (1 - pnlPercent / 100) * 100) / 100
    const stopLoss = direction === 'LONG'
      ? Math.round((entryPrice * 0.98) * 100) / 100
      : Math.round((entryPrice * 1.02) * 100) / 100
    const target = direction === 'LONG'
      ? Math.round((entryPrice * 1.03) * 100) / 100
      : Math.round((entryPrice * 0.97) * 100) / 100
    const outcome = pnl > 0 ? 'SUCCESS' : pnl < 0 ? 'FAIL' : 'BE'
    const rrRatio = Math.round(((Math.abs(target - entryPrice)) / (Math.abs(entryPrice - stopLoss))) * 100) / 100

    const trade = await db.trade.create({
      data: {
        userId: user.id,
        symbol,
        date,
        entryPrice,
        exitPrice,
        quantity,
        direction,
        stopLoss,
        target,
        strategy,
        outcome,
        notes: `${strategy} trade on ${symbol}`,
        pnl,
        pnlPercent,
        rrRatio,
        psychology: {
          create: {
            confidence: Math.floor(Math.random() * 5 + 4),
            satisfaction: Math.floor(Math.random() * 6 + 3),
            emotionalState: EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)],
            mistakes: Math.random() > 0.6
              ? MISTAKES_LIST[Math.floor(Math.random() * MISTAKES_LIST.length)]
              : null,
            lessonsLearned: Math.random() > 0.5
              ? 'Need to wait for confirmation before entry'
              : null,
          },
        },
      },
    })

    trades.push(trade)
  }

  console.log(`Created ${trades.length} trades with psychology data`)

  // Create a backtest result
  await db.backtestResult.create({
    data: {
      userId: user.id,
      name: 'NIFTY Breakout Strategy',
      symbol: 'NIFTY',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      strategy: 'Breakout',
      entryCondition: 'Price breaks above 20-day high with volume > 1.5x average',
      exitCondition: 'Price closes below 10-day low or RSI > 80',
      stopLoss: 1.5,
      takeProfit: 3.0,
      initialCapital: 100000,
      finalCapital: 142500,
      totalTrades: 45,
      winRate: 62.2,
      maxDrawdown: 8.5,
      profitFactor: 1.85,
    },
  })

  console.log('Seed completed successfully!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
