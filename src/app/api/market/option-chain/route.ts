import { NextResponse } from 'next/server'

// GET /api/market/option-chain - Get option chain data for NIFTY/BANKNIFTY
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = (searchParams.get('symbol') || 'NIFTY').toUpperCase()
    const expiry = searchParams.get('expiry') // Optional: specific expiry date

    // Try to fetch from NSE India API
    const nseSymbol = symbol === 'BANKNIFTY' ? 'BANKNIFTY' : 'NIFTY'
    
    try {
      // First get cookies from NSE main page
      const sessionRes = await fetch('https://www.nseindia.com/option-chain', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(5000),
      })

      const cookies = sessionRes.headers.getSetCookie().join('; ')

      // Then fetch option chain data
      const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${nseSymbol}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Cookie': cookies,
          'Referer': 'https://www.nseindia.com/option-chain',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (response.ok) {
        const data = await response.json()
        const optionData = processNSEOptionData(data, expiry)
        return NextResponse.json({ ...optionData, source: 'live' })
      }
    } catch {
      // NSE API failed, use simulated data
    }

    // Fallback: Simulated option chain data
    return NextResponse.json(getSimulatedOptionChain(symbol, expiry))
  } catch (error) {
    console.error('Error fetching option chain:', error)
    return NextResponse.json({ error: 'Failed to fetch option chain' }, { status: 500 })
  }
}

function processNSEOptionData(data: Record<string, unknown>, expiry?: string | null) {
  const records = data.records as Record<string, unknown>
  if (!records) return getSimulatedOptionChain('NIFTY', expiry)

  const underlyingValue = records.underlyingValue as number
  const allDates = (records.expiryDates as string[]) || []
  const selectedExpiry = expiry || allDates[0] || ''
  
  const filteredData = ((records.data as Record<string, unknown>[]) || [])
    .filter((item: Record<string, unknown>) => item.expiryDate === selectedExpiry)

  const strikes = filteredData.map((item: Record<string, unknown>) => {
    const ce = (item.CE as Record<string, unknown>) || {}
    const pe = (item.PE as Record<string, unknown>) || {}
    return {
      strikePrice: item.strikePrice as number,
      call: {
        oi: ce.openInterest || 0,
        changeInOI: ce.changeinOpenInterest || 0,
        volume: ce.totalTradedVolume || 0,
        iv: ce.impliedVolatility || 0,
        ltp: ce.lastPrice || 0,
        change: ce.change || 0,
        bidQty: ce.bidQty || 0,
        bidPrice: ce.bidprice || 0,
        askQty: ce.askQty || 0,
        askPrice: ce.askPrice || 0,
      },
      put: {
        oi: pe.openInterest || 0,
        changeInOI: pe.changeinOpenInterest || 0,
        volume: pe.totalTradedVolume || 0,
        iv: pe.impliedVolatility || 0,
        ltp: pe.lastPrice || 0,
        change: pe.change || 0,
        bidQty: pe.bidQty || 0,
        bidPrice: pe.bidprice || 0,
        askQty: pe.askQty || 0,
        askPrice: pe.askPrice || 0,
      },
    }
  })

  return {
    underlyingValue,
    expiryDates: allDates,
    selectedExpiry,
    strikes,
    maxPain: calculateMaxPain(strikes),
    pcr: calculatePCR(strikes),
  }
}

function calculateMaxPain(strikes: { strikePrice: number; call: { oi: number }; put: { oi: number } }[]) {
  if (strikes.length === 0) return 0
  let minPain = Infinity
  let maxPainStrike = 0

  strikes.forEach(s => {
    let pain = 0
    strikes.forEach(t => {
      if (t.strikePrice < s.strikePrice) pain += t.call.oi * (s.strikePrice - t.strikePrice)
      if (t.strikePrice > s.strikePrice) pain += t.put.oi * (t.strikePrice - s.strikePrice)
    })
    if (pain < minPain) { minPain = pain; maxPainStrike = s.strikePrice }
  })

  return maxPainStrike
}

function calculatePCR(strikes: { call: { oi: number }; put: { oi: number } }[]) {
  const totalCallOI = strikes.reduce((s, t) => s + t.call.oi, 0)
  const totalPutOI = strikes.reduce((s, t) => s + t.put.oi, 0)
  return totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : 0
}

function getSimulatedOptionChain(symbol: string, expiry?: string | null) {
  const basePrice = symbol === 'BANKNIFTY' ? 48750 : 23450
  const step = symbol === 'BANKNIFTY' ? 100 : 50
  const numStrikes = 25

  const today = new Date()
  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7 || 7))
  const nextExpiry = nextThursday.toISOString().split('T')[0]
  const followingExpiry = new Date(nextThursday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const selectedExpiry = expiry || nextExpiry
  const expiryDates = [nextExpiry, followingExpiry]

  const centerStrike = Math.round(basePrice / step) * step
  const strikes = []

  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strikePrice = centerStrike + i * step
    const diff = Math.abs(strikePrice - basePrice)
    const isITMCall = strikePrice < basePrice
    const isITMPut = strikePrice > basePrice
    
    const baseOI = Math.floor(Math.random() * 500000 + 50000)
    const callOI = isITMCall ? baseOI * 2 : baseOI
    const putOI = isITMPut ? baseOI * 2 : baseOI
    
    const callLTP = Math.max(0.05, (basePrice - strikePrice) + Math.random() * diff * 0.1 + 50)
    const putLTP = Math.max(0.05, (strikePrice - basePrice) + Math.random() * diff * 0.1 + 50)

    strikes.push({
      strikePrice,
      call: {
        oi: callOI,
        changeInOI: Math.floor((Math.random() - 0.4) * 100000),
        volume: Math.floor(Math.random() * 200000 + 10000),
        iv: Math.round((15 + diff / basePrice * 50 + Math.random() * 5) * 100) / 100,
        ltp: Math.round(Math.max(0.05, callLTP) * 100) / 100,
        change: Math.round((Math.random() - 0.5) * 50 * 100) / 100,
        bidQty: Math.floor(Math.random() * 500 + 10),
        bidPrice: Math.round(Math.max(0.05, callLTP - 1) * 100) / 100,
        askQty: Math.floor(Math.random() * 500 + 10),
        askPrice: Math.round((callLTP + 1) * 100) / 100,
      },
      put: {
        oi: putOI,
        changeInOI: Math.floor((Math.random() - 0.4) * 100000),
        volume: Math.floor(Math.random() * 200000 + 10000),
        iv: Math.round((15 + diff / basePrice * 50 + Math.random() * 5) * 100) / 100,
        ltp: Math.round(Math.max(0.05, putLTP) * 100) / 100,
        change: Math.round((Math.random() - 0.5) * 50 * 100) / 100,
        bidQty: Math.floor(Math.random() * 500 + 10),
        bidPrice: Math.round(Math.max(0.05, putLTP - 1) * 100) / 100,
        askQty: Math.floor(Math.random() * 500 + 10),
        askPrice: Math.round((putLTP + 1) * 100) / 100,
      },
    })
  }

  return {
    underlyingValue: basePrice,
    expiryDates,
    selectedExpiry,
    strikes,
    maxPain: calculateMaxPain(strikes),
    pcr: calculatePCR(strikes),
    source: 'simulated',
  }
}
