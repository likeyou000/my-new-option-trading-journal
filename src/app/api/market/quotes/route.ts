import { NextResponse } from 'next/server'

// GET /api/market/quotes - Get live quotes for Indian stocks
// Uses Yahoo Finance API (free, no key required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols') || 'NSEI,NIFTY,BANKNIFTY,RELIANCE,TCS,INFY,HDFCBANK,ICICIBANK,SBIN'
    
    const symbolMap: Record<string, string> = {
      'NIFTY': '^NSEI',
      'BANKNIFTY': '^NSEBANK',
      'RELIANCE': 'RELIANCE.NS',
      'TCS': 'TCS.NS',
      'INFY': 'INFY.NS',
      'HDFCBANK': 'HDFCBANK.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'SBIN': 'SBIN.NS',
      'NSEI': '^NSEI',
      'ADANIENT': 'ADANIENT.NS',
      'ITC': 'ITC.NS',
      'WIPRO': 'WIPRO.NS',
      'HCLTECH': 'HCLTECH.NS',
      'AXISBANK': 'AXISBANK.NS',
      'KOTAKBANK': 'KOTAKBANK.NS',
      'LT': 'LT.NS',
      'MARUTI': 'MARUTI.NS',
      'TATAMOTORS': 'TATAMOTORS.NS',
      'TATASTEEL': 'TATASTEEL.NS',
      'SUNPHARMA': 'SUNPHARMA.NS',
    }

    const yahooSymbols = symbols.split(',').map(s => symbolMap[s.toUpperCase()] || `${s}.NS`).join(',')
    
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      // Fallback to simulated data if Yahoo API fails
      return NextResponse.json({ quotes: getSimulatedQuotes(symbols.split(',')), source: 'simulated' })
    }

    const data = await response.json()
    const quotes = (data.quoteResponse?.result || []).map((q: Record<string, unknown>) => ({
      symbol: String(q.symbol || '').replace('.NS', '').replace('^', ''),
      name: q.shortName || q.symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      volume: q.regularMarketVolume || 0,
      dayHigh: q.regularMarketDayHigh || 0,
      dayLow: q.regularMarketDayLow || 0,
      prevClose: q.regularMarketPreviousClose || 0,
      marketCap: q.marketCap || 0,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow || 0,
    }))

    return NextResponse.json({ quotes, source: 'live' })
  } catch {
    // Fallback to simulated data
    const symbols = new URL(request.url).searchParams.get('symbols') || 'NIFTY,BANKNIFTY,RELIANCE'
    return NextResponse.json({ quotes: getSimulatedQuotes(symbols.split(',')), source: 'simulated' })
  }
}

function getSimulatedQuotes(symbols: string[]) {
  const basePrices: Record<string, { name: string; price: number }> = {
    'NIFTY': { name: 'NIFTY 50', price: 23456.80 },
    'BANKNIFTY': { name: 'BANK NIFTY', price: 48750.35 },
    'RELIANCE': { name: 'Reliance Industries', price: 2890.50 },
    'TCS': { name: 'Tata Consultancy', price: 3456.20 },
    'INFY': { name: 'Infosys Ltd', price: 1567.80 },
    'HDFCBANK': { name: 'HDFC Bank Ltd', price: 1678.40 },
    'ICICIBANK': { name: 'ICICI Bank Ltd', price: 1234.60 },
    'SBIN': { name: 'State Bank India', price: 789.30 },
    'NSEI': { name: 'NIFTY 50', price: 23456.80 },
    'ITC': { name: 'ITC Limited', price: 456.70 },
    'WIPRO': { name: 'Wipro Ltd', price: 567.80 },
    'ADANIENT': { name: 'Adani Enterprises', price: 2890.50 },
    'HCLTECH': { name: 'HCL Technologies', price: 1678.40 },
    'AXISBANK': { name: 'Axis Bank', price: 1123.50 },
    'KOTAKBANK': { name: 'Kotak Mahindra Bank', price: 1789.60 },
    'LT': { name: 'Larsen & Toubro', price: 3456.20 },
    'MARUTI': { name: 'Maruti Suzuki', price: 12345.60 },
    'TATAMOTORS': { name: 'Tata Motors', price: 987.30 },
    'TATASTEEL': { name: 'Tata Steel', price: 156.80 },
    'SUNPHARMA': { name: 'Sun Pharma', price: 1234.50 },
  }

  return symbols.map(sym => {
    const base = basePrices[sym.toUpperCase()] || { name: sym, price: Math.random() * 2000 + 100 }
    const changePercent = (Math.random() - 0.45) * 4 // Slight upward bias
    const change = base.price * (changePercent / 100)
    return {
      symbol: sym.toUpperCase(),
      name: base.name,
      price: Math.round((base.price + change) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 50000000 + 1000000),
      dayHigh: Math.round((base.price * 1.02) * 100) / 100,
      dayLow: Math.round((base.price * 0.98) * 100) / 100,
      prevClose: base.price,
      marketCap: Math.floor(Math.random() * 2000000000000 + 100000000000),
      fiftyTwoWeekHigh: Math.round((base.price * 1.25) * 100) / 100,
      fiftyTwoWeekLow: Math.round((base.price * 0.7) * 100) / 100,
    }
  })
}
