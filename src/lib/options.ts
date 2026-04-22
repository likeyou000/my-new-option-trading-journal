// Lot sizes for Indian index options
export const LOT_SIZES: Record<string, number> = {
  NIFTY: 50,
  BANKNIFTY: 15,
  FINNIFTY: 40,
  MIDCAPNIFTY: 75,
  SENSEX: 20,
}

// Supported symbols
export const SYMBOLS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCAPNIFTY", "SENSEX"] as const

// Option types
export const OPTION_TYPES = ["CE", "PE"] as const

// Trade types
export const TRADE_TYPES = ["BUY", "SELL"] as const

// Strategies for option trading
export const STRATEGIES = [
  "Breakout",
  "Scalping",
  "Mean Reversion",
  "Momentum",
  "Trend Following",
  "VWAP",
  "Support/Resistance",
  "Directional - PE Buying",
  "Directional - CE Buying",
  "Straddle",
  "Strangle",
  "Iron Condor",
  "Hedging",
  "News Based",
  "Other",
]

// Emotions
export const EMOTIONS = ["Calm", "FOMO", "Fear", "Overconfidence", "Greedy", "Revenge"]

// Mistake options
export const MISTAKE_OPTIONS = [
  "Overtrading",
  "No SL",
  "SL Hit & Reversed",
  "Early Exit",
  "Late Entry",
  "Revenge Trade",
  "Size Too Large",
  "Ignored Setup Rules",
  "Chased the Move",
  "Held Too Long",
]

// Calculate lot quantity
export function calculateQuantity(symbol: string, lots: number): number {
  const lotSize = LOT_SIZES[symbol] || 0
  return lotSize * lots
}

// Calculate P&L for options
export function calculatePnl(
  tradeType: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  if (tradeType === "BUY") {
    return (exitPrice - entryPrice) * quantity
  } else {
    // SELL (option writing)
    return (entryPrice - exitPrice) * quantity
  }
}

// Calculate P&L percentage based on investment
export function calculatePnlPercent(
  tradeType: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  const investment = entryPrice * quantity
  if (investment === 0) return 0
  const pnl = calculatePnl(tradeType, entryPrice, exitPrice, quantity)
  return (pnl / investment) * 100
}

// Calculate estimated brokerage + charges (India) with detailed breakdown
export function calculateCharges(
  tradeType: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  _pnl: number
): number {
  const breakdown = calculateChargesBreakdown(tradeType, entryPrice, exitPrice, quantity)
  return breakdown.total
}

// Detailed charges breakdown
export interface ChargesBreakdown {
  brokerage: number
  stt: number
  exchangeTxnCharges: number
  gst: number
  sebiCharges: number
  stampDuty: number
  total: number
}

export function calculateChargesBreakdown(
  _tradeType: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): ChargesBreakdown {
  // Brokerage per order (approx ₹20 per order)
  const brokerage = 40 // ₹20 entry + ₹20 exit

  // STT (Securities Transaction Tax) - 0.0625% on sell side for options
  const stt = exitPrice * quantity * 0.000625

  // Exchange transaction charges - 0.05% approx
  const exchangeTxnCharges = 0.0005 * ((entryPrice + exitPrice) * quantity / 2)

  // GST 18% on brokerage + exchange charges
  const gst = 0.18 * (brokerage + exchangeTxnCharges)

  // SEBI charges - 0.0001%
  const sebiCharges = 0.000001 * ((entryPrice + exitPrice) * quantity / 2)

  // Stamp duty - 0.003% on buy side
  const stampDuty = 0.00003 * entryPrice * quantity

  const total = brokerage + stt + exchangeTxnCharges + gst + sebiCharges + stampDuty

  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeTxnCharges: Math.round(exchangeTxnCharges * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    sebiCharges: Math.round(sebiCharges * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

// Calculate Risk:Reward ratio
export function calculateRR(entryPrice: number, stopLoss: number, target: number): number {
  const risk = Math.abs(entryPrice - stopLoss)
  const reward = Math.abs(target - entryPrice)
  return risk > 0 ? reward / risk : 0
}

// Generate trade name
export function generateTradeName(symbol: string, strikePrice: number, optionType: string, expiryDate: string): string {
  const date = new Date(expiryDate)
  const monthShort = date.toLocaleString('en-IN', { month: 'short' }).toUpperCase()
  return `${symbol} ${strikePrice} ${optionType} (${date.getDate()} ${monthShort})`
}

// Generate full trade name with BUY/SELL
export function generateFullTradeName(
  symbol: string,
  strikePrice: number,
  optionType: string,
  expiryDate: string,
  tradeType: string
): string {
  const baseName = generateTradeName(symbol, strikePrice, optionType, expiryDate)
  return `${baseName} [${tradeType}]`
}

// Auto-detect outcome
export function detectOutcome(pnl: number): string {
  if (pnl > 0) return "WIN"
  if (pnl < 0) return "LOSS"
  return "BE"
}

// Get investment amount
export function getInvestment(entryPrice: number, quantity: number): number {
  return entryPrice * quantity
}
