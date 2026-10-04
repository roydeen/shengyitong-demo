export const OPERATIONS_START_DATE = '2024-09-01'
export const OPERATIONS_END_DATE = '2026-10-03'
export const OPERATIONS_SEAT_COUNT = 118
export const OPERATIONS_TABLE_COUNT = 29

export type OperationsDateType = '工作日' | '周末' | '节假日'
export type OperationsWeather = '晴' | '多云' | '小雨' | '大雨'

export type OperationsDailyRecord = {
  date: string
  month: string
  weekday: number
  dateType: OperationsDateType
  holidayName: string
  weather: OperationsWeather
  dineInCovers: number
  dineInOrders: number
  pickupOrders: number
  totalOrders: number
  lunchOrders: number
  afternoonOrders: number
  dinnerOrders: number
  lunchDineInOrders: number
  afternoonDineInOrders: number
  dinnerDineInOrders: number
  lunchCovers: number
  afternoonCovers: number
  dinnerCovers: number
  grossSales: number
  refundedAmount: number
  netSales: number
  dineInSales: number
  pickupSales: number
  lunchSales: number
  afternoonSales: number
  dinnerSales: number
  lunchDineInSales: number
  afternoonDineInSales: number
  dinnerDineInSales: number
  avgSpendPerGuest: number
  avgOrderValue: number
  seatTurnover: number
  avgDiningMinutes: number
  reservationOrders: number
  averageWaitMinutes: number
  lightMealSales: number
  chineseMealSales: number
  banquetSales: number
  beverageSales: number
}

const DAY_MS = 86400000
const toUtc = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

const dateInRange = (date: string, start: string, end: string) => date >= start && date <= end

const getHolidayName = (date: string) => {
  const holidayRanges: Array<[string, string, string]> = [
    ['2024-09-15', '2024-09-17', '中秋假期'],
    ['2024-10-01', '2024-10-07', '国庆假期'],
    ['2025-01-01', '2025-01-01', '元旦'],
    ['2025-01-28', '2025-02-04', '春节假期'],
    ['2025-04-04', '2025-04-06', '清明假期'],
    ['2025-05-01', '2025-05-05', '五一假期'],
    ['2025-05-31', '2025-06-02', '端午假期'],
    ['2025-10-01', '2025-10-08', '国庆中秋假期'],
    ['2026-01-01', '2026-01-03', '元旦假期'],
    ['2026-02-15', '2026-02-23', '春节假期'],
    ['2026-04-04', '2026-04-06', '清明假期'],
    ['2026-05-01', '2026-05-05', '五一假期'],
    ['2026-06-19', '2026-06-21', '端午假期'],
    ['2026-10-01', '2026-10-03', '国庆假期'],
  ]
  return holidayRanges.find(([start, end]) => dateInRange(date, start, end))?.[2] ?? ''
}

const noise = (index: number, salt: number) => {
  const raw = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return raw - Math.floor(raw)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundMoney = (value: number) => Math.round(value * 100) / 100

const getSeasonFactor = (month: number) => {
  if (month === 9 || month === 10) return 1.08
  if (month === 4 || month === 5) return 1.05
  if (month >= 6 && month <= 8) return 1.02
  if (month === 1 || month === 2) return 0.94
  return 1
}

const getWeather = (index: number, month: number): OperationsWeather => {
  const wetSeason = month >= 5 && month <= 7
  const value = noise(index, 17)
  if (value < (wetSeason ? 0.09 : 0.035)) return '大雨'
  if (value < (wetSeason ? 0.28 : 0.16)) return '小雨'
  if (value < 0.57) return '多云'
  return '晴'
}

const createOperationsRecords = () => {
  const start = toUtc(OPERATIONS_START_DATE)
  const end = toUtc(OPERATIONS_END_DATE)
  const totalDays = Math.round((end - start) / DAY_MS) + 1

  return Array.from({ length: totalDays }, (_, index): OperationsDailyRecord => {
    const timestamp = start + index * DAY_MS
    const current = new Date(timestamp)
    const date = current.toISOString().slice(0, 10)
    const monthNumber = current.getUTCMonth() + 1
    const weekday = current.getUTCDay()
    const holidayName = getHolidayName(date)
    const isWeekend = weekday === 0 || weekday === 6
    const dateType: OperationsDateType = holidayName ? '节假日' : isWeekend ? '周末' : '工作日'
    const weather = getWeather(index, monthNumber)
    const trendFactor = 0.95 + (index / Math.max(1, totalDays - 1)) * 0.11
    const seasonFactor = getSeasonFactor(monthNumber)
    const weekdayBase = [246, 148, 154, 159, 164, 184, 274][weekday]
    const holidayBase = holidayName.includes('国庆')
      ? Math.max(weekdayBase, 315)
      : holidayName.includes('春节')
        ? Math.max(weekdayBase, 270)
        : Math.max(weekdayBase, 282)
    const demandBase = holidayName ? holidayBase : weekdayBase
    const rainFactor = weather === '大雨' ? 0.82 : weather === '小雨' ? 0.91 : weather === '晴' ? 1.035 : 1
    const dailyFactor = 0.93 + noise(index, 3) * 0.14
    const dineInCovers = Math.round(clamp(demandBase * trendFactor * seasonFactor * rainFactor * dailyFactor, 92, 390))

    const lunchShare = dateType === '工作日' ? 0.55 : dateType === '节假日' ? 0.43 : 0.45
    const afternoonShare = dateType === '工作日' ? 0.055 : 0.075
    const lunchCovers = Math.round(dineInCovers * (lunchShare + (noise(index, 9) - 0.5) * 0.035))
    const afternoonCovers = Math.round(dineInCovers * (afternoonShare + (noise(index, 10) - 0.5) * 0.02))
    const dinnerCovers = dineInCovers - lunchCovers - afternoonCovers

    const partySizes = dateType === '工作日'
      ? [1.8, 1.6, 2.5]
      : dateType === '周末'
        ? [2.35, 1.85, 2.7]
        : [2.45, 1.9, 2.88]
    const holidayPartyFactor = dateType === '节假日' ? clamp(1 + (dineInCovers - 300) / 600, 0.96, 1.16) : 1
    const lunchDineInOrders = Math.max(1, Math.round(lunchCovers / (partySizes[0] * holidayPartyFactor * (0.96 + noise(index, 4) * 0.08))))
    const afternoonDineInOrders = Math.max(1, Math.round(afternoonCovers / (partySizes[1] * holidayPartyFactor * (0.96 + noise(index, 5) * 0.08))))
    const dinnerDineInOrders = Math.max(1, Math.round(dinnerCovers / (partySizes[2] * holidayPartyFactor * (0.96 + noise(index, 6) * 0.08))))
    const dineInOrders = lunchDineInOrders + afternoonDineInOrders + dinnerDineInOrders

    const pickupOrders = Math.max(5, Math.round((dateType === '工作日' ? 11 : 9) * trendFactor * (0.88 + noise(index, 8) * 0.24)))
    const pickupLunchShare = dateType === '工作日' ? 0.57 : 0.48
    const pickupAfternoonShare = dateType === '工作日' ? 0.1 : 0.14
    const lunchPickupOrders = Math.round(pickupOrders * pickupLunchShare)
    const afternoonPickupOrders = Math.round(pickupOrders * pickupAfternoonShare)
    const dinnerPickupOrders = pickupOrders - lunchPickupOrders - afternoonPickupOrders
    const lunchOrders = lunchDineInOrders + lunchPickupOrders
    const afternoonOrders = afternoonDineInOrders + afternoonPickupOrders
    const dinnerOrders = dinnerDineInOrders + dinnerPickupOrders
    const totalOrders = lunchOrders + afternoonOrders + dinnerOrders

    const priceTrendFactor = 0.97 + (index / Math.max(1, totalDays - 1)) * 0.08
    const spendBases = dateType === '工作日'
      ? [58, 68, 112]
      : dateType === '周末'
        ? [91, 76, 118]
        : [98, 80, 128]
    const lunchSpendPerGuest = spendBases[0] * priceTrendFactor * (0.96 + noise(index, 11) * 0.08)
    const afternoonSpendPerGuest = spendBases[1] * priceTrendFactor * (0.96 + noise(index, 12) * 0.08)
    const dinnerSpendPerGuest = spendBases[2] * priceTrendFactor * (0.96 + noise(index, 13) * 0.08)
    const lunchDineInGross = roundMoney(lunchCovers * lunchSpendPerGuest)
    const afternoonDineInGross = roundMoney(afternoonCovers * afternoonSpendPerGuest)
    const dinnerDineInGross = roundMoney(dinnerCovers * dinnerSpendPerGuest)
    const dineInGross = roundMoney(lunchDineInGross + afternoonDineInGross + dinnerDineInGross)

    const pickupTicket = (dateType === '工作日' ? 55 : 60) * priceTrendFactor * (0.96 + noise(index, 21) * 0.08)
    const lunchPickupGross = roundMoney(lunchPickupOrders * pickupTicket)
    const afternoonPickupGross = roundMoney(afternoonPickupOrders * pickupTicket)
    const dinnerPickupGross = roundMoney(dinnerPickupOrders * pickupTicket)
    const pickupSalesGross = roundMoney(lunchPickupGross + afternoonPickupGross + dinnerPickupGross)
    const grossSales = roundMoney(dineInGross + pickupSalesGross)
    const refundRate = 0.002 + noise(index, 14) * 0.008
    const refundedAmount = roundMoney(grossSales * refundRate)
    const netSales = roundMoney(grossSales - refundedAmount)
    const netFactor = grossSales ? netSales / grossSales : 1
    const dineInSales = roundMoney(dineInGross * netFactor)
    const pickupSales = roundMoney(netSales - dineInSales)
    const lunchDineInSales = roundMoney(lunchDineInGross * netFactor)
    const afternoonDineInSales = roundMoney(afternoonDineInGross * netFactor)
    const dinnerDineInSales = roundMoney(dineInSales - lunchDineInSales - afternoonDineInSales)
    const lunchSales = roundMoney((lunchDineInGross + lunchPickupGross) * netFactor)
    const afternoonSales = roundMoney((afternoonDineInGross + afternoonPickupGross) * netFactor)
    const dinnerSales = roundMoney(netSales - lunchSales - afternoonSales)
    const avgSpendPerGuest = roundMoney(dineInSales / dineInCovers)
    const avgOrderValue = roundMoney(netSales / totalOrders)

    const avgDiningMinutes = Math.round((dateType === '工作日' ? 69 : dateType === '周末' ? 82 : 88) + (noise(index, 15) - 0.5) * 12)
    const reservationOrders = Math.max(0, Math.round((dateType === '工作日' ? 9 : dateType === '周末' ? 24 : 35) * (0.88 + noise(index, 16) * 0.24)))
    const averageWaitMinutes = Math.max(0, Math.round((dateType === '工作日' ? 4 : dateType === '周末' ? 14 : 23) * rainFactor * (0.8 + noise(index, 18) * 0.4)))

    const lightMealShare = dateType === '工作日' ? 0.28 : dateType === '周末' ? 0.18 : 0.15
    const banquetShare = dateType === '工作日' ? 0.1 : dateType === '周末' ? 0.2 : 0.25
    const beverageShare = dateType === '工作日' ? 0.13 : 0.11
    const chineseShare = 1 - lightMealShare - banquetShare - beverageShare
    const lightMealSales = roundMoney(netSales * lightMealShare)
    const banquetSales = roundMoney(netSales * banquetShare)
    const beverageSales = roundMoney(netSales * beverageShare)
    const chineseMealSales = roundMoney(netSales * chineseShare)

    return {
      date,
      month: date.slice(0, 7),
      weekday,
      dateType,
      holidayName,
      weather,
      dineInCovers,
      dineInOrders,
      pickupOrders,
      totalOrders,
      lunchOrders,
      afternoonOrders,
      dinnerOrders,
      lunchDineInOrders,
      afternoonDineInOrders,
      dinnerDineInOrders,
      lunchCovers,
      afternoonCovers,
      dinnerCovers,
      grossSales,
      refundedAmount,
      netSales,
      dineInSales,
      pickupSales,
      lunchSales,
      afternoonSales,
      dinnerSales,
      lunchDineInSales,
      afternoonDineInSales,
      dinnerDineInSales,
      avgSpendPerGuest,
      avgOrderValue,
      seatTurnover: roundMoney(dineInCovers / OPERATIONS_SEAT_COUNT),
      avgDiningMinutes,
      reservationOrders,
      averageWaitMinutes,
      lightMealSales,
      chineseMealSales,
      banquetSales,
      beverageSales,
    }
  })
}

export const operationsDailyRecords = createOperationsRecords()

