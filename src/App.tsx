import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowUp,
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  PinOff,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  ThumbsDown,
  ThumbsUp,
  Users,
  WalletCards,
  WandSparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ScenarioKind = '功能类' | '数据报表类' | '操作类' | '预测类'
type FindingTone = 'critical' | 'opportunity' | 'info'
type RailFocus = 'balanced' | 'common' | 'history'
type ReportArtifact = {
  title: string
  href: string
  description: string
  generatedAt: string
  range: string
  rows: Array<[string, string, string, string, string]>
}
type UsageState = {
  fixed: boolean
  useCount: number
  lastUsed: string
  order: number
  hidden: boolean
}
type HistorySession = {
  id: string
  title: string
  scenarioId: string
  prompt: string
  time: string
  summary: string
}

type Scenario = {
  id: string
  kind: ScenarioKind
  title: string
  question: string
  time: string
  icon: LucideIcon
  intro: string
  steps: Array<[string, string]>
  summary: string
  metrics?: Array<[string, string, string, 'up' | 'down' | 'flat']>
  findings: Array<{
    tone: FindingTone
    label: string
    meta: string
    title: string
    body: string
    evidence?: Array<[string, LucideIcon]>
  }>
  table?: Array<[string, string, string, string]>
  report?: ReportArtifact
  action?: {
    title: string
    body: string
    approveText: string
    rejectText: string
  }
  forecast?: Array<[string, string, string, string]>
  nextActions: string[]
  context: {
    updatedAt: string
    permissions: Array<[string, string]>
    references: Array<[string, string, LucideIcon]>
  }
}

const tools: Array<[string, LucideIcon]> = [
  ['经营概览', LayoutDashboard],
  ['订单管理', ClipboardList],
  ['商品管理', Package],
  ['外卖团购', ShoppingBag],
  ['会员营销', Users],
  ['收款对账', WalletCards],
]

const reportScenarioId = 'report-channel-persisted'
const pinnedReportKey = 'shengyitong:pinned-report:channel-profit'
const pinnedReportEvent = 'shengyitong:pinned-report-changed'
const channelReport: ReportArtifact = {
  title: '近7天渠道毛利与退款分析报表',
  href: '#/reports/channel-profit',
  description: '按堂食、小程序、美团外卖、淘宝闪购拆分收入、毛利、退款和异常原因，可作为经营例会的固定报表持续查看。',
  generatedAt: '今天 10:48',
  range: '2026.09.05 - 2026.09.11',
  rows: [
    ['堂食', '¥32,680', '64.1%', '0.6%', '稳定，午高峰提前但退款低'],
    ['小程序', '¥12,930', '66.8%', '0.4%', '会员复购贡献高，券成本可控'],
    ['美团外卖', '¥24,760', '58.7%', '1.8%', '满减拉低毛利，打包费覆盖不足'],
    ['淘宝闪购', '¥19,420', '55.9%', '3.1%', '售罄同步延迟造成缺货退款'],
  ],
}

const scenarios: Scenario[] = [
  {
    id: 'operation-sync',
    kind: '操作类',
    title: '同步平台售罄状态',
    question: '把淘宝闪购上“青提茉莉”同步为售罄，并告诉我是否会影响美团和小程序。',
    time: '刚刚',
    icon: ShieldCheck,
    intro: '我会先校验商品映射、库存口径和平台权限，再生成可审批的操作方案。涉及平台上下架，不会在你批准前执行。',
    steps: [
      ['读取商品映射', '本地 SKU 10038 对应淘宝闪购 SPU 88721，美团映射独立'],
      ['核对库存与售罄日志', '门店小程序 09:26 标记售罄，后厨库存为 0'],
      ['检查操作影响范围', '仅影响淘宝闪购杭州西湖店，不改美团、不改堂食'],
    ],
    summary: '这是一个低范围、高确定性的操作。当前问题来自淘宝闪购商品状态未同步，建议只对该渠道执行售罄同步，并写入操作日志。',
    findings: [
      {
        tone: 'critical',
        label: '需要处理',
        meta: '高置信度 · 5 条证据',
        title: '淘宝闪购仍保持可售，已造成 3 笔缺货退款',
        body: '09:30 至 10:00 共发生 3 笔退款，金额 ¥86.50。本地和小程序均已售罄，平台状态存在延迟或同步失败。',
        evidence: [
          ['3 笔退款订单', FileText],
          ['商品映射记录', Database],
          ['售罄日志', Package],
        ],
      },
      {
        tone: 'info',
        label: '影响边界',
        meta: '已隔离渠道',
        title: '美团、小程序和堂食渠道不受影响',
        body: '商品映射表显示各渠道使用独立平台商品 ID。本次操作只调用淘宝闪购商品状态接口，不触发全渠道下架。',
      },
    ],
    action: {
      title: '需要批准',
      body: '向淘宝闪购重新同步“青提茉莉”为售罄；执行后查询平台状态并写入操作日志。',
      approveText: '批准执行',
      rejectText: '暂不处理',
    },
    nextActions: ['执行后复查平台状态', '通知当班员工检查平台后台', '把本次同步失败计入接口健康度'],
    context: {
      updatedAt: '10:45',
      permissions: [
        ['可读取', '订单、商品、库存、平台映射'],
        ['需批准', '商品上下架、批量改价、退款'],
        ['禁止', '跨店操作、绕过审批、直接改账'],
      ],
      references: [
        ['商品渠道映射规则', '每 5 分钟自动校验', Database],
        ['高风险操作审批 SOP', '版本 2026.09.11', ShieldCheck],
      ],
    },
  },
  {
    id: reportScenarioId,
    kind: '数据报表类',
    title: '获取渠道毛利退款报表',
    question: '帮我获取近7天各渠道毛利和退款报表，判断异常原因，并生成一个以后可以持续查看的报表。',
    time: '刚刚',
    icon: FileText,
    intro: '我会先确认报表口径和数据来源，再判断异常项，最后生成一个可持久查看的经营报表。',
    steps: [
      ['确认报表口径', '按支付实收、菜品成本、平台活动成本和退款原因统一口径'],
      ['拉取渠道数据', '已读取堂食、小程序、美团外卖、淘宝闪购近 7 天订单与退款'],
      ['判断异常原因', '对比历史同周期，识别毛利偏低和退款偏高渠道'],
      ['生成可持久报表', '报表已保存为独立页面，可后续从常用功能进入'],
    ],
    summary: '已生成“近7天渠道毛利与退款分析报表”。主要结论是淘宝闪购退款率偏高，美团外卖毛利被满减活动压低；堂食和小程序表现稳定，可作为基准渠道。',
    metrics: [
      ['总实收', '¥89,790', '+8.7%', 'up'],
      ['综合毛利率', '60.4%', '-2.8%', 'down'],
      ['退款率', '1.7%', '+0.6%', 'down'],
      ['异常渠道', '2 个', '需复盘', 'flat'],
    ],
    findings: [
      {
        tone: 'critical',
        label: '异常判断',
        meta: '淘宝闪购退款率 3.1%',
        title: '售罄同步延迟是退款升高的主因',
        body: '淘宝闪购近 7 天退款率高于其它渠道，退款原因集中在缺货和超时取消。其中青提茉莉售罄状态同步延迟贡献了主要异常。',
        evidence: [
          ['退款原因明细', FileText],
          ['渠道商品映射', Database],
        ],
      },
      {
        tone: 'opportunity',
        label: '经营判断',
        meta: '美团毛利率 58.7%',
        title: '外卖满减活动需要重算真实毛利',
        body: '美团外卖订单量增长明显，但活动补贴和打包材料成本导致毛利低于堂食 5.4 个百分点。建议把满减后的单品毛利作为活动复盘口径。',
      },
    ],
    table: [
      ['堂食', '¥32,680', '64.1%', '稳定'],
      ['小程序', '¥12,930', '66.8%', '稳定'],
      ['美团外卖', '¥24,760', '58.7%', '毛利偏低'],
      ['淘宝闪购', '¥19,420', '55.9%', '退款偏高'],
    ],
    report: channelReport,
    nextActions: ['固定该报表到常用功能', '复盘淘宝闪购售罄同步', '重算美团满减活动毛利'],
    context: {
      updatedAt: '10:48',
      permissions: [
        ['可读取', '订单、支付、退款、活动成本'],
        ['可生成', '渠道毛利报表、退款分析报表'],
        ['需批准', '导出明细、调整活动、同步平台状态'],
      ],
      references: [
        ['渠道毛利口径', '活动成本与平台佣金', FileText],
        ['退款原因字段', '美团、淘宝闪购', ShoppingBag],
      ],
    },
  },
  {
    id: 'report-profit',
    kind: '数据报表类',
    title: '看今日经营报表',
    question: '今天到现在营业情况怎么样？帮我看收入、毛利、退款和外卖渠道有没有异常。',
    time: '10 分钟前',
    icon: BarChart3,
    intro: '我会按“经营结果、异常波动、原因证据、建议动作”的顺序输出，先给结论，再展开明细。',
    steps: [
      ['汇总交易流水', '聚合支付、堂食订单、外卖订单已对齐到门店时区'],
      ['计算毛利口径', '按菜品配方成本和原料最新入库价估算'],
      ['检测异常项', '对比过去 4 个同星期、同天气、同活动日样本'],
    ],
    summary: '今天截至 10:45，实收增长 9.4%，但退款率和午前出餐压力偏高。毛利率下降主要来自外卖平台满减和两款高销量低毛利商品。',
    metrics: [
      ['实收金额', '¥12,846', '+9.4%', 'up'],
      ['预估毛利率', '61.8%', '-3.1%', 'down'],
      ['退款金额', '¥126', '+42.8%', 'down'],
      ['外卖占比', '48.5%', '+7.6%', 'up'],
    ],
    findings: [
      {
        tone: 'critical',
        label: '异常波动',
        meta: '退款率 1.1% -> 2.4%',
        title: '淘宝闪购缺货退款拉高退款率',
        body: '退款集中在“青提茉莉”和“牛油果轻食杯”。其中青提茉莉是平台售罄状态未同步，牛油果轻食杯是出餐超时取消。',
        evidence: [
          ['退款明细', FileText],
          ['外卖订单', ShoppingBag],
        ],
      },
      {
        tone: 'opportunity',
        label: '经营机会',
        meta: '近 28 天样本',
        title: '午高峰开始时间提前约 20 分钟',
        body: '11:10 至 11:40 的订单占比上升 14%。如果 11:00 前补 1 人备餐，预计可减少 6 至 9 分钟平均等待。',
      },
    ],
    table: [
      ['堂食', '¥4,820', '63.2%', '稳定'],
      ['小程序', '¥1,798', '66.5%', '会员券成本偏低'],
      ['美团外卖', '¥3,416', '59.1%', '满减成本偏高'],
      ['淘宝闪购', '¥2,812', '56.8%', '退款异常'],
    ],
    nextActions: ['先处理淘宝闪购售罄同步', '把低毛利套餐放入明日复盘', '午高峰增加 1 名备餐人手'],
    context: {
      updatedAt: '10:45',
      permissions: [
        ['可读取', '订单、支付、退款、菜品成本'],
        ['可生成', '日报、毛利分析、渠道对比'],
        ['需批准', '导出全量明细、调整营销活动'],
      ],
      references: [
        ['轻餐经营指标口径', '收入、毛利、退款', FileText],
        ['外卖平台账单字段', '美团、淘宝闪购', ShoppingBag],
      ],
    },
  },
  {
    id: 'function-member',
    kind: '功能类',
    title: '了解会员储值能力',
    question: '我们会员储值功能怎么用？能不能支持充值赠送、消费扣款、退款回退和对账？',
    time: '今天',
    icon: ClipboardCheck,
    intro: '我会按“能做什么、从哪里配置、会影响哪些账、哪些动作要审批”来回答。功能类问题更适合用结构化说明，不直接执行。',
    steps: [
      ['定位业务模块', '会员中心、收款对账、退款中心、营销活动'],
      ['检查当前门店配置', '杭州西湖店已开启储值，但未启用充值赠送规则'],
      ['匹配一期能力边界', '支持基础储值闭环，高级分层权益进入二期'],
    ],
    summary: '一期可以覆盖会员储值的最小闭环：充值、赠送、消费、退款回退、储值流水、门店对账。建议先把赠送规则做成模板，避免一线员工手工填写。',
    findings: [
      {
        tone: 'info',
        label: '功能说明',
        meta: '一期可做',
        title: '储值账户要拆成本金账户和赠送账户',
        body: '充值入本金，赠送入赠送账户。消费时可按规则优先扣赠送或按比例扣减，退款时按原支付构成回退。',
        evidence: [
          ['会员账户', Users],
          ['储值流水', WalletCards],
          ['退款规则', FileText],
        ],
      },
      {
        tone: 'opportunity',
        label: '产品建议',
        meta: '减少配置错误',
        title: '充值赠送规则建议模板化',
        body: '例如“充 200 送 20”“充 500 送 80”，由老板配置后发布到门店。收银端只选择模板，不允许临时改赠送金额。',
      },
    ],
    table: [
      ['充值', '收银端、老板后台', '需记录支付单和储值流水', '一期'],
      ['消费扣款', 'POS、小程序', '按账户规则自动拆分', '一期'],
      ['退款回退', '退款中心', '原路回退储值账户', '一期'],
      ['会员分层权益', '会员中心', '按等级自动权益', '二期'],
    ],
    nextActions: ['配置充值赠送模板', '开启储值退款回退规则', '每日生成储值余额对账表'],
    context: {
      updatedAt: '09:58',
      permissions: [
        ['可读取', '会员配置、储值流水、退款记录'],
        ['可生成', '功能说明、配置指引、规则草案'],
        ['需批准', '发布储值活动、修改余额'],
      ],
      references: [
        ['会员储值一期设计', '本金/赠送账户拆分', Users],
        ['财务对账规则', '储值余额与实收分离', WalletCards],
      ],
    },
  },
  {
    id: 'forecast-schedule',
    kind: '预测类',
    title: '预测下周排班备货',
    question: '根据最近经营状况，帮我安排下周排班和备货，重点看午高峰和外卖爆单风险。',
    time: '昨天',
    icon: CalendarClock,
    intro: '我会先预测客流和渠道结构，再把建议转换成排班和备货草案。预测类回答必须展示区间、置信度和触发条件。',
    steps: [
      ['读取历史样本', '近 8 周订单、天气、活动、节假日和外卖曝光数据'],
      ['预测分时客流', '按 30 分钟粒度生成堂食、小程序、外卖需求'],
      ['生成约束方案', '结合员工技能、工时上限、原料保质期和库存'],
    ],
    summary: '下周工作日午高峰会继续提前，周五和周六外卖爆单风险较高。建议把备餐岗从 11:30 前移到 11:00，并把青提、牛油果、鸡胸肉设置安全库存。',
    metrics: [
      ['周销量预测', '2,860 单', '+8% 至 +13%', 'up'],
      ['午高峰峰值', '112 单/小时', '+16%', 'up'],
      ['爆单风险', '周五 18:00', '中高', 'down'],
      ['缺货风险', '3 个 SKU', '可控', 'flat'],
    ],
    findings: [
      {
        tone: 'opportunity',
        label: '排班建议',
        meta: '置信度 78%',
        title: '工作日 11:00 前需要 2 人进入备餐状态',
        body: '近期午高峰订单提前，若仍按 11:30 增员，预计平均等待会增加 7 分钟。建议 1 名前台兼打包，1 名后厨提前备料。',
      },
      {
        tone: 'critical',
        label: '备货风险',
        meta: '置信度 72%',
        title: '青提和牛油果需要设置安全库存',
        body: '青提茉莉连续 3 天在 10:30 前消耗超过 70%，牛油果轻食杯受外卖活动拉动明显，建议按预测上限备货。',
      },
    ],
    forecast: [
      ['周一至周四', '10:50-13:20', '2 后厨 + 1 前台', '常规备货 +10%'],
      ['周五', '10:50-13:30 / 17:30-19:30', '3 后厨 + 1 前台', '青提、牛油果 +18%'],
      ['周六', '11:00-14:00', '3 后厨 + 2 前台', '轻食杯 +22%'],
      ['周日', '11:30-13:30', '2 后厨 + 1 前台', '按常规备货'],
    ],
    action: {
      title: '可生成草案',
      body: '生成下周排班草案和采购建议单。生成后需要店长确认，系统不会直接发布班表或创建采购单。',
      approveText: '生成草案',
      rejectText: '先不生成',
    },
    nextActions: ['生成下周排班草案', '生成采购建议单', '把预测偏差纳入下周复盘'],
    context: {
      updatedAt: '昨日 23:00',
      permissions: [
        ['可读取', '订单趋势、员工技能、库存、天气'],
        ['可生成', '排班草案、采购建议、风险提示'],
        ['需批准', '发布班表、创建采购单、通知员工'],
      ],
      references: [
        ['排班约束规则', '工时、技能、岗位', CalendarClock],
        ['预测模型口径', '销量区间与置信度', Gauge],
      ],
    },
  },
]

const sourceList: Array<[string, LucideIcon]> = [
  ['订单中心', ClipboardList],
  ['聚合支付', CircleDollarSign],
  ['美团外卖', ShoppingBag],
  ['淘宝闪购', ShoppingBag],
]

const defaultUsage: Record<string, UsageState> = {
  'operation-sync': { fixed: true, useCount: 12, lastUsed: '今天 10:45', order: 45, hidden: false },
  'report-profit': { fixed: true, useCount: 9, lastUsed: '今天 10:31', order: 31, hidden: false },
  'forecast-schedule': { fixed: false, useCount: 5, lastUsed: '昨天 23:00', order: 14, hidden: false },
  'function-member': { fixed: true, useCount: 3, lastUsed: '9月10日', order: 8, hidden: false },
  [reportScenarioId]: { fixed: false, useCount: 0, lastUsed: '', order: 3, hidden: true },
}

const isReportPinned = () => window.localStorage.getItem(pinnedReportKey) === 'true'

const broadcastPinnedReportChange = () => {
  window.dispatchEvent(new Event(pinnedReportEvent))
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(pinnedReportEvent)
  channel.postMessage({ type: pinnedReportEvent })
  channel.close()
}

const getInitialUsage = (): Record<string, UsageState> => {
  const pinned = isReportPinned()
  return {
    ...defaultUsage,
    [reportScenarioId]: {
      ...defaultUsage[reportScenarioId],
      fixed: pinned,
      useCount: pinned ? 1 : 0,
      lastUsed: pinned ? '已固定' : '',
      order: pinned ? 80 : defaultUsage[reportScenarioId].order,
      hidden: !pinned,
    },
  }
}

const historySessions: HistorySession[] = [
  {
    id: 'history-report-artifact',
    title: '近7天渠道毛利与退款分析报表',
    scenarioId: reportScenarioId,
    prompt: '帮我获取近7天各渠道毛利和退款报表，判断异常原因，并生成一个以后可以持续查看的报表。',
    time: '刚刚',
    summary: '已生成可持久查看的渠道经营报表',
  },
  {
    id: 'history-1',
    title: '复盘淘宝闪购退款',
    scenarioId: 'operation-sync',
    prompt: '帮我复盘今天上午淘宝闪购退款为什么变多，需要我现在处理什么？',
    time: '刚刚',
    summary: '定位到青提茉莉售罄状态未同步',
  },
  {
    id: 'history-2',
    title: '今日毛利和渠道报表',
    scenarioId: 'report-profit',
    prompt: '今天到现在的毛利和外卖渠道表现如何？把异常项先列出来。',
    time: '10 分钟前',
    summary: '外卖占比上升，毛利率被满减拉低',
  },
  {
    id: 'history-3',
    title: '下周排班和备货草案',
    scenarioId: 'forecast-schedule',
    prompt: '根据最近经营状况，为我安排下周排班和备货。',
    time: '昨天',
    summary: '午高峰提前，周五晚高峰风险较高',
  },
  {
    id: 'history-4',
    title: '会员储值一期边界',
    scenarioId: 'function-member',
    prompt: '会员储值一期应该支持哪些功能？哪些必须进二期？',
    time: '9月10日',
    summary: '一期覆盖充值、消费扣款、退款回退和对账',
  },
  {
    id: 'history-5',
    title: '低毛利套餐优化',
    scenarioId: 'report-profit',
    prompt: '找一下最近一周低毛利但销量高的套餐，给我调整建议。',
    time: '9月9日',
    summary: '两款外卖套餐需要重算满减后毛利',
  },
]

const randomSuggestionIds = () => [...scenarios]
  .sort(() => Math.random() - 0.5)
  .slice(0, 2)
  .map((scenario) => scenario.id)

function ReportPage({ report, pinned, onPin }: { report: ReportArtifact; pinned: boolean; onPin: () => void }) {
  const summaryCards = [
    { label: '总实收', value: '¥89,790', detail: '较上期 +8.7%', tone: 'up' },
    { label: '综合毛利率', value: '60.4%', detail: '较上期 -2.8%', tone: 'down' },
    { label: '退款率', value: '1.7%', detail: '淘宝闪购偏高', tone: 'warn' },
    { label: '需复盘渠道', value: '2 个', detail: '美团、淘宝闪购', tone: 'alert' },
  ]
  const channels = [
    ['堂食', '36.4%', '¥32,680', 'blue'],
    ['小程序', '14.4%', '¥12,930', 'green'],
    ['美团外卖', '27.6%', '¥24,760', 'yellow'],
    ['淘宝闪购', '21.6%', '¥19,420', 'orange'],
  ]

  return (
    <div className="report-page">
      <header className="report-topbar">
        <div className="report-brand">
          <img className="report-robot-logo" src="/shengyitong-robot-logo.png" alt="" />
          <div className="report-brand-copy">
            <img className="report-text-logo" src="/shengyitong-text-logo.png" alt="盛意通" />
            <small>AI经营平台</small>
          </div>
        </div>
        <div className="report-top-title">
          <strong>{report.title}</strong>
          <small>{report.range} · {report.generatedAt} 生成</small>
        </div>
        <button className="report-pin-button" disabled={pinned} onClick={onPin}>
          <Pin size={15} />
          {pinned ? '已固定到常用功能' : '固定到常用功能'}
        </button>
      </header>

      <main className="report-canvas">
        <section className="report-hero">
          <div>
            <p>经营报表</p>
            <h1>{report.title}</h1>
            <span>{report.description}</span>
          </div>
        </section>

        <section className="report-summary-grid">
          {summaryCards.map(({ label, value, detail, tone }) => (
            <div className={`report-metric ${tone}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </section>

        <section className="report-main-grid">
          <div className="report-card report-table-card" id="detail">
            <div className="report-section-head">
              <div>
                <div>
                  <h2>收入、毛利与退款判断</h2>
                  <p>各渠道经营数据对比，识别盈利能力与退款风险。</p>
                </div>
              </div>
              <small>口径：支付实收 - 菜品成本 - 平台活动成本</small>
            </div>
            <div className="report-table" role="table" aria-label={report.title}>
              <div role="row"><span>渠道</span><span>实收</span><span>毛利率</span><span>退款率</span><span>判断</span></div>
              {report.rows.map((row) => (
                <div role="row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>
              ))}
            </div>
          </div>

          <aside className="report-card report-channel-card">
            <div className="report-section-head compact">
              <div>
                <h2>渠道实收结构</h2>
              </div>
              <button type="button" onClick={() => document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>查看详情</button>
            </div>
            <div className="donut-wrap">
              <div className="channel-list">
                {channels.map(([name, percent, amount, color]) => (
                  <div key={name}>
                    <i className={`dot ${color}`} />
                    <span>{name}</span>
                    <b>{percent}</b>
                    <em>{amount}</em>
                  </div>
                ))}
              </div>
            </div>
            <p className="report-tip">堂食仍是第一大收入来源，线上渠道合计占比 63.6%，需持续优化线上毛利与退款。</p>
          </aside>
        </section>

        <section className="report-bottom-card">
          <div>
            <span>异常判断</span>
            <strong>淘宝闪购退款率偏高，美团外卖毛利偏低</strong>
            <p>退款异常优先来自售罄状态同步延迟，毛利下滑主要由满减活动和打包材料成本共同造成。建议将这张报表固定为每周经营例会入口，持续追踪渠道质量。</p>
          </div>
          <div className="report-actions">
            <span>建议行动</span>
            <ol>
              <li>优化淘宝闪购的库存同步与售罄策略，降低退款率</li>
              <li>复盘美团外卖活动策略与打包成本，提升毛利水平</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState(scenarios[0].id)
  const [prompt, setPrompt] = useState('')
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [toast, setToast] = useState('')
  const [usage, setUsage] = useState(getInitialUsage)
  const [suggestionIds, setSuggestionIds] = useState(randomSuggestionIds)
  const [railFocus, setRailFocus] = useState<RailFocus>('balanced')
  const [reportPinned, setReportPinned] = useState(isReportPinned)

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0],
    [activeId],
  )
  const reportScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === reportScenarioId) ?? scenarios[0],
    [],
  )
  const sentPrompt = customPrompt || (activeHistoryId === null ? '' : activeScenario.question)
  const commonScenarios = useMemo(
    () => scenarios
      .filter((scenario) => scenario.id !== reportScenarioId)
      .filter((scenario) => {
        const item = usage[scenario.id]
        return item && !item.hidden && (item.fixed || item.useCount >= 4)
      })
      .sort((left, right) => usage[right.id].order - usage[left.id].order),
    [usage],
  )

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const syncPinnedReport = () => {
    const pinned = isReportPinned()
    setReportPinned(pinned)
    setUsage((current) => ({
      ...current,
      [reportScenarioId]: {
        ...(current[reportScenarioId] ?? defaultUsage[reportScenarioId]),
        fixed: pinned,
        useCount: pinned ? Math.max(current[reportScenarioId]?.useCount ?? 0, 1) : 0,
        lastUsed: pinned ? '已固定' : '',
        order: pinned ? Math.max(...Object.values(current).map((item) => item.order), 80) : defaultUsage[reportScenarioId].order,
        hidden: !pinned,
      },
    }))
  }

  useEffect(() => {
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(pinnedReportEvent)
    const sync = () => syncPinnedReport()
    channel?.addEventListener('message', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    window.addEventListener(pinnedReportEvent, sync)
    document.addEventListener('visibilitychange', sync)
    const timer = window.setInterval(sync, 1000)
    sync()
    return () => {
      channel?.removeEventListener('message', sync)
      channel?.close()
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
      window.removeEventListener(pinnedReportEvent, sync)
      document.removeEventListener('visibilitychange', sync)
      window.clearInterval(timer)
    }
  }, [])

  const pinReportToCommon = () => {
    window.localStorage.setItem(pinnedReportKey, 'true')
    syncPinnedReport()
    broadcastPinnedReportChange()
    notify('已固定到常用功能')
  }

  const openScenario = (scenario: Scenario) => {
    setActiveId(scenario.id)
    setCustomPrompt(scenario.question)
    setActiveHistoryId(null)
    setApproved(false)
    setLeftOpen(false)
    setUsage((current) => ({
      ...current,
      [scenario.id]: {
        ...(current[scenario.id] ?? { fixed: false, useCount: 0, lastUsed: '', order: 0, hidden: false }),
        useCount: (current[scenario.id]?.useCount ?? 0) + 1,
        lastUsed: '刚刚',
        order: Math.max(...Object.values(current).map((item) => item.order)) + 1,
      },
    }))
    notify(`已切换：${scenario.title}`)
  }

  const unpinScenario = (scenario: Scenario) => {
    if (scenario.id === reportScenarioId) {
      window.localStorage.removeItem(pinnedReportKey)
      broadcastPinnedReportChange()
    }
    setUsage((current) => ({
      ...current,
      [scenario.id]: {
        ...(current[scenario.id] ?? { fixed: false, useCount: 0, lastUsed: '', order: 0, hidden: false }),
        fixed: false,
        hidden: true,
      },
    }))
    if (scenario.id === activeScenario.id) {
      const fallback = commonScenarios.find((item) => item.id !== scenario.id) ?? scenarios[0]
      setActiveId(fallback.id)
    }
    notify(`已移出常用功能：${scenario.title}`)
  }

  const openHistorySession = (session: HistorySession) => {
    setActiveId(session.scenarioId)
    setCustomPrompt(session.prompt)
    setActiveHistoryId(session.id)
    setApproved(false)
    setLeftOpen(false)
    notify(`已加载历史会话：${session.title}`)
  }

  const startNewSession = (message: string) => {
    const nextPrompt = message.trim()
    if (!nextPrompt) return
    setCustomPrompt(nextPrompt)
    setActiveHistoryId(null)
    setApproved(false)
    setLeftOpen(false)
    notify('新会话已开始')
  }

  const createNewSession = () => {
    setCustomPrompt('')
    setActiveHistoryId(null)
    setApproved(false)
    setPrompt('')
    setSuggestionIds(randomSuggestionIds())
    setLeftOpen(false)
    notify('已新建会话，请在下方输入问题')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!prompt.trim()) return
    startNewSession(prompt)
    setPrompt('')
  }

  if (window.location.hash === '#/reports/channel-profit') {
    return (
      <>
        <ReportPage report={channelReport} pinned={reportPinned} onPin={pinReportToCommon} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </>
    )
  }

  return (
    <div className={`ai-shell ${rightOpen ? '' : 'without-context'}`}>
      <aside className={`left-rail ${leftOpen ? 'is-open' : ''}`}>
        <div className="brand-row">
          <span className="brand-mark"><img src="/shengyitong-robot-logo.png" alt="盛意通" /></span>
          <div className="brand-copy">
            <img className="brand-text-logo" src="/shengyitong-text-logo.png" alt="盛意通" />
            <small>AI经营平台</small>
          </div>
          <button className="icon-btn close-mobile" aria-label="关闭菜单" onClick={() => setLeftOpen(false)}><X size={19} /></button>
        </div>
        <button className="new-task" onClick={createNewSession}><Plus size={17} />新增会话</button>
        <div className={`rail-workspace focus-${railFocus}`}>
          <section className="rail-block compact">
            <div className="rail-section-head">
              <p className="rail-label">常用功能</p>
              <button
                className="rail-more-button"
                aria-pressed={railFocus === 'common'}
                onClick={() => setRailFocus((current) => current === 'common' ? 'balanced' : 'common')}
              >
                查看更多
              </button>
            </div>
            <div className="rail-search"><Search size={15} /><input aria-label="搜索常用功能" placeholder="搜索常用功能" /></div>
            <div className="rail-scroll">
              {reportPinned && (
                <div className={`task-link-row report-task-row ${reportScenario.id === activeScenario.id ? 'active' : ''}`}>
                  <button className="task-link" onClick={() => openScenario(reportScenario)}>
                    <FileText size={15} />
                    <span>{channelReport.title}<small>已固定 · 可持久报表</small></span>
                  </button>
                  <button className="pin-button" title="取消固定" aria-label={`取消固定${channelReport.title}`} onClick={() => unpinScenario(reportScenario)}><PinOff size={14} /></button>
                </div>
              )}
              {commonScenarios.map((scenario) => {
                const Icon = scenario.icon
                const item = usage[scenario.id]
                return (
                  <div className={`task-link-row ${scenario.id === activeScenario.id ? 'active' : ''}`} key={scenario.id}>
                    <button className="task-link" onClick={() => openScenario(scenario)}>
                      <Icon size={15} />
                      <span>{scenario.title}<small>{item.lastUsed} · {item.fixed ? '手动固定' : '高频自动'}</small></span>
                    </button>
                    <button className="pin-button" title="取消固定" aria-label={`取消固定${scenario.title}`} onClick={() => unpinScenario(scenario)}><PinOff size={14} /></button>
                  </div>
                )
              })}
            </div>
          </section>
          <section className="rail-block history">
            <div className="rail-section-head">
              <p className="rail-label">历史会话</p>
              <button
                className="rail-more-button"
                aria-pressed={railFocus === 'history'}
                onClick={() => setRailFocus((current) => current === 'history' ? 'balanced' : 'history')}
              >
                查看更多
              </button>
            </div>
            <div className="rail-scroll">
              {historySessions.map((session) => (
                <button className={`history-link ${session.id === activeHistoryId ? 'active' : ''}`} key={session.id} onClick={() => openHistorySession(session)}>
                  <MessageSquare size={15} />
                  <span>{session.title}<small>{session.time} · {session.summary}</small></span>
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="rail-footer">
          <div className="account"><span>林</span><div><strong>林店长</strong><small>杭州西湖店</small></div></div>
        </div>
      </aside>

      <div className="conversation">
        <header className="conversation-bar">
          <div>
            <button className="icon-btn open-mobile" aria-label="打开菜单" onClick={() => setLeftOpen(true)}><Menu size={19} /></button>
            <button className="store-button"><MessageSquare size={16} /><span>{sentPrompt ? activeScenario.title : '新会话'}</span><ChevronDown size={14} /></button>
          </div>
          <div>
            <button className="store-button context-store"><Store size={16} /><span>杭州西湖店</span><ChevronDown size={14} /></button>
            <button className="icon-btn" title="通知" aria-label="通知"><Bell size={18} /></button>
            <button className="icon-btn" title={rightOpen ? '收起基础功能' : '展开基础功能'} aria-label={rightOpen ? '收起基础功能' : '展开基础功能'} onClick={() => setRightOpen(!rightOpen)}>
              {rightOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
            </button>
          </div>
        </header>

        <main className="thread">
          {!sentPrompt && (
            <div className="thread-title">
              <div className="agent-symbol"><Sparkles size={20} /></div>
              <div><h1>今天想先处理什么？</h1></div>
            </div>
          )}

          {sentPrompt ? (
            <>
          <section className="message user-message">
            <div className="message-body"><p>{sentPrompt}</p></div>
          </section>

          <section className="message assistant-message">
            <div className="agent-content">
              <div className="answer-head">
                <span>{activeScenario.kind}</span>
              </div>
              <p>{activeScenario.intro}</p>

              <div className="execution-log">
                {activeScenario.steps.map(([title, detail]) => (
                  <div key={title}><span><Check size={14} /></span><div><strong>{title}</strong><small>{detail}</small></div></div>
                ))}
              </div>

              <div className="answer-summary">
                <WandSparkles size={18} />
                <p>{activeScenario.summary}</p>
              </div>

              {activeScenario.report && (
                <div className="report-link-card">
                  <FileText size={18} />
                  <div>
                    <span>已生成报表</span>
                    <a href={activeScenario.report.href} target="_blank" rel="noreferrer">
                      {activeScenario.report.title}
                      <ExternalLink size={14} />
                    </a>
                    <p>{activeScenario.report.description}</p>
                  </div>
                </div>
              )}

              {activeScenario.metrics && (
                <div className="metric-strip">
                  {activeScenario.metrics.map(([label, value, delta, trend]) => (
                    <div key={label}><span>{label}</span><strong>{value}</strong><small className={trend}>{delta}</small></div>
                  ))}
                </div>
              )}

              {activeScenario.findings.map((finding) => (
                <div className={`finding ${finding.tone}`} key={finding.title}>
                  <div className="finding-head"><span>{finding.label}</span><small>{finding.meta}</small></div>
                  <h2>{finding.title}</h2>
                  <p>{finding.body}</p>
                  {finding.evidence && (
                    <div className="evidence-row">
                      {finding.evidence.map(([label, Icon]) => (
                        <button key={label} onClick={() => notify(`已打开：${label}`)}><Icon size={15} />{label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {activeScenario.table && (
                <div className="data-table" role="table" aria-label="分析明细">
                  <div role="row"><span>项目</span><span>结果</span><span>口径</span><span>状态</span></div>
                  {activeScenario.table.map((row) => (
                    <div role="row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>
                  ))}
                </div>
              )}

              {activeScenario.forecast && (
                <div className="forecast-list">
                  {activeScenario.forecast.map(([day, peak, people, stock]) => (
                    <div key={day}>
                      <strong>{day}</strong>
                      <span>{peak}</span>
                      <span>{people}</span>
                      <span>{stock}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeScenario.action && (
                <div className={`approval ${approved ? 'approved' : ''}`}>
                  <div className="approval-icon">{approved ? <Check size={18} /> : <ShieldCheck size={18} />}</div>
                  <div><strong>{approved ? '已确认，正在处理' : activeScenario.action.title}</strong><p>{activeScenario.action.body}</p></div>
                  <div className="approval-actions">
                    {!approved && <button className="ghost-button" onClick={() => notify('已保留建议，未执行')}>{activeScenario.action.rejectText}</button>}
                    <button className="primary-button" disabled={approved} onClick={() => { setApproved(true); notify('已确认，任务进入执行队列') }}>{approved ? '执行中' : activeScenario.action.approveText}</button>
                  </div>
                </div>
              )}

              <div className="next-actions">
                <strong>建议下一步</strong>
                {activeScenario.nextActions.map((item) => <button key={item} onClick={() => notify(`已加入待办：${item}`)}>{item}</button>)}
              </div>

              <div className="feedback-bar">
                <span>回答反馈</span>
                <button className="icon-btn" title="有帮助" aria-label="有帮助" onClick={() => notify('感谢反馈：有帮助')}><ThumbsUp size={16} /></button>
                <button className="icon-btn" title="不准确" aria-label="不准确" onClick={() => notify('已记录：需要重新核验')}><ThumbsDown size={16} /></button>
                <button className="ghost-button" onClick={() => notify('已要求补充原始证据')}>补充证据</button>
              </div>
            </div>
          </section>
            </>
          ) : (
            <section className="empty-chat">
              <div>
                <p>可以直接输入一个经营目标，也可以从左侧常用功能或历史会话开始。</p>
              </div>
            </section>
          )}
        </main>

        <div className="composer-wrap">
          {!sentPrompt && (
            <>
              <div className="composer-title"><span>新会话</span><small>可以追问、改目标，或临时发起一个经营任务</small></div>
              <div className="suggestions">
                {scenarios
                  .filter((item) => suggestionIds.includes(item.id))
                  .map((item) => <button key={item.id} onClick={() => setPrompt(item.question)}>{item.question}</button>)}
              </div>
            </>
          )}
          <form className="composer" onSubmit={submit}>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="交代一个经营任务，或继续追问…" aria-label="输入经营任务" rows={2} />
            <div className="composer-meta">
              <span />
              <button className="send-button" aria-label="发送" disabled={!prompt.trim()}><ArrowUp size={18} /></button>
            </div>
          </form>
          <p className="disclaimer">AI 可能出错。关键经营决策请结合原始单据确认。</p>
        </div>
      </div>

      {rightOpen && (
        <aside className="context-panel">
          <div className="context-head">
            <div><p>基础功能</p><strong>业务系统</strong></div>
            <button className="icon-btn" aria-label="关闭基础功能" onClick={() => setRightOpen(false)}><X size={18} /></button>
          </div>
          <section>
            <div className="context-title"><span>基础功能</span><small>点击进入</small></div>
            <div className="context-tools">
              {tools.map(([name, Icon]) => (
                <button key={name} onClick={() => notify(`正在进入${name}`)}><Icon size={16} /><span>{name}</span></button>
              ))}
            </div>
          </section>
          <section>
            <div className="context-title"><span>今日经营</span><small>{activeScenario.context.updatedAt} 更新</small></div>
            <div className="mini-metrics">
              {[
                ['营业收入', '¥12,846', '+12.6%', 'up'],
                ['有效订单', '386', '+31', 'up'],
                ['退款金额', '¥126', '+42.8%', 'down'],
                ['新增会员', '42', '+18.2%', 'up'],
              ].map(([label, value, delta, trend]) => <div key={label}><span>{label}</span><strong>{value}</strong><small className={trend}>{delta}</small></div>)}
            </div>
            <div className="sparkline">{[27, 21, 32, 45, 59, 71, 89, 76, 62, 81].map((height, index) => <i key={index} className={index === 7 ? 'hot' : ''} style={{ height: `${height}%` }} />)}</div>
          </section>
          <section>
            <div className="context-title"><span>数据来源</span><button>管理</button></div>
            <div className="source-list">
              {sourceList.map(([name, Icon]) => <div key={name}><span><Icon size={15} />{name}</span><small><i />已连接</small></div>)}
            </div>
          </section>
        </aside>
      )}
      {leftOpen && <button className="backdrop" aria-label="关闭菜单" onClick={() => setLeftOpen(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
