import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Download,
  LoaderCircle,
  ReceiptText,
  Sparkles,
  Store,
  Users,
  Utensils,
  WalletCards,
} from 'lucide-react'
import { aiBusinessCategoryIcons, aiBusinessCategoryLabels } from './aiBusinessCategories'
import CopyableEllipsis from './CopyableEllipsis'
import {
  OPERATIONS_END_DATE,
  OPERATIONS_SEAT_COUNT,
  OPERATIONS_START_DATE,
  operationsDailyRecords,
} from './operationsData'
import type { OperationsDailyRecord } from './operationsData'

type RangePreset = '30d' | '90d' | '1y' | 'all' | 'custom'

type OperationsDashboardProps = {
  suggestionIds?: string[]
  onGenerateSuggestion?: (id: string) => void
}

const OPERATION_SUGGESTION_IDS = ['afternoon-tea-growth', 'rain-enterprise-delivery'] as const

type OperationsTotals = {
  covers: number
  orders: number
  sales: number
  refunds: number
  dineInSales: number
  dineInOrders: number
  pickupOrders: number
  lunchOrders: number
  afternoonOrders: number
  dinnerOrders: number
  lunchDineInOrders: number
  afternoonDineInOrders: number
  dinnerDineInOrders: number
  lunchCovers: number
  afternoonCovers: number
  dinnerCovers: number
  lunchSales: number
  afternoonSales: number
  dinnerSales: number
  lunchDineInSales: number
  afternoonDineInSales: number
  dinnerDineInSales: number
  diningMinutes: number
  reservations: number
  waitMinutes: number
}

const DAY_MS = 86400000
const formatMoney = (value: number) => `¥${Math.round(value).toLocaleString('zh-CN')}`
const formatNumber = (value: number) => Math.round(value).toLocaleString('zh-CN')
const formatAxisMoney = (value: number) => {
  if (value >= 10000) {
    const amount = value / 10000
    return `¥${amount >= 10 || Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1)}万`
  }
  return `¥${Math.round(value).toLocaleString('zh-CN')}`
}
const formatDate = (value: string) => value.replaceAll('-', '.')
const toUtc = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}
const shiftDate = (value: string, days: number) => new Date(toUtc(value) + days * DAY_MS).toISOString().slice(0, 10)
const dayCount = (start: string, end: string) => Math.round((toUtc(end) - toUtc(start)) / DAY_MS) + 1
const niceAxisMax = (value: number) => {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return rounded * magnitude
}

const buildSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = points[index - 1] ?? point
    const next = points[index + 1]
    const afterNext = points[index + 2] ?? next
    const controlOneX = point.x + (next.x - previous.x) / 6
    const controlOneY = point.y + (next.y - previous.y) / 6
    const controlTwoX = next.x - (afterNext.x - point.x) / 6
    const controlTwoY = next.y - (afterNext.y - point.y) / 6
    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

const sumRecords = (rows: OperationsDailyRecord[]): OperationsTotals => rows.reduce((total, row) => ({
  covers: total.covers + row.dineInCovers,
  orders: total.orders + row.totalOrders,
  sales: total.sales + row.netSales,
  refunds: total.refunds + row.refundedAmount,
  dineInSales: total.dineInSales + row.dineInSales,
  dineInOrders: total.dineInOrders + row.dineInOrders,
  pickupOrders: total.pickupOrders + row.pickupOrders,
  lunchOrders: total.lunchOrders + row.lunchOrders,
  afternoonOrders: total.afternoonOrders + row.afternoonOrders,
  dinnerOrders: total.dinnerOrders + row.dinnerOrders,
  lunchDineInOrders: total.lunchDineInOrders + row.lunchDineInOrders,
  afternoonDineInOrders: total.afternoonDineInOrders + row.afternoonDineInOrders,
  dinnerDineInOrders: total.dinnerDineInOrders + row.dinnerDineInOrders,
  lunchCovers: total.lunchCovers + row.lunchCovers,
  afternoonCovers: total.afternoonCovers + row.afternoonCovers,
  dinnerCovers: total.dinnerCovers + row.dinnerCovers,
  lunchSales: total.lunchSales + row.lunchSales,
  afternoonSales: total.afternoonSales + row.afternoonSales,
  dinnerSales: total.dinnerSales + row.dinnerSales,
  lunchDineInSales: total.lunchDineInSales + row.lunchDineInSales,
  afternoonDineInSales: total.afternoonDineInSales + row.afternoonDineInSales,
  dinnerDineInSales: total.dinnerDineInSales + row.dinnerDineInSales,
  diningMinutes: total.diningMinutes + row.avgDiningMinutes,
  reservations: total.reservations + row.reservationOrders,
  waitMinutes: total.waitMinutes + row.averageWaitMinutes,
}), {
  covers: 0,
  orders: 0,
  sales: 0,
  refunds: 0,
  dineInSales: 0,
  dineInOrders: 0,
  pickupOrders: 0,
  lunchOrders: 0,
  afternoonOrders: 0,
  dinnerOrders: 0,
  lunchDineInOrders: 0,
  afternoonDineInOrders: 0,
  dinnerDineInOrders: 0,
  lunchCovers: 0,
  afternoonCovers: 0,
  dinnerCovers: 0,
  lunchSales: 0,
  afternoonSales: 0,
  dinnerSales: 0,
  lunchDineInSales: 0,
  afternoonDineInSales: 0,
  dinnerDineInSales: 0,
  diningMinutes: 0,
  reservations: 0,
  waitMinutes: 0,
})

const deltaText = (current: number, previous: number) => {
  if (!previous) return { text: '暂无对比', tone: 'flat' }
  const value = ((current - previous) / previous) * 100
  return {
    text: `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`,
    tone: value > 0.1 ? 'up' : value < -0.1 ? 'down' : 'flat',
  }
}

const aggregateTrend = (rows: OperationsDailyRecord[]) => {
  const mode = rows.length <= 45 ? 'day' : rows.length <= 180 ? 'week' : 'month'
  const groups = new Map<string, OperationsDailyRecord[]>()
  rows.forEach((row, index) => {
    const key = mode === 'day'
      ? row.date
      : mode === 'week'
        ? `${Math.floor(index / 7)}`
        : row.month
    groups.set(key, [...(groups.get(key) ?? []), row])
  })
  return Array.from(groups.values()).map((group) => {
    const totals = sumRecords(group)
    const first = group[0]
    const last = group[group.length - 1]
    return {
      label: mode === 'day'
        ? first.date.slice(5).replace('-', '/')
        : mode === 'week'
          ? `${first.date.slice(5).replace('-', '/')}`
          : first.month.replace('-', '/'),
      title: mode === 'day' ? first.date : `${first.date} 至 ${last.date}`,
      sales: totals.sales,
      covers: totals.covers,
      orders: totals.orders,
      turnover: totals.covers / (OPERATIONS_SEAT_COUNT * group.length),
    }
  })
}

export default function OperationsDashboard({
  suggestionIds = [...OPERATION_SUGGESTION_IDS],
  onGenerateSuggestion,
}: OperationsDashboardProps) {
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customStart, setCustomStart] = useState('2026-09-01')
  const [customEnd, setCustomEnd] = useState(OPERATIONS_END_DATE)
  const [appliedCustom, setAppliedCustom] = useState({ start: '2026-09-01', end: OPERATIONS_END_DATE })
  const [dateError, setDateError] = useState('')
  const [trendChartWidth, setTrendChartWidth] = useState(720)
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null)
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null)
  const [runningSuggestionId, setRunningSuggestionId] = useState<string | null>(null)
  const trendContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = trendContainerRef.current
    if (!container) return
    const updateWidth = () => setTrendChartWidth(Math.max(280, Math.round(container.clientWidth)))
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const range = useMemo(() => {
    if (preset === 'all') return { start: OPERATIONS_START_DATE, end: OPERATIONS_END_DATE }
    if (preset === '1y') return { start: shiftDate(OPERATIONS_END_DATE, -364), end: OPERATIONS_END_DATE }
    if (preset === '90d') return { start: shiftDate(OPERATIONS_END_DATE, -89), end: OPERATIONS_END_DATE }
    if (preset === 'custom') return appliedCustom
    return { start: shiftDate(OPERATIONS_END_DATE, -29), end: OPERATIONS_END_DATE }
  }, [preset, appliedCustom])

  const rows = useMemo(
    () => operationsDailyRecords.filter((row) => row.date >= range.start && row.date <= range.end),
    [range],
  )
  const totals = useMemo(() => sumRecords(rows), [rows])
  const previousRows = useMemo(() => {
    const days = dayCount(range.start, range.end)
    const previousEnd = shiftDate(range.start, -1)
    const previousStart = shiftDate(previousEnd, -(days - 1))
    if (previousStart < OPERATIONS_START_DATE) return []
    return operationsDailyRecords.filter((row) => row.date >= previousStart && row.date <= previousEnd)
  }, [range])
  const previousTotals = useMemo(() => sumRecords(previousRows), [previousRows])
  const trend = useMemo(() => aggregateTrend(rows), [rows])
  useEffect(() => setHoveredTrendIndex(null), [trend])
  const trendChart = useMemo(() => {
    const width = trendChartWidth
    const compact = width < 520
    const height = compact ? 238 : width < 800 ? 265 : 300
    const plot = compact
      ? { left: 55, right: 48, top: 16, bottom: 36 }
      : { left: 78, right: 72, top: 20, bottom: 44 }
    const plotWidth = width - plot.left - plot.right
    const plotHeight = height - plot.top - plot.bottom
    const salesMax = niceAxisMax(Math.max(1, ...trend.map((item) => item.sales)))
    const ordersMax = niceAxisMax(Math.max(1, ...trend.map((item) => item.orders)))
    const pointX = (index: number) => plot.left + (trend.length <= 1 ? plotWidth / 2 : (index / (trend.length - 1)) * plotWidth)
    const salesPoints = trend.map((item, index) => ({ x: pointX(index), y: plot.top + plotHeight * (1 - item.sales / salesMax) }))
    const orderPoints = trend.map((item, index) => ({ x: pointX(index), y: plot.top + plotHeight * (1 - item.orders / ordersMax) }))
    const tickIndexes = trend.reduce<number[]>((indexes, _item, index) => {
      const interval = Math.max(1, Math.ceil(trend.length / (compact ? 5 : 8)))
      if (index % interval === 0 || index === trend.length - 1) indexes.push(index)
      return indexes
    }, [])
    return {
      width,
      height,
      plot,
      plotWidth,
      plotHeight,
      salesMax,
      ordersMax,
      salesPoints,
      orderPoints,
      salesPath: buildSmoothPath(salesPoints),
      orderPath: buildSmoothPath(orderPoints),
      tickIndexes,
    }
  }, [trend, trendChartWidth])
  const averageOrderValue = totals.orders ? totals.sales / totals.orders : 0
  const averageDailyOrders = rows.length ? totals.orders / rows.length : 0

  const mealRows = [
    ['午餐', totals.lunchOrders, totals.lunchCovers, totals.lunchSales, totals.lunchDineInSales],
    ['下午', totals.afternoonOrders, totals.afternoonCovers, totals.afternoonSales, totals.afternoonDineInSales],
    ['晚餐', totals.dinnerOrders, totals.dinnerCovers, totals.dinnerSales, totals.dinnerDineInSales],
  ] as const
  const dateTypeRows = (['工作日', '周末', '节假日'] as const).map((dateType) => {
    const typedRows = rows.filter((row) => row.dateType === dateType)
    const typedTotals = sumRecords(typedRows)
    return {
      label: dateType,
      days: typedRows.length,
      dailyOrders: typedRows.length ? typedTotals.orders / typedRows.length : 0,
      dailyCovers: typedRows.length ? typedTotals.covers / typedRows.length : 0,
      dailySales: typedRows.length ? typedTotals.sales / typedRows.length : 0,
      averageOrderValue: typedTotals.orders ? typedTotals.sales / typedTotals.orders : 0,
    }
  })

  const monthlyRows = useMemo(() => {
    const groups = new Map<string, OperationsDailyRecord[]>()
    rows.forEach((row) => groups.set(row.month, [...(groups.get(row.month) ?? []), row]))
    return Array.from(groups.entries()).map(([month, monthRows]) => {
      const monthTotals = sumRecords(monthRows)
      const previousYearStart = `${Number(monthRows[0].date.slice(0, 4)) - 1}${monthRows[0].date.slice(4)}`
      const previousYearEnd = `${Number(monthRows[monthRows.length - 1].date.slice(0, 4)) - 1}${monthRows[monthRows.length - 1].date.slice(4)}`
      const previousYear = operationsDailyRecords.filter((row) => row.date >= previousYearStart && row.date <= previousYearEnd)
      const previousYearTotals = sumRecords(previousYear)
      return {
        month,
        days: monthRows.length,
        totals: monthTotals,
        yoy: previousYear.length ? deltaText(monthTotals.orders, previousYearTotals.orders) : null,
      }
    }).reverse()
  }, [rows])

  const categoryRows = [
    ['中式正餐', rows.reduce((sum, row) => sum + row.chineseMealSales, 0)],
    ['宴请套餐', rows.reduce((sum, row) => sum + row.banquetSales, 0)],
    ['轻食套餐', rows.reduce((sum, row) => sum + row.lightMealSales, 0)],
    ['饮品', rows.reduce((sum, row) => sum + row.beverageSales, 0)],
  ].sort((left, right) => Number(right[1]) - Number(left[1])) as Array<[string, number]>

  const applyCustomRange = () => {
    if (!customStart || !customEnd || customStart > customEnd) {
      setDateError('开始日期不能晚于结束日期')
      return
    }
    if (customStart < OPERATIONS_START_DATE || customEnd > OPERATIONS_END_DATE) {
      setDateError(`可选范围为 ${OPERATIONS_START_DATE} 至 ${OPERATIONS_END_DATE}`)
      return
    }
    setDateError('')
    setAppliedCustom({ start: customStart, end: customEnd })
    setPreset('custom')
  }

  const exportCsv = () => {
    const header = ['日期', '日期类型', '节假日', '天气', '总订单', '堂食订单', '自提订单', '午餐订单', '午餐人次', '午餐实收', '下午订单', '下午人次', '下午实收', '晚餐订单', '晚餐人次', '晚餐实收', '总实收', '堂食人次', '餐位翻台']
    const csvRows = rows.map((row) => [
      row.date, row.dateType, row.holidayName, row.weather, row.totalOrders, row.dineInOrders,
      row.pickupOrders, row.lunchOrders, row.lunchCovers, row.lunchSales,
      row.afternoonOrders, row.afternoonCovers, row.afternoonSales,
      row.dinnerOrders, row.dinnerCovers, row.dinnerSales,
      row.netSales, row.dineInCovers, row.seatTurnover,
    ])
    const csv = [header, ...csvRows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `杭州西湖店经营数据-${range.start}-${range.end}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const metricCards = [
    ['订单笔数', formatNumber(totals.orders), deltaText(totals.orders, previousTotals.orders), ReceiptText],
    ['日均订单', formatNumber(averageDailyOrders), deltaText(averageDailyOrders, previousRows.length ? previousTotals.orders / previousRows.length : 0), CalendarDays],
    ['营业实收', formatMoney(totals.sales), deltaText(totals.sales, previousTotals.sales), WalletCards],
    ['订单均价', formatMoney(averageOrderValue), deltaText(averageOrderValue, previousTotals.orders ? previousTotals.sales / previousTotals.orders : 0), Store],
    ['堂食订单', formatNumber(totals.dineInOrders), deltaText(totals.dineInOrders, previousTotals.dineInOrders), Utensils],
    ['到店人次', formatNumber(totals.covers), deltaText(totals.covers, previousTotals.covers), Users],
  ] as const

  const advisoryStats = useMemo(() => {
    const recentRows = operationsDailyRecords.slice(-30)
    const recentTotals = sumRecords(recentRows)
    const bigRainRows = operationsDailyRecords.filter((row) => row.weather === '大雨')
    const otherWeatherRows = operationsDailyRecords.filter((row) => row.weather !== '大雨')
    const bigRainTotals = sumRecords(bigRainRows)
    const otherWeatherTotals = sumRecords(otherWeatherRows)
    const afternoonDailySales = recentRows.length ? recentTotals.afternoonSales / recentRows.length : 0
    const afternoonDailyOrders = recentRows.length ? recentTotals.afternoonOrders / recentRows.length : 0
    const afternoonDailyCovers = recentRows.length ? recentTotals.afternoonCovers / recentRows.length : 0
    const bigRainDailySales = bigRainRows.length ? bigRainTotals.sales / bigRainRows.length : 0
    const otherWeatherDailySales = otherWeatherRows.length ? otherWeatherTotals.sales / otherWeatherRows.length : 0
    const rainSalesDrop = otherWeatherDailySales
      ? Math.max(0, (1 - bigRainDailySales / otherWeatherDailySales) * 100)
      : 0
    return {
      recentDays: recentRows.length,
      afternoonDailySales,
      afternoonDailyOrders,
      afternoonDailyCovers,
      bigRainDays: bigRainRows.length,
      bigRainDailySales,
      otherWeatherDailySales,
      rainSalesDrop,
    }
  }, [])

  const operationSuggestions = [
    {
      id: 'afternoon-tea-growth',
      tone: 'opportunity',
      category: 'growth_opportunity' as const,
      title: '下午茶场景常态化',
      summary: `近 ${advisoryStats.recentDays} 天下午时段日均实收 ${formatMoney(advisoryStats.afternoonDailySales)}，已有稳定消费需求。`,
      target: '目标：日均实收提升至 ¥1,600–¥1,800',
      actionLabel: '生成下午茶方案',
      metrics: [
        ['日均实收', formatMoney(advisoryStats.afternoonDailySales)],
        ['日均订单', `${advisoryStats.afternoonDailyOrders.toFixed(1)} 单`],
        ['日均到店', `${Math.round(advisoryStats.afternoonDailyCovers)} 人`],
      ],
      evidence: [
        '下午时段并非没有需求，适合从零散消费升级为固定的商务茶歇场景。',
        '重点产品应放在双人商务下午茶和 4–6 人会议茶歇，发挥门店堂食空间优势。',
        '建议同步建立企业联系人库，提供提前 2 小时预订、满 ¥199 免费送至公司前台的权益。',
      ],
    },
    {
      id: 'rain-enterprise-delivery',
      tone: 'warning',
      category: 'growth_opportunity' as const,
      title: '恶劣天气企业外送',
      summary: `历史 ${advisoryStats.bigRainDays} 个大雨日的日均实收为 ${formatMoney(advisoryStats.bigRainDailySales)}，较其他天气低 ${advisoryStats.rainSalesDrop.toFixed(1)}%。`,
      target: '目标：首阶段挽回 20% 的雨天收入缺口',
      actionLabel: '生成天气触发方案',
      metrics: [
        ['大雨日均实收', formatMoney(advisoryStats.bigRainDailySales)],
        ['其他天气日均', formatMoney(advisoryStats.otherWeatherDailySales)],
        ['收入降幅', `${advisoryStats.rainSalesDrop.toFixed(1)}%`],
      ],
      evidence: [
        '大雨主要影响自然到店，不应继续依赖到店折扣，而应让企业订单主动送达。',
        '建议平时积累周边 1 公里企业的联系人、人数规模、常订时段和菜品偏好。',
        '当次日 11:00–14:00 预报大雨时，于前一天 17:00 自动生成企业预约提醒任务。',
      ],
    },
  ].filter((item) => suggestionIds.includes(item.id))

  const generateSuggestion = (id: string) => {
    if (!onGenerateSuggestion || runningSuggestionId) return
    setRunningSuggestionId(id)
    window.setTimeout(() => {
      setRunningSuggestionId(null)
      onGenerateSuggestion(id)
    }, 1400)
  }

  return (
    <section className="operations-dashboard">
      <div className="operations-toolbar">
        <div className="operations-period-tabs" role="group" aria-label="统计周期">
          {([
            ['30d', '近30天'], ['90d', '近90天'], ['1y', '近一年'], ['all', '全部'], ['custom', '自定义'],
          ] as Array<[RangePreset, string]>).map(([value, label]) => (
            <button className={preset === value ? 'active' : ''} type="button" key={value} onClick={() => setPreset(value)}>{label}</button>
          ))}
        </div>
        <div className="operations-toolbar-meta">
          <span>数据截至 {formatDate(OPERATIONS_END_DATE)}</span>
          <button type="button" onClick={exportCsv}><Download size={15} />导出明细</button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="operations-custom-range">
          <label><span>开始日期</span><input type="date" min={OPERATIONS_START_DATE} max={OPERATIONS_END_DATE} value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label><span>结束日期</span><input type="date" min={OPERATIONS_START_DATE} max={OPERATIONS_END_DATE} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
          <button type="button" onClick={applyCustomRange}>应用</button>
          {dateError && <small>{dateError}</small>}
        </div>
      )}

      <div className="operations-range-note">
        <span>{formatDate(range.start)} 至 {formatDate(range.end)}</span>
        <small>共 {rows.length} 天 · 每日汇总</small>
      </div>

      <section className="operations-metrics">
        {metricCards.map(([label, value, delta, Icon]) => (
          <article key={label}>
            <span className="operations-metric-icon"><Icon size={18} /></span>
            <div><small>{label}</small><strong>{value}</strong><em className={delta.tone}>{previousRows.length ? `较上期 ${delta.text}` : delta.text}</em></div>
          </article>
        ))}
      </section>

      {!!operationSuggestions.length && (
        <section className="operations-insights" aria-label="小意经营建议">
          <header className="operations-insights-head">
            <div>
              <span><Sparkles size={15} />小意经营建议</span>
              <h2>从经营数据中发现的增长机会</h2>
            </div>
            <small>{operationSuggestions.length} 条待处理</small>
          </header>
          <div className="operations-insight-grid">
            {operationSuggestions.map((suggestion) => {
              const Icon = aiBusinessCategoryIcons[suggestion.category]
              const expanded = expandedSuggestionId === suggestion.id
              const running = runningSuggestionId === suggestion.id
              return (
                <article className={`operations-insight-card ${suggestion.tone}`} key={suggestion.id}>
                  <div className="operations-insight-title">
                    <span><Icon size={19} /></span>
                    <div><small>{aiBusinessCategoryLabels[suggestion.category]}</small><h3>{suggestion.title}</h3></div>
                  </div>
                  <p>{suggestion.summary}</p>
                  <div className="operations-insight-metrics">
                    {suggestion.metrics.map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}
                  </div>
                  <b className="operations-insight-target">{suggestion.target}</b>
                  {expanded && (
                    <div className="operations-insight-evidence">
                      {suggestion.evidence.map((item) => <p key={item}>{item}</p>)}
                    </div>
                  )}
                  <div className="operations-insight-actions">
                    <button
                      className="secondary"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpandedSuggestionId(expanded ? null : suggestion.id)}
                    >
                      查看数据依据<ChevronDown className={expanded ? 'expanded' : ''} size={15} />
                    </button>
                    <button className="primary" type="button" disabled={!!runningSuggestionId} onClick={() => generateSuggestion(suggestion.id)}>
                      {running ? <><LoaderCircle className="spin" size={15} />小意正在生成</> : <><Sparkles size={15} />{suggestion.actionLabel}</>}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <div className="operations-main-grid">
        <article className="operations-panel operations-trend-panel">
          <header><div><h2>经营趋势</h2><p>营业实收与订单量变化</p></div><span><i />营业实收<b />订单量</span></header>
          <div className="operations-line-chart" ref={trendContainerRef} onMouseLeave={() => setHoveredTrendIndex(null)}>
            <svg className="operations-line-chart-svg" viewBox={`0 0 ${trendChart.width} ${trendChart.height}`} role="img" aria-label="营业实收与订单量趋势曲线">
              <title>营业实收与订单量趋势曲线</title>
              {Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4
                const y = trendChart.plot.top + trendChart.plotHeight * ratio
                return (
                  <g key={`y-${index}`}>
                    <line className="operations-chart-gridline" x1={trendChart.plot.left} y1={y} x2={trendChart.plot.left + trendChart.plotWidth} y2={y} />
                    <text className="operations-chart-axis-label sales" x={trendChart.plot.left - 10} y={y + 4} textAnchor="end">{formatAxisMoney(trendChart.salesMax * (1 - ratio))}</text>
                    <text className="operations-chart-axis-label orders" x={trendChart.plot.left + trendChart.plotWidth + 10} y={y + 4}>{formatNumber(trendChart.ordersMax * (1 - ratio))}单</text>
                  </g>
                )
              })}
              <line className="operations-chart-axis" x1={trendChart.plot.left} y1={trendChart.plot.top} x2={trendChart.plot.left} y2={trendChart.plot.top + trendChart.plotHeight} />
              <line className="operations-chart-axis" x1={trendChart.plot.left + trendChart.plotWidth} y1={trendChart.plot.top} x2={trendChart.plot.left + trendChart.plotWidth} y2={trendChart.plot.top + trendChart.plotHeight} />
              <line className="operations-chart-axis" x1={trendChart.plot.left} y1={trendChart.plot.top + trendChart.plotHeight} x2={trendChart.plot.left + trendChart.plotWidth} y2={trendChart.plot.top + trendChart.plotHeight} />
              <path className="operations-chart-line sales" d={trendChart.salesPath} />
              <path className="operations-chart-line orders" d={trendChart.orderPath} />
              {trendChart.tickIndexes.map((index) => {
                const point = trendChart.salesPoints[index]
                return (
                <g key={`point-${trend[index].title}`}>
                  <circle className="operations-chart-point sales" cx={point.x} cy={point.y} r="3">
                    <title>{`${trend[index].title}｜营业实收 ${formatMoney(trend[index].sales)}`}</title>
                  </circle>
                  <circle className="operations-chart-point orders" cx={trendChart.orderPoints[index].x} cy={trendChart.orderPoints[index].y} r="3">
                    <title>{`${trend[index].title}｜订单 ${formatNumber(trend[index].orders)} 单｜到店 ${formatNumber(trend[index].covers)} 人`}</title>
                  </circle>
                </g>
                )
              })}
              {hoveredTrendIndex !== null && trendChart.salesPoints[hoveredTrendIndex] && (
                <g className="operations-chart-hover-marker">
                  <line x1={trendChart.salesPoints[hoveredTrendIndex].x} y1={trendChart.plot.top} x2={trendChart.salesPoints[hoveredTrendIndex].x} y2={trendChart.plot.top + trendChart.plotHeight} />
                  <circle className="sales" cx={trendChart.salesPoints[hoveredTrendIndex].x} cy={trendChart.salesPoints[hoveredTrendIndex].y} r="5" />
                  <circle className="orders" cx={trendChart.orderPoints[hoveredTrendIndex].x} cy={trendChart.orderPoints[hoveredTrendIndex].y} r="5" />
                </g>
              )}
              {trendChart.tickIndexes.map((index) => (
                <text className="operations-chart-x-label" key={`x-${trend[index].title}`} x={trendChart.salesPoints[index].x} y={trendChart.height - 15} textAnchor="middle">{trend[index].label}</text>
              ))}
              {trend.map((item, index) => {
                const currentX = trendChart.salesPoints[index].x
                const previousX = index === 0 ? trendChart.plot.left : (trendChart.salesPoints[index - 1].x + currentX) / 2
                const nextX = index === trend.length - 1 ? trendChart.plot.left + trendChart.plotWidth : (currentX + trendChart.salesPoints[index + 1].x) / 2
                return <rect className="operations-chart-hit-area" key={`hit-${item.title}`} x={previousX} y={trendChart.plot.top} width={Math.max(1, nextX - previousX)} height={trendChart.plotHeight} onMouseEnter={() => setHoveredTrendIndex(index)} />
              })}
            </svg>
            {hoveredTrendIndex !== null && trend[hoveredTrendIndex] && (
              <div
                className={`operations-chart-tooltip ${trendChart.salesPoints[hoveredTrendIndex].x < trendChart.width * 0.28 ? 'edge-start' : trendChart.salesPoints[hoveredTrendIndex].x > trendChart.width * 0.72 ? 'edge-end' : ''}`}
                style={{ left: `${(trendChart.salesPoints[hoveredTrendIndex].x / trendChart.width) * 100}%` }}
              >
                <strong>{trend[hoveredTrendIndex].title}</strong>
                <span><i className="sales" />营业实收<b>{formatMoney(trend[hoveredTrendIndex].sales)}</b></span>
                <span><i className="orders" />订单量<b>{formatNumber(trend[hoveredTrendIndex].orders)} 单</b></span>
                <span>订单均价<b>{formatMoney(trend[hoveredTrendIndex].orders ? trend[hoveredTrendIndex].sales / trend[hoveredTrendIndex].orders : 0)}</b></span>
                <span>到店人次<b>{formatNumber(trend[hoveredTrendIndex].covers)} 人</b></span>
              </div>
            )}
          </div>
        </article>

      </div>

      <div className="operations-secondary-grid">
        <article className="operations-panel">
          <header><div><h2>时段订单</h2><p>午餐、下午和晚餐订单分布，到店人次作为辅助参考</p></div></header>
          <div className="operations-bar-list compact">
            {mealRows.map(([label, orders, covers, sales]) => {
              const ratio = totals.orders ? (orders / totals.orders) * 100 : 0
              return <div key={label} title={`${label}｜${formatNumber(orders)} 单｜${formatNumber(covers)} 人｜实收 ${formatMoney(sales)}`}><span>{label}<small>{formatNumber(orders)} 单 · {formatNumber(covers)} 人</small></span><div><i style={{ width: `${ratio}%` }} /></div><strong>{ratio.toFixed(1)}%</strong></div>
            })}
          </div>
          <div className="operations-inline-stats operations-meal-stats">
            {mealRows.map(([label, _orders, covers, sales, dineInSales]) => (
              <span key={label}>{label}实收<strong>{formatMoney(sales)}</strong><small>堂食人均 {formatMoney(covers ? dineInSales / covers : 0)}</small></span>
            ))}
          </div>
        </article>

        <article className="operations-panel">
          <header><div><h2>日期类型表现</h2><p>工作日、周末和节假日的日均表现</p></div></header>
          <div className="operations-daytype-list">
            {dateTypeRows.map((item) => <div key={item.label}><span>{item.label}<small>{item.days} 天</small></span><b>{formatNumber(item.dailyOrders)} 单/日<small>{formatNumber(item.dailyCovers)} 人/日</small></b><strong>{formatMoney(item.dailySales)}</strong><em>{formatMoney(item.averageOrderValue)}/单</em></div>)}
          </div>
        </article>

        <article className="operations-panel">
          <header><div><h2>品类收入</h2><p>按菜品经营类型汇总营业实收</p></div></header>
          <div className="operations-category-list">
            {categoryRows.map(([label, sales], index) => <div key={label}><b>{index + 1}</b><span>{label}</span><strong>{formatMoney(sales)}</strong><small>{totals.sales ? ((sales / totals.sales) * 100).toFixed(1) : '0.0'}%</small></div>)}
          </div>
        </article>
      </div>

      <article className="operations-panel operations-monthly-panel">
        <header><div><h2>月度经营明细</h2><p>按自然月汇总，支持跨年同比</p></div></header>
        <div className="operations-monthly-table">
          <div><span>月份</span><span>订单笔数</span><span>营业实收</span><span>订单均价</span><span>堂食订单</span><span>到店人次</span><span>订单同比</span></div>
          {monthlyRows.map((item) => (
            <div key={item.month}>
              <span><CopyableEllipsis value={`${item.month.replace('-', '年')}月`} /></span>
              <span><CopyableEllipsis value={formatNumber(item.totals.orders)} /></span>
              <span><CopyableEllipsis value={formatMoney(item.totals.sales)} /></span>
              <span><CopyableEllipsis value={formatMoney(item.totals.orders ? item.totals.sales / item.totals.orders : 0)} /></span>
              <span><CopyableEllipsis value={formatNumber(item.totals.dineInOrders)} /></span>
              <span><CopyableEllipsis value={formatNumber(item.totals.covers)} /></span>
              <span className={item.yoy?.tone ?? 'flat'}><CopyableEllipsis value={item.yoy?.text ?? '—'} /></span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
