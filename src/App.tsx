import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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
  Copy,
  Database,
  ExternalLink,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  PanelRightClose,
  PanelRightOpen,
  PenLine,
  Pin,
  PinOff,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  ThumbsDown,
  ThumbsUp,
  TicketPercent,
  Users,
  WalletCards,
  WandSparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ScenarioKind = '功能类' | '数据报表类' | '操作类' | '预测类' | '营销活动类'
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
type MarketingPageArtifact = {
  title: string
  href: string
  description: string
  campaign: string
  coupon: string
}
type CreativeOutput = {
  markdown: string
}
type CopyShareTargetId = 'wechat-moments' | 'douyin' | 'xiaohongshu'
type CopyShareTarget = {
  id: CopyShareTargetId
  action: string
  appName: string
  title: string
  text: string
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
  starter: string
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
  marketingPage?: MarketingPageArtifact
  creativeOutput?: CreativeOutput
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
const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`
const publicCampaignBaseUrl = 'https://roydeen.github.io/shengyitong-demo/'
const copyShareImageUrl = `${publicCampaignBaseUrl}campaign-light-meal-poster-3x4.png`
const copyShareTargets: CopyShareTarget[] = [
  {
    id: 'wechat-moments',
    action: '分享到朋友圈',
    appName: '微信',
    title: '今天午餐，吃轻一点',
    text: '杭州西湖店今日轻食套餐已上新：鸡胸、牛油果、时蔬和青提茉莉，清爽但不寡淡。午高峰前下单，会员可领满减券。',
  },
  {
    id: 'douyin',
    action: '分享到抖音',
    appName: '抖音',
    title: '杭州西湖店午餐 15 分钟出餐',
    text: '不想吃太油，又不想饿着？今天试试这份轻食套餐。现做、可自提、可外卖，结尾领券更划算。',
  },
  {
    id: 'xiaohongshu',
    action: '分享到小红书',
    appName: '小红书',
    title: '西湖边上班族的低负担午餐',
    text: '这份轻食不会只有草。鸡胸够嫩，牛油果增加饱腹感，青提茉莉清爽解腻，适合下午还要开会、不想犯困的时候。',
  },
]
const getCopyShareUrl = (target: CopyShareTarget) =>
  `${publicCampaignBaseUrl}?copy_share=1&platform=${target.id}&title=${encodeURIComponent(target.title)}&text=${encodeURIComponent(target.text)}&image=${encodeURIComponent(copyShareImageUrl)}`
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

const springSaladCampaign: MarketingPageArtifact = {
  title: '工作日午餐会员领券页',
  href: '#/campaigns/spring-salad',
  campaign: '工作日午餐轻食套餐',
  coupon: '满 39 减 8 元午餐券',
  description: '面向微信私域生成的活动领取页，顾客扫码或点击进入后领券，到店微信支付时自动抵扣，商户可查看领取、核销和支付复盘。',
}

const weekendBanquetCampaign: MarketingPageArtifact = {
  title: '周末宴请会员领券页',
  href: '#/campaigns/weekend-banquet',
  campaign: '周末雅宴团圆礼',
  coupon: '满 499 减 80 元宴请券',
  description: '面向周末家庭聚餐和商务宴请生成的活动领取页，顾客扫码或点击进入后领券，到店消费时按天财商龙营销规则核销。',
}

const scenarios: Scenario[] = [
  {
    id: 'operation-sync',
    kind: '操作类',
    title: '同步平台售罄状态',
    question: '把淘宝闪购上“青提茉莉”同步为售罄，并告诉我是否会影响美团和小程序。',
    starter: '处理一个售罄问题',
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
    id: 'copy-platform',
    kind: '营销活动类',
    title: '生成平台文案海报',
    question: '帮我做一组轻食午餐推广文案，分别用于朋友圈、小红书和抖音发布，再给我一个适合转发的 3:4 竖版海报。',
    starter: '做朋友圈宣传海报',
    time: '刚刚',
    icon: PenLine,
    intro: '我会先识别门店定位、客群和平台语气，再分别生成私域、小红书、抖音可直接使用的文案和海报建议。',
    steps: [
      ['识别商户性质', '轻餐门店，核心卖点是低负担午餐、现做食材和会员复购'],
      ['匹配平台语气', '朋友圈偏熟人转化，小红书偏种草笔记，抖音偏同城短视频钩子'],
      ['输出文案与海报', '每个平台给出标题、正文、行动引导和画面重点'],
    ],
    summary: '已生成 3 组平台化文案。朋友圈强调“今天吃轻一点”的即时下单，小红书强调真实配料和低负担体验，抖音强调同城午餐场景和限时福利。',
    creativeOutput: {
      markdown: `## 轻食午餐活动文案与海报图

我先按平台场景拆成三版文案，最后附一张 3:4 竖版海报图，适合朋友圈、小红书和抖音信息流使用。

### 朋友圈

- **标题：** 今天午餐，吃轻一点
- **正文：** 杭州西湖店今日轻食套餐已上新：鸡胸、牛油果、时蔬和青提茉莉，清爽但不寡淡。午高峰前下单，会员可领满减券。
- **行动引导：** 点击领券下单

### 小红书

- **标题：** 西湖边上班族的低负担午餐
- **正文：** 这份轻食不会只有草。鸡胸够嫩，牛油果增加饱腹感，青提茉莉清爽解腻，适合下午还要开会、不想犯困的时候。
- **行动引导：** 收藏这家工作日午餐店

### 抖音

- **标题：** 杭州西湖店午餐 15 分钟出餐
- **正文：** 不想吃太油，又不想饿着？今天试试这份轻食套餐。现做、可自提、可外卖，结尾领券更划算。
- **行动引导：** 同城下单领券

### 海报图片

按 3:4 竖版生成，适合朋友圈、小红书和抖音的信息流展示；画面保留上方标题区、中间产品图和底部优惠券。

![工作日轻食午餐](campaign-light-meal-poster-3x4.png)`,
    },
    findings: [
      {
        tone: 'info',
        label: '朋友圈',
        meta: '私域转化',
        title: '熟人关系里要少讲概念，多给即时理由',
        body: '建议文案围绕“今天午餐不想油腻，就点一份清爽轻食”。海报突出套餐实拍、配送时间和会员券，按钮文案用“领券下单”。',
        evidence: [
          ['朋友圈文案', MessageSquare],
          ['海报版式', ImageIcon],
        ],
      },
      {
        tone: 'opportunity',
        label: '小红书',
        meta: '种草笔记',
        title: '用食材透明和热量友好建立信任',
        body: '建议标题用“西湖边上班族午餐新选择”。正文拆成食材、口味、饱腹感、价格四段，配图选择俯拍套餐和近景食材。',
      },
      {
        tone: 'critical',
        label: '抖音',
        meta: '同城引流',
        title: '短视频前 3 秒要直接给场景和福利',
        body: '建议开头用“杭州西湖店午餐 15 分钟出餐”。画面从打包、出餐、骑手取餐到顾客开盒，结尾露出优惠券。',
      },
    ],
    table: [
      ['朋友圈', '轻松熟人语气', '套餐实拍 + 领券入口', '可直接发布'],
      ['小红书', '真实体验种草', '食材细节 + 价格口径', '适合收藏'],
      ['抖音', '同城短视频钩子', '出餐效率 + 限时福利', '适合投流测试'],
      ['门店海报', '统一主视觉', '产品图 + 优惠券', '可下载'],
    ],
    nextActions: ['复制朋友圈文案', '生成小红书笔记', '生成抖音脚本', '保存海报'],
    context: {
      updatedAt: '11:05',
      permissions: [
        ['可读取', '门店定位、菜品卖点、历史活动'],
        ['可生成', '朋友圈文案、小红书笔记、抖音脚本、海报'],
        ['需批准', '自动发布、投放预算、短信触达'],
      ],
      references: [
        ['平台内容风格库', '私域、小红书、抖音', PenLine],
        ['门店菜品素材', '轻食套餐、会员券', ImageIcon],
      ],
    },
  },
  {
    id: 'marketing-page',
    kind: '营销活动类',
    title: '工作日午餐营销活动',
    question: '帮我做一个工作日午餐领券活动，主要发到微信群和朋友圈，最后能看活动效果。',
    starter: '做工作日午餐领券活动',
    time: '刚刚',
    icon: Megaphone,
    intro: '我会把活动目标、客群、优惠券、领取页、微信支付核销和复盘报表串成一条链路，先生成可预览方案，发布动作仍需商户确认。',
    steps: [
      ['理解一句话目标', '识别“工作日午餐、微信私域、领券、到店支付抵扣、复盘”五个关键意图'],
      ['生成活动方案', '锁定西湖店周边上班族和老会员，主推 11:00-13:00 轻食套餐'],
      ['配置优惠券草案', '满 39 减 8，微信领取，工作日午餐时段可用，到店微信支付自动抵扣'],
      ['生成领取页面', '生成手机端活动页、分享链接和二维码，可投放到微信群、朋友圈和门店物料'],
      ['建立追踪复盘', '记录访问、领券、核销、支付回调和优惠抵扣金额，沉淀活动报表'],
    ],
    summary: '已生成“工作日午餐会员领券页”草案，并把优惠券、微信领取、支付自动抵扣、日志和复盘报表串成完整业务链路。正式发券库存、触达会员和上线发布仍需店长确认。',
    creativeOutput: {
      markdown: `## 工作日午餐营销活动

已为你生成“工作日午餐营销活动”，并创建“满39减8元午餐券”的活动文案。领取页已经生成，可直接打开查看，后续正式发券和上线仍需店长确认。

### 活动目标

- **目标人群：** 杭州西湖店周边上班族、老会员、近 30 天未复购顾客
- **活动时间：** 工作日 11:00-14:00
- **核心目的：** 拉动午餐时段转化，并把顾客沉淀到微信私域

### 活动内容

- **主标题：** 工作日午餐，吃轻一点也吃饱一点
- **套餐卖点：** 鸡胸、牛油果、时蔬和青提茉莉，清爽、饱腹、不费脑
- **优惠设置：** 满39减8元午餐券
- **领取方式：** 顾客通过微信内 H5 / 小程序入口领取，券进入微信卡包

### 私域转发文案

今天午餐想吃清爽一点，可以试试杭州西湖店的轻食套餐。
工作日午餐券已上线，满 39 减 8，数量有限，领完可到店或下单使用。

### 系统配置

- 已经生成活动“工作日午餐营销活动”成功
- 已经生成券“满39减8元午餐券”成功
- 券“满39减8元午餐券”与活动“工作日午餐营销活动”关联成功

### 运营建议

这类活动适合作为小商户私域营销的标准入口：先用轻量优惠券验证领券和核销转化，再根据复盘结果决定是否扩大投放。`,
    },
    findings: [
      {
        tone: 'info',
        label: '链路生成',
        meta: '活动页 + 优惠券 + 支付',
        title: '一句话任务可以拆成多个可控业务组件',
        body: '大模型负责理解目标和生成内容，优惠券、支付抵扣、日志和报表由固定业务组件承接，这样既能保留自然语言入口，也能保证落地流程稳定。',
        evidence: [
          ['活动页面', LayoutDashboard],
          ['优惠券配置', TicketPercent],
          ['微信支付核销', WalletCards],
        ],
      },
      {
        tone: 'opportunity',
        label: '经营复盘',
        meta: '领取 / 核销 / 实付',
        title: '活动价值不止是生成页面，而是能追踪到支付结果',
        body: '顾客领券后到店微信支付，系统能记录抵扣金额、实付金额和活动来源。商户在盛意旺 APP 里看到的不只是订单，还能看到活动是否带来真实转化。',
      },
    ],
    marketingPage: springSaladCampaign,
    nextActions: ['打开领取页', '配置发券库存', '生成微信群文案', '查看活动复盘'],
    context: {
      updatedAt: '11:08',
      permissions: [
        ['可读取', '菜品、门店、会员、优惠券模板、支付订单'],
        ['可生成', '活动页、私域文案、分享二维码、复盘报表'],
        ['需批准', '正式发券、触达会员、上线发布、预算调整'],
      ],
      references: [
        ['营销页组件库', '首屏、卖点、领券模块', LayoutDashboard],
        ['优惠券系统', '券批次、库存、核销规则', TicketPercent],
        ['微信支付记录', '实付、抵扣、退款', WalletCards],
      ],
    },
  },
  {
    id: reportScenarioId,
    kind: '数据报表类',
    title: '获取渠道毛利退款报表',
    question: '帮我获取近7天各渠道毛利和退款报表，判断异常原因，并生成一个以后可以持续查看的报表。',
    starter: '看一份经营报表',
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
    id: 'analysis-reusable-page',
    kind: '营销活动类',
    title: '周末宴请营销活动',
    question: '请为我生成一个周末的营销活动。',
    starter: '生成周末营销活动',
    time: '刚刚',
    icon: Megaphone,
    intro: '我会按“内容生成 + 天财商龙主系统落库”的方式处理：文案和图片由 AI 生成，会员、营销活动、优惠券和核销信息继续以天财商龙 SaaS 为准。',
    steps: [
      ['识别营销目标', '判断为周末中餐宴请场景，目标客群是家庭聚餐、商务宴请和老客复购'],
      ['生成活动内容', '已生成活动标题、朋友圈文案、小红书文案、抖音脚本和 3:4 宴请海报图'],
      ['创建天财商龙活动', '已通过联调接口写入活动基础信息：门店、时间、渠道、活动名称和活动说明'],
      ['创建天财商龙优惠券', '已通过联调接口写入满499减80元宴请券基础信息：券名称、门槛、减免金额和有效期'],
      ['关联活动与券', '已把周末宴请营销活动与满499减80元宴请券完成关联，后续领取、核销和报表仍走天财商龙'],
    ],
    summary: '已生成活动“周末宴请营销活动”成功；已生成券“满499减80元宴请券”成功；券“满499减80元宴请券”与活动“周末宴请营销活动”关联成功。系统已判断该商户使用天财商龙营销链路，会员、活动、券和核销数据仍由天财商龙 SaaS 承接。',
    creativeOutput: {
      markdown: `## 周末宴请营销活动

我先按周末中餐宴请场景生成一版活动。系统已识别该商户的营销链路配置为天财商龙，所以会员、营销活动、优惠券和后续核销数据都会继续进入天财商龙 SaaS。

### 活动文案

- **活动名称：** 周末雅宴 · 老友团圆礼
- **适用场景：** 家庭聚餐、商务宴请、朋友小聚、老客复购
- **主推卖点：** 包间氛围、招牌宴请菜、提前预订、周末到店更从容
- **优惠券：** 满499减80元宴请券
- **行动引导：** 提前预订周末餐位，领取宴请券后到店使用

### 朋友圈文案

这个周末适合约一顿认真吃的中餐。
招牌烤鸭、清蒸鱼、点心和热茶都备好了，适合家庭聚餐、朋友小聚，也适合商务宴请。提前预订并领取满499减80元宴请券，到店用餐更划算。

### 小红书文案

周末想找一家适合请客、不踩雷的中餐厅，可以看这家。包间环境安静，菜品有仪式感，烤鸭、清蒸鱼和点心都适合多人分享。适合家庭聚餐、客户宴请和朋友小聚，提前领券再订位会更合适。

### 抖音脚本

周末请客不知道去哪？
一桌高级中餐宴请安排好：烤鸭、清蒸鱼、点心、热茶和包间氛围。
现在领取满499减80元宴请券，周末到店用餐直接抵扣。

### 海报图片

![高级中餐宴请](campaign-premium-banquet-3x4.png)

### 系统配置

- 已在天财商龙中为你生成“周末宴请营销活动”成功
- 已在天财商龙中生成“满499减80元宴请券”成功
- 已将“满499减80元宴请券”与“周末宴请营销活动”关联成功
- 会员、领券、核销和活动复盘数据将继续以天财商龙 SaaS 为准`,
    },
    findings: [
      {
        tone: 'info',
        label: '系统边界',
        meta: '天财商龙为主系统',
        title: '会员、活动和优惠券不在 Agent 侧重复建设',
        body: '商户原有会员、营销活动、优惠券、核销和报表仍保留在天财商龙 SaaS。Agent 负责把商户一句话转成活动方案、文案、图片和接口参数，避免形成两套业务数据。',
        evidence: [
          ['活动基础信息', Megaphone],
          ['优惠券基础信息', TicketPercent],
        ],
      },
      {
        tone: 'opportunity',
        label: '联调价值',
        meta: '内容 + 接口',
        title: '营销 Agent 的价值在于把内容和系统配置串起来',
        body: '商户不需要分别找文案、做海报、再进后台建活动和券。Agent 生成内容后，将活动名称、时间、门店、券规则和渠道参数组装成天财商龙接口所需字段，减少后台操作成本。',
      },
    ],
    metrics: [
      ['活动基础信息', '已创建', '天财商龙', 'up'],
      ['优惠券基础信息', '已创建', '满499减80', 'up'],
      ['内容素材', '已生成', '文案 + 图片', 'flat'],
      ['数据主系统', '天财商龙', '会员 / 券 / 核销', 'flat'],
    ],
    table: [
      ['活动', '周末宴请营销活动', '写入天财商龙活动基础信息', '成功'],
      ['优惠券', '满499减80元宴请券', '写入天财商龙优惠券基础信息', '成功'],
      ['内容素材', '朋友圈、小红书、抖音文案与宴请海报', '由 AI 生成', '成功'],
      ['数据归属', '会员、券、核销、报表', '继续使用天财商龙 SaaS', '已确认'],
    ],
    marketingPage: weekendBanquetCampaign,
    nextActions: ['查看天财商龙活动记录', '查看优惠券基础信息', '生成平台分享二维码'],
    context: {
      updatedAt: '11:12',
      permissions: [
        ['可读取', '门店、菜品卖点、活动模板、优惠券模板'],
        ['可生成', '朋友圈文案、小红书文案、抖音脚本、海报图片'],
        ['可调用', '天财商龙活动创建接口、优惠券基础信息接口、活动券关联接口'],
        ['需批准', '正式发布活动、批量触达会员、修改天财商龙库存和券规则'],
      ],
      references: [
        ['天财商龙活动接口', '活动名称、门店、时间、渠道', Database],
        ['天财商龙优惠券接口', '券名称、门槛、减免、有效期', TicketPercent],
      ],
    },
  },
  {
    id: 'report-profit',
    kind: '数据报表类',
    title: '看今日经营报表',
    question: '今天到现在营业情况怎么样？帮我看收入、毛利、退款和外卖渠道有没有异常。',
    starter: '分析昨天运营数据',
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
    starter: '会员储值做活动',
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
    starter: '看下周排班备货',
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
  'marketing-page': { fixed: true, useCount: 11, lastUsed: '今天 11:08', order: 43, hidden: false },
  'copy-platform': { fixed: true, useCount: 10, lastUsed: '今天 11:05', order: 42, hidden: false },
  'analysis-reusable-page': { fixed: true, useCount: 8, lastUsed: '今天 11:12', order: 40, hidden: false },
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
    id: 'history-marketing-page',
    title: '工作日午餐营销活动',
    scenarioId: 'marketing-page',
    prompt: '帮我做一个工作日午餐领券活动，主要发到微信群和朋友圈，最后能看活动效果。',
    time: '刚刚',
    summary: '已生成领券、核销和复盘链路',
  },
  {
    id: 'history-copy-platform',
    title: '朋友圈小红书抖音文案',
    scenarioId: 'copy-platform',
    prompt: '帮我做一组轻食午餐推广文案，分别用于朋友圈、小红书和抖音发布，再给我一个适合转发的 3:4 竖版海报。',
    time: '刚刚',
    summary: '按平台生成文案和海报',
  },
  {
    id: 'history-analysis-reusable',
    title: '周末宴请营销活动',
    scenarioId: 'analysis-reusable-page',
    prompt: '请为我生成一个周末的营销活动。',
    time: '刚刚',
    summary: '已生成宴请活动和优惠券',
  },
]

const randomSuggestionIds = () => [...scenarios]
  .sort(() => Math.random() - 0.5)
  .slice(0, 4)
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
          <img className="report-robot-logo" src={assetUrl('shengyitong-robot-logo.png')} alt="" />
          <div className="report-brand-copy">
            <img className="report-text-logo" src={assetUrl('shengyitong-text-logo.png')} alt="盛意通" />
            <small>AI 营销平台</small>
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
const statusToneMap: Record<string, string> = {
  草稿: 'submitted',
  已提交: 'submitted',
  待同步: 'pending',
  未同步: 'pending',
  已暂停: 'pending',
  即将结束: 'pending',
  进行中: 'progress',
  模拟中: 'review',
  待复核: 'review',
  已生成: 'success',
  可访问: 'success',
  已关联: 'success',
  可查看: 'success',
  已同步: 'success',
  已领取: 'success',
  已核销: 'success',
  核销成功: 'success',
  已完成: 'success',
  同步失败: 'failed',
  已失败: 'failed',
  已结束: 'expired',
  已过期: 'expired',
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`syt-status-badge ${statusToneMap[value] ?? 'neutral'}`}>{value}</span>
}

function CouponCenterPage() {
  const [routeHash, setRouteHash] = useState(() => window.location.hash)
  const menuItems: Array<{ name: string; detail: string; Icon: LucideIcon; href?: string }> = [
    { name: '活动管理', detail: '方案、领券页、券批次和复盘', Icon: Megaphone, href: '#/coupon-center/campaigns' },
    { name: '券批次管理', detail: '创建本地营销券，配置规则与库存', Icon: TicketPercent, href: '#/coupon-center/stocks' },
    { name: '用户领券记录', detail: '领取明细、券码、渠道和状态', Icon: Users, href: '#/coupon-center/claims' },
    { name: '核销管理', detail: '订单核销、抵扣和支付流水', Icon: Check, href: '#/coupon-center/redemptions' },
    { name: '券使用报表', detail: '领券、核销、GMV 和成本', Icon: BarChart3, href: '#/coupon-center/reports' },
  ]
  const isStockPage = routeHash.startsWith('#/coupon-center/stocks')
  const isCampaignManagePage = routeHash.startsWith('#/coupon-center/campaigns')
  const isClaimRecordsPage = routeHash.startsWith('#/coupon-center/claims')
  const isRedemptionPage = routeHash.startsWith('#/coupon-center/redemptions')
  const isUsageReportPage = routeHash.startsWith('#/coupon-center/reports')
  const isSubPage = isStockPage || isCampaignManagePage || isClaimRecordsPage || isRedemptionPage || isUsageReportPage
  const pageTitle = isCampaignManagePage
    ? '活动管理'
    : isStockPage
      ? '券批次管理'
      : isClaimRecordsPage
        ? '用户领券记录'
        : isRedemptionPage
          ? '核销管理'
          : isUsageReportPage
            ? '券使用报表'
            : '优惠券中心'
  const pageDescription = isCampaignManagePage
    ? '管理从活动方案、领券页、券批次、投放渠道到复盘报表的完整私域营销链路。'
    : isStockPage
      ? '创建本地营销券批次，并与微信商家券批次保持一一映射，后续可用于领券、支付核销和效果报表。'
      : isClaimRecordsPage
        ? '查看用户从不同渠道领取到微信卡包的券记录，快速判断是否领取成功、是否已使用或即将过期。'
        : isRedemptionPage
          ? '管理到店支付后的优惠券核销流水，核对订单实付、优惠抵扣和微信支付回调状态。'
          : isUsageReportPage
            ? '按活动、券批次和渠道汇总领券、核销、GMV、优惠成本与转化效率。'
            : '统一管理券批次、用户领券、订单核销和券使用报表。左侧菜单进入具体功能配置。'
  const openCouponPage = (href?: string) => {
    if (!href) return
    window.location.hash = href
    setRouteHash(href)
  }

  useEffect(() => {
    const syncHash = () => setRouteHash(window.location.hash)
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  const weekTrend = [
    ['周一', 86, 31, '¥248'],
    ['周二', 102, 38, '¥304'],
    ['周三', 128, 47, '¥376'],
    ['周四', 116, 43, '¥344'],
    ['周五', 142, 51, '¥408'],
  ]

  const activeStocks = [
    ['工作日午餐券', '满39减8', '300', '128', '47', '36.7%', '进行中'],
    ['老客复购券', '满59减10', '200', '64', '18', '28.1%', '进行中'],
    ['新客尝鲜券', '满29减5', '100', '92', '22', '23.9%', '即将结束'],
  ]

  const channelRows = [
    ['微信群', '210', '86', '34', '39.5%'],
    ['朋友圈', '156', '42', '13', '31.0%'],
    ['门店二维码', '88', '31', '16', '51.6%'],
    ['店员私聊', '64', '22', '9', '40.9%'],
  ]

  const events = [
    ['12:16', '微信支付核销 1 张午餐券，订单实付 ¥34'],
    ['12:08', '用户 138****5821 领取午餐券'],
    ['11:58', '微信群入口新增 12 次访问'],
    ['10:08', '午餐券 H5 入口生成'],
    ['10:06', '微信商家券批次同步成功'],
  ]

  const claimRecords = [
    ['12:08', '138****5821', '周女士', '工作日午餐轻食券', 'WXCP-240918-1288', '微信群', '已领取', '2026.09.30'],
    ['11:54', '186****9012', '陈先生', '工作日午餐轻食券', 'WXCP-240918-1287', '门店二维码', '已核销', '2026.09.30'],
    ['11:32', '159****6703', '赵女士', '老客复购券', 'WXCP-240916-0641', '店员私聊', '已领取', '2026.10.15'],
    ['10:46', '177****3319', '李先生', '新客尝鲜券', 'WXCP-240912-0092', '朋友圈', '即将结束', '2026.09.27'],
  ]

  const redemptionRecords = [
    ['12:16', 'PAY-20260918-0917', '138****5821', '工作日午餐轻食券', '¥42', '¥8', '¥34', '微信支付', '核销成功'],
    ['12:02', 'PAY-20260918-0908', '186****9012', '工作日午餐轻食券', '¥39', '¥8', '¥31', '微信支付', '核销成功'],
    ['11:47', 'PAY-20260918-0881', '159****6703', '老客复购券', '¥68', '¥10', '¥58', '微信支付', '核销成功'],
    ['11:21', 'PAY-20260918-0842', '177****3319', '新客尝鲜券', '¥31', '¥0', '¥31', '未使用券', '待复核'],
  ]

  const usageReportRows = [
    ['工作日午餐轻食券', '微信群', '210', '86', '34', '39.5%', '¥1,428', '¥272'],
    ['工作日午餐轻食券', '门店二维码', '88', '31', '16', '51.6%', '¥672', '¥128'],
    ['老客复购券', '店员私聊', '64', '22', '9', '40.9%', '¥612', '¥90'],
    ['新客尝鲜券', '朋友圈', '156', '42', '13', '31.0%', '¥403', '¥65'],
  ]

  type MarketingCampaign = {
    id: string
    name: string
    goal: string
    audience: string
    channels: string
    coupon: string
    claimPage: string
    stockName: string
    status: string
    visits: string
    claims: string
    uses: string
    gmv: string
    cost: string
    owner: string
  }

  const initialCampaigns: MarketingCampaign[] = [
    {
      id: 'CMP-20260918-001',
      name: '工作日午餐轻食活动',
      goal: '午高峰转化',
      audience: '周边上班族、新老会员',
      channels: '朋友圈、微信群、门店二维码',
      coupon: '满39减8',
      claimPage: '工作日午餐会员领券页',
      stockName: '工作日午餐轻食券',
      status: '进行中',
      visits: '386',
      claims: '128',
      uses: '47',
      gmv: '¥1,974',
      cost: '¥376',
      owner: '林店长',
    },
    {
      id: 'CMP-20260916-002',
      name: '老客复购唤醒',
      goal: '提升复购',
      audience: '30 天未到店老客',
      channels: '店员私聊、微信群',
      coupon: '满59减10',
      claimPage: '老客复购专属领券页',
      stockName: '老客复购券',
      status: '进行中',
      visits: '212',
      claims: '64',
      uses: '18',
      gmv: '¥1,122',
      cost: '¥180',
      owner: '林店长',
    },
    {
      id: 'CMP-20260912-003',
      name: '新客尝鲜活动',
      goal: '新客拉新',
      audience: '首次领券顾客',
      channels: '门店二维码、小红书',
      coupon: '满29减5',
      claimPage: '新客尝鲜领券页',
      stockName: '新客尝鲜券',
      status: '草稿',
      visits: '0',
      claims: '0',
      uses: '0',
      gmv: '¥0',
      cost: '¥0',
      owner: '林店长',
    },
  ]

  type CouponStock = {
    localStockNo: string
    stockId: string
    outRequestNo: string
    name: string
    type: string
    rule: string
    stock: string
    available: string
    claimed: string
    used: string
    status: string
    sync: string
    period: string
    merchant: string
    goods: string
    useTime: string
    limit: string
  }

  const initialCouponStocks: CouponStock[] = [
    {
      localStockNo: 'SYT-STOCK-20260918-001',
      stockId: '100906018520260918001',
      outRequestNo: 'wxbusifavor_20260918_lunch_001',
      name: '工作日午餐轻食券',
      type: '满减券',
      rule: '满39减8',
      stock: '300',
      available: '172',
      claimed: '128',
      used: '47',
      status: '进行中',
      sync: '已同步',
      period: '2026.09.18 - 2026.09.30',
      merchant: '杭州西湖店',
      goods: '轻食套餐、青提茉莉',
      useTime: '周一至周五 11:00-13:30',
      limit: '每人限领 1 张',
    },
    {
      localStockNo: 'SYT-STOCK-20260916-002',
      stockId: '100906018520260916002',
      outRequestNo: 'wxbusifavor_20260916_return_002',
      name: '老客复购券',
      type: '满减券',
      rule: '满59减10',
      stock: '200',
      available: '136',
      claimed: '64',
      used: '18',
      status: '进行中',
      sync: '已同步',
      period: '2026.09.16 - 2026.10.15',
      merchant: '杭州西湖店',
      goods: '全店套餐',
      useTime: '每日 10:00-20:00',
      limit: '每人限领 1 张',
    },
    {
      localStockNo: 'SYT-STOCK-20260912-003',
      stockId: '待同步',
      outRequestNo: 'wxbusifavor_20260912_new_003',
      name: '新客尝鲜券',
      type: '满减券',
      rule: '满29减5',
      stock: '100',
      available: '100',
      claimed: '0',
      used: '0',
      status: '草稿',
      sync: '未同步',
      period: '2026.09.20 - 2026.09.27',
      merchant: '杭州西湖店',
      goods: '轻食套餐',
      useTime: '每日 11:00-19:00',
      limit: '仅新客可领，每人限领 1 张',
    },
  ]

  const [couponStocks, setCouponStocks] = useState(initialCouponStocks)
  const [detailStockNo, setDetailStockNo] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null)
  const [campaignFormOpen, setCampaignFormOpen] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'draft' | 'published'>('all')
  const selectedCampaign = detailCampaignId ? campaigns.find((campaign) => campaign.id === detailCampaignId) : undefined
  const editingCampaign = editingCampaignId ? campaigns.find((campaign) => campaign.id === editingCampaignId) : undefined
  const selectedStock = detailStockNo ? couponStocks.find((stock) => stock.localStockNo === detailStockNo) : undefined
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (campaignFilter === 'draft') return campaign.status === '草稿'
    if (campaignFilter === 'published') return campaign.status !== '草稿'
    return true
  })
  const openCampaignForm = (id?: string) => {
    setEditingCampaignId(id ?? null)
    setCampaignFormOpen(true)
  }
  const updateCampaignStatus = (id: string, nextStatus: string) => {
    setCampaigns((items) => items.map((campaign) => (campaign.id === id ? { ...campaign, status: nextStatus } : campaign)))
  }
  const handleCampaignSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const shouldPublish = submitter?.value === 'publish'
    const nextStatus = shouldPublish ? '进行中' : '草稿'
    const campaignData = {
      name: String(data.get('campaignName') || '新建营销活动'),
      goal: String(data.get('goal') || '提升到店'),
      audience: String(data.get('audience') || '会员顾客'),
      channels: String(data.get('channels') || '微信群、朋友圈'),
      coupon: String(data.get('coupon') || '满499减80'),
      claimPage: String(data.get('claimPage') || '活动会员领券页'),
      stockName: String(data.get('stockName') || '活动优惠券'),
      owner: String(data.get('owner') || '林店长'),
      status: nextStatus,
    }
    if (editingCampaign) {
      setCampaigns((items) =>
        items.map((campaign) => (
          campaign.id === editingCampaign.id
            ? { ...campaign, ...campaignData }
            : campaign
        )),
      )
    } else {
      const sequence = String(campaigns.length + 1).padStart(3, '0')
      const newCampaign: MarketingCampaign = {
        id: `CMP-20260922-${sequence}`,
        ...campaignData,
        visits: shouldPublish ? '0' : '0',
        claims: '0',
        uses: '0',
        gmv: '¥0',
        cost: '¥0',
      }
      setCampaigns((items) => [newCampaign, ...items])
    }
    setCampaignFormOpen(false)
    setEditingCampaignId(null)
    setCampaignFilter(nextStatus === '草稿' ? 'draft' : 'published')
  }
  const handleCreateStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const stock = String(data.get('stock') || '100')
    const maxAmount = String(data.get('maxAmount') || '1')
    const sequence = String(couponStocks.length + 1).padStart(3, '0')
    const newStock: CouponStock = {
      localStockNo: `SYT-STOCK-20260918-${sequence}`,
      stockId: '待同步',
      outRequestNo: String(data.get('outRequestNo') || `wxbusifavor_20260918_demo_${sequence}`),
      name: String(data.get('stockName') || '新建营销券'),
      type: String(data.get('couponType') || '满减券'),
      rule: String(data.get('rule') || '满39减8'),
      stock,
      available: stock,
      claimed: '0',
      used: '0',
      status: '草稿',
      sync: '未同步',
      period: String(data.get('period') || '2026.09.18 - 2026.09.30'),
      merchant: String(data.get('merchant') || '杭州西湖店'),
      goods: String(data.get('goods') || '轻食套餐'),
      useTime: String(data.get('useTime') || '每日 11:00-19:00'),
      limit: `每人限领 ${maxAmount} 张`,
    }
    setCouponStocks((stocks) => [newStock, ...stocks])
    setDetailStockNo(null)
    setFormOpen(false)
    event.currentTarget.reset()
  }
  const updateStockStatus = (localStockNo: string, nextStatus: string, nextSync?: string) => {
    setCouponStocks((stocks) =>
      stocks.map((stock) => {
        if (stock.localStockNo !== localStockNo) return stock
        const shouldBackfillWechatNo = nextSync === '已同步' && stock.stockId === '待同步'
        return {
          ...stock,
          status: nextStatus,
          sync: nextSync ?? stock.sync,
          stockId: shouldBackfillWechatNo ? `100906018520260918${stock.localStockNo.slice(-3)}` : stock.stockId,
        }
      }),
    )
  }
  const detailFields = selectedStock
    ? [
        ['券批次', selectedStock.name],
        ['本地批次号', selectedStock.localStockNo],
        ['券类型', selectedStock.type],
        ['优惠规则', selectedStock.rule],
        ['总库存', selectedStock.stock],
        ['剩余库存', selectedStock.available],
        ['已领取', selectedStock.claimed],
        ['已核销', selectedStock.used],
        ['微信券批次号', selectedStock.stockId],
        ['同步状态', selectedStock.sync],
        ['状态', selectedStock.status],
        ['有效期', selectedStock.period],
        ['适用门店', selectedStock.merchant],
        ['适用商品', selectedStock.goods],
        ['可用时间', selectedStock.useTime],
        ['领取限制', selectedStock.limit],
      ]
    : []

  return (
    <div className="coupon-admin-page">
      <aside className="coupon-admin-sidebar">
        <button
          className="coupon-admin-brand"
          type="button"
          onClick={() => {
            window.location.hash = ''
          }}
          aria-label="返回 AI 对话首页"
        >
          <img src={assetUrl('shengyitong-robot-logo.png')} alt="" />
          <div>
            <img src={assetUrl('shengyitong-text-logo.png')} alt="盛意通" />
            <small>AI 营销平台</small>
          </div>
        </button>
        <nav>
          {menuItems.map(({ name, detail, Icon, href }) => (
            <button className={href && routeHash.startsWith(href) ? 'active' : ''} key={name} onClick={() => openCouponPage(href)}>
              <Icon size={16} />
              <span>{name}</span>
              <small>{detail}</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="coupon-admin-main">
        <header className="coupon-admin-header">
          <div>
            {isSubPage ? (
              <>
                <button className="coupon-admin-back" type="button" onClick={() => openCouponPage('#/coupon-center')}>
                  优惠券中心
                </button>
                <h1>{pageTitle}</h1>
              </>
            ) : (
              <h1 className="coupon-home-title">优惠券中心</h1>
            )}
            <p>{pageDescription}</p>
          </div>
        </header>

        {isClaimRecordsPage ? (
          <section className="coupon-feature-page">
            <section className="coupon-admin-metrics">
              {[
                ['今日领取', '128', '微信卡包入账成功'],
                ['已核销', '47', '领取后核销率 36.7%'],
                ['未核销', '81', '建议午高峰后提醒'],
                ['即将过期', '18', '48 小时内到期'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </div>
              ))}
            </section>
            <article className="coupon-panel">
              <div className="coupon-panel-head">
                <div>
                  <h2>领券明细</h2>
                  <small>按用户、券码、渠道和微信券状态查看</small>
                </div>
              </div>
              <div className="coupon-feature-filters">
                <label><span>券批次</span><select defaultValue="all"><option value="all">全部券批次</option><option>工作日午餐轻食券</option><option>老客复购券</option><option>新客尝鲜券</option></select></label>
                <label><span>状态</span><select defaultValue="all"><option value="all">全部状态</option><option>已领取</option><option>已核销</option><option>即将结束</option></select></label>
                <label className="wide"><span>搜索</span><input placeholder="手机号 / 顾客 / 券码" /></label>
                <button className="coupon-filter-submit" type="button">查询</button>
              </div>
              <div className="coupon-record-table claims">
                <div><span>领取时间</span><span>手机号</span><span>顾客</span><span>券名称</span><span>券码</span><span>来源渠道</span><span>状态</span><span>有效期至</span></div>
                {claimRecords.map(([time, phone, customer, coupon, code, channel, status, expire]) => (
                  <div key={code}>
                    <span>{time}</span>
                    <span>{phone}</span>
                    <span>{customer}</span>
                    <span>{coupon}</span>
                    <span>{code}</span>
                    <span>{channel}</span>
                    <span><StatusBadge value={status} /></span>
                    <span>{expire}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : isRedemptionPage ? (
          <section className="coupon-feature-page">
            <section className="coupon-admin-metrics">
              {[
                ['今日核销', '47', '微信支付自动抵扣'],
                ['优惠抵扣', '¥376', '商户营销成本'],
                ['核销 GMV', '¥1,974', '实收 ¥1,598'],
                ['待复核订单', '1', '券未匹配或回调延迟'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </div>
              ))}
            </section>
            <article className="coupon-panel">
              <div className="coupon-panel-head">
                <div>
                  <h2>核销流水</h2>
                  <small>核对订单金额、优惠抵扣、实付金额和支付回调状态</small>
                </div>
              </div>
              <div className="coupon-feature-filters">
                <label><span>核销状态</span><select defaultValue="all"><option value="all">全部状态</option><option>核销成功</option><option>待复核</option></select></label>
                <label><span>支付方式</span><select defaultValue="all"><option value="all">全部支付方式</option><option>微信支付</option><option>未使用券</option></select></label>
                <label className="wide"><span>搜索</span><input placeholder="订单号 / 手机号 / 券名称" /></label>
                <button className="coupon-filter-submit" type="button">查询</button>
              </div>
              <div className="coupon-record-table redemptions">
                <div><span>时间</span><span>订单号</span><span>用户</span><span>券名称</span><span>订单金额</span><span>优惠</span><span>实付</span><span>支付</span><span>状态</span></div>
                {redemptionRecords.map(([time, orderNo, user, coupon, amount, discount, paid, payType, status]) => (
                  <div key={orderNo}>
                    <span>{time}</span>
                    <span>{orderNo}</span>
                    <span>{user}</span>
                    <span>{coupon}</span>
                    <span>{amount}</span>
                    <span>{discount}</span>
                    <span>{paid}</span>
                    <span>{payType}</span>
                    <span><StatusBadge value={status} /></span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : isUsageReportPage ? (
          <section className="coupon-feature-page">
            <section className="coupon-admin-metrics">
              {[
                ['访问人数', '518', '本周私域入口合计'],
                ['领券人数', '181', '领取率 34.9%'],
                ['核销订单', '72', '核销率 39.8%'],
                ['优惠成本', '¥555', '带动 GMV ¥3,115'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </div>
              ))}
            </section>
            <section className="coupon-report-layout">
              <article className="coupon-panel">
                <div className="coupon-panel-head">
                  <div>
                    <h2>券使用效果</h2>
                    <small>按券批次和渠道拆分转化效率</small>
                  </div>
                </div>
                <div className="coupon-record-table report">
                  <div><span>券名称</span><span>渠道</span><span>访问</span><span>领券</span><span>核销</span><span>核销率</span><span>GMV</span><span>成本</span></div>
                  {usageReportRows.map(([coupon, channel, visits, claims, uses, rate, gmv, cost]) => (
                    <div key={`${coupon}-${channel}`}>
                      <span>{coupon}</span>
                      <span>{channel}</span>
                      <span>{visits}</span>
                      <span>{claims}</span>
                      <span>{uses}</span>
                      <span>{rate}</span>
                      <span>{gmv}</span>
                      <span>{cost}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </section>
        ) : isCampaignManagePage ? (
          <section className="campaign-admin-panel">
            <article className="coupon-panel campaign-admin-list">
              <div className="coupon-panel-head coupon-panel-head-action">
                <div>
                  <h2>活动列表</h2>
                  <small>活动、券、页面、投放和复盘统一管理</small>
                </div>
                <button type="button" onClick={() => openCampaignForm()}>新建活动</button>
              </div>
              <div className="campaign-filter-tabs" role="tablist" aria-label="活动状态筛选">
                {([
                  ['all', '全部活动'],
                  ['draft', '草稿箱'],
                  ['published', '已发布'],
                ] as Array<['all' | 'draft' | 'published', string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={campaignFilter === value ? 'active' : ''}
                    onClick={() => setCampaignFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="campaign-admin-table">
                <div>
                  <span>活动名称</span>
                  <span>目标</span>
                  <span>渠道</span>
                  <span>优惠</span>
                  <span>领取 / 核销</span>
                  <span>GMV / 成本</span>
                  <span>状态</span>
                  <span>操作</span>
                </div>
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id}>
                    <span>
                      <strong>{campaign.name}</strong>
                      <em>{campaign.id}</em>
                    </span>
                    <span>{campaign.goal}</span>
                    <span>{campaign.channels}</span>
                    <span>{campaign.coupon}</span>
                    <span>{campaign.claims} / {campaign.uses}</span>
                    <span>{campaign.gmv} / {campaign.cost}</span>
                    <span><StatusBadge value={campaign.status} /></span>
                    <span className="coupon-row-actions">
                      <button type="button" onClick={() => setDetailCampaignId(campaign.id)}>查看详情</button>
                      <button type="button" onClick={() => openCampaignForm(campaign.id)}>编辑</button>
                      {campaign.status === '草稿' && (
                        <button type="button" onClick={() => updateCampaignStatus(campaign.id, '进行中')}>发布</button>
                      )}
                      {campaign.status === '进行中' && (
                        <>
                          <button type="button" onClick={() => updateCampaignStatus(campaign.id, '已暂停')}>暂停</button>
                          <button type="button" onClick={() => updateCampaignStatus(campaign.id, '已结束')}>结束</button>
                        </>
                      )}
                      {campaign.status === '已暂停' && (
                        <>
                          <button type="button" onClick={() => updateCampaignStatus(campaign.id, '进行中')}>恢复</button>
                          <button type="button" onClick={() => updateCampaignStatus(campaign.id, '已结束')}>结束</button>
                        </>
                      )}
                    </span>
                  </div>
                ))}
                {filteredCampaigns.length === 0 && (
                  <div className="campaign-empty-row">
                    <span>当前没有{campaignFilter === 'draft' ? '草稿活动' : campaignFilter === 'published' ? '已发布活动' : '活动'}，可以点击右上角新建活动。</span>
                  </div>
                )}
              </div>
            </article>
          </section>
        ) : isStockPage ? (
        <section className="coupon-stock-layout list-only">
          <article className="coupon-panel coupon-stock-list">
            <div className="coupon-panel-head coupon-panel-head-action">
              <div>
                <h2>批次列表</h2>
                <small>与微信商家券信息保持一致</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(true)
                  setDetailStockNo(null)
                }}
              >
                新增
              </button>
            </div>
            <div className="coupon-stock-filters">
              <label>
                <span>状态</span>
                <select defaultValue="all">
                  <option value="all">全部状态</option>
                  <option>草稿</option>
                  <option>进行中</option>
                  <option>已暂停</option>
                  <option>已结束</option>
                </select>
              </label>
              <label>
                <span>同步</span>
                <select defaultValue="all">
                  <option value="all">全部同步状态</option>
                  <option>未同步</option>
                  <option>已同步</option>
                  <option>同步失败</option>
                </select>
              </label>
              <label>
                <span>券类型</span>
                <select defaultValue="all">
                  <option value="all">全部券类型</option>
                  <option>满减券</option>
                  <option>折扣券</option>
                  <option>兑换券</option>
                </select>
              </label>
              <label className="coupon-filter-search">
                <span>搜索</span>
                <input placeholder="券名称 / 微信券批次号 / 本地批次号" />
              </label>
              <button className="coupon-filter-submit" type="button">查询</button>
            </div>
            <div className="coupon-stock-table">
              <div>
                <span>券批次</span>
                <span>优惠规则</span>
                <span>库存</span>
                <span>领 / 核</span>
                <span>微信券批次号</span>
                <span>同步</span>
                <span>状态</span>
                <span>操作</span>
              </div>
              {couponStocks.map((stock) => (
                <div key={stock.localStockNo}>
                  <span>
                    <strong>{stock.name}</strong>
                    <em>{stock.localStockNo}</em>
                  </span>
                  <span>{stock.rule}</span>
                  <span>{stock.stock} / 余 {stock.available}</span>
                  <span>{stock.claimed} / {stock.used}</span>
                  <span>{stock.stockId}</span>
                  <span><StatusBadge value={stock.sync} /></span>
                  <span><StatusBadge value={stock.status} /></span>
                  <span className="coupon-row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailStockNo(stock.localStockNo)
                        setFormOpen(false)
                      }}
                    >
                      查看详情
                    </button>
                    {stock.status === '草稿' && (
                      <>
                        <button type="button">编辑</button>
                        <button type="button" onClick={() => updateStockStatus(stock.localStockNo, '进行中', '已同步')}>同步启用</button>
                      </>
                    )}
                    {stock.status === '进行中' && (
                      <>
                        <button type="button" onClick={() => updateStockStatus(stock.localStockNo, '已暂停')}>暂停</button>
                        <button type="button" onClick={() => updateStockStatus(stock.localStockNo, '已结束')}>结束</button>
                      </>
                    )}
                    {stock.status === '已暂停' && (
                      <>
                        <button type="button" onClick={() => updateStockStatus(stock.localStockNo, '进行中')}>恢复</button>
                        <button type="button" onClick={() => updateStockStatus(stock.localStockNo, '已结束')}>结束</button>
                      </>
                    )}
                    {stock.sync === '同步失败' && (
                      <button type="button" onClick={() => updateStockStatus(stock.localStockNo, '进行中', '已同步')}>重试同步</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </article>

        </section>
        ) : (
          <>
            <section className="coupon-admin-metrics">
              {[
                ['今日领券', '128', '较昨日 +25.5%'],
                ['今日核销', '47', '核销率 36.7%'],
                ['优惠金额', '¥376', '微信商家券核销'],
                ['带动 GMV', '¥1,974', '实收 ¥1,598'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </div>
              ))}
            </section>

            <section className="coupon-dashboard-grid">
              <article className="coupon-panel trend">
                <div className="coupon-panel-head">
                  <h2>本周领券 / 核销趋势</h2>
                  <small>工作日午餐券</small>
                </div>
                <div className="coupon-trend-list">
                  {weekTrend.map(([day, claimed, used, amount]) => (
                    <div key={day}>
                      <span>{day}</span>
                      <i style={{ width: `${Number(claimed) / 1.5}%` }} />
                      <b>{claimed}</b>
                      <em>核销 {used} · {amount}</em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="coupon-panel todo">
                <div className="coupon-panel-head">
                  <h2>待处理事项</h2>
                  <small>建议动作</small>
                </div>
                <ul>
                  <li>
                    <button className="coupon-inline-link" type="button" onClick={() => openCouponPage('#/coupon-center/stocks')}>
                      2 个券批次待同步或需复查，进入券批次管理处理
                    </button>
                  </li>
                  <li>81 张券已领取未核销，可在 13:30 前提醒一次</li>
                  <li>门店二维码核销率最高，建议午高峰继续摆放</li>
                  <li>新客尝鲜券即将结束，需确认是否延长 2 天</li>
                </ul>
              </article>

              <article className="coupon-panel stocks">
                <div className="coupon-panel-head">
                  <h2>进行中的券批次</h2>
                  <small>库存与核销</small>
                </div>
                <div className="coupon-table">
                  <div><span>券名称</span><span>规则</span><span>库存</span><span>已领</span><span>已核销</span><span>核销率</span><span>状态</span></div>
                  {activeStocks.map((row) => (
                    <div key={row[0]}>
                      {row.map((cell, index) => (
                        <span key={`${row[0]}-${cell}`}>
                          {index === row.length - 1 ? <StatusBadge value={String(cell)} /> : cell}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </article>

              <article className="coupon-panel channels">
                <div className="coupon-panel-head">
                  <h2>渠道来源分析</h2>
                  <small>访问到核销</small>
                </div>
                <div className="coupon-channel-list">
                  {channelRows.map(([name, visits, claims, uses, rate]) => (
                    <div key={name}>
                      <strong>{name}</strong>
                      <span>访问 {visits}</span>
                      <span>领券 {claims}</span>
                      <span>核销 {uses}</span>
                      <b>{rate}</b>
                    </div>
                  ))}
                </div>
              </article>

              <article className="coupon-panel events">
                <div className="coupon-panel-head">
                  <h2>最近事件日志</h2>
                  <small>实时同步</small>
                </div>
                {events.map(([time, text]) => (
                  <div className="coupon-event" key={`${time}-${text}`}>
                    <b>{time}</b>
                    <span>{text}</span>
                  </div>
                ))}
              </article>
            </section>
          </>
        )}
      </main>
      {campaignFormOpen && (
        <div className="coupon-modal-backdrop" role="presentation">
          <button className="coupon-modal-floating-close" type="button" onClick={() => {
            setCampaignFormOpen(false)
            setEditingCampaignId(null)
          }} aria-label="关闭">
            <X size={18} />
          </button>
          <form className="coupon-modal campaign-form-modal" onSubmit={handleCampaignSubmit}>
            <div className="coupon-modal-head">
              <div>
                <h2>{editingCampaign ? '编辑活动' : '新建活动'}</h2>
                <small>{editingCampaign ? '修改后可保存为草稿，也可重新发布。' : '先填写活动基础信息，可以保存草稿或直接发布。'}</small>
              </div>
            </div>
            <div className="coupon-form-grid campaign-form-grid">
              <label><span>活动名称</span><input name="campaignName" defaultValue={editingCampaign?.name ?? '周末宴请营销活动'} /></label>
              <label><span>活动目标</span><input name="goal" defaultValue={editingCampaign?.goal ?? '提升周末到店'} /></label>
              <label className="wide"><span>目标人群</span><input name="audience" defaultValue={editingCampaign?.audience ?? '家庭聚餐、商务宴请、老会员'} /></label>
              <label className="wide"><span>投放渠道</span><input name="channels" defaultValue={editingCampaign?.channels ?? '微信群、朋友圈、门店二维码'} /></label>
              <label><span>关联优惠</span><input name="coupon" defaultValue={editingCampaign?.coupon ?? '满499减80'} /></label>
              <label><span>领券页</span><input name="claimPage" defaultValue={editingCampaign?.claimPage ?? '周末宴请会员领券页'} /></label>
              <label><span>券批次</span><input name="stockName" defaultValue={editingCampaign?.stockName ?? '周末宴请券'} /></label>
              <label><span>负责人</span><input name="owner" defaultValue={editingCampaign?.owner ?? '林店长'} /></label>
            </div>
            <div className="coupon-form-actions">
              <button type="button" onClick={() => {
                setCampaignFormOpen(false)
                setEditingCampaignId(null)
              }}>取消</button>
              <button type="submit" name="submitMode" value="draft">保存草稿</button>
              <button type="submit" name="submitMode" value="publish">{editingCampaign ? '发布更新' : '发布活动'}</button>
            </div>
          </form>
        </div>
      )}
      {selectedCampaign && (
        <div className="coupon-modal-backdrop" role="presentation">
          <button className="coupon-modal-floating-close" type="button" onClick={() => setDetailCampaignId(null)} aria-label="关闭">
            <X size={18} />
          </button>
          <section className="coupon-modal campaign-detail-modal" role="dialog" aria-modal="true" aria-label="活动详情">
            <div className="coupon-modal-head">
              <div>
                <h2>{selectedCampaign.name}</h2>
                <small>{selectedCampaign.goal} · {selectedCampaign.owner}</small>
              </div>
            </div>
            <div className="campaign-detail-summary">
              {[
                ['访问', selectedCampaign.visits],
                ['领券', selectedCampaign.claims],
                ['核销', selectedCampaign.uses],
                ['GMV', selectedCampaign.gmv],
                ['优惠成本', selectedCampaign.cost],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="coupon-wechat-fields campaign-detail-fields">
              {[
                ['活动编号', selectedCampaign.id],
                ['目标人群', selectedCampaign.audience],
                ['投放渠道', selectedCampaign.channels],
                ['关联优惠', selectedCampaign.coupon],
                ['领券页', selectedCampaign.claimPage],
                ['关联券批次', selectedCampaign.stockName],
                ['状态', selectedCampaign.status],
                ['负责人', selectedCampaign.owner],
              ].map(([field, value]) => (
                <div key={field}>
                  <b>{field}</b>
                  <span>{field === '状态' ? <StatusBadge value={value} /> : value}</span>
                </div>
              ))}
            </div>
            <div className="campaign-detail-actions">
              <a href="#/campaigns/spring-salad" target="_blank" rel="noreferrer">打开领券页</a>
              <button type="button" onClick={() => {
                setDetailCampaignId(null)
                openCouponPage('#/coupon-center/stocks')
              }}>
                查看券批次
              </button>
            </div>
          </section>
        </div>
      )}
      {selectedStock && (
        <div className="coupon-modal-backdrop" role="presentation">
          <button className="coupon-modal-floating-close" type="button" onClick={() => setDetailStockNo(null)} aria-label="关闭">
            <X size={18} />
          </button>
          <section className="coupon-modal coupon-detail-modal" role="dialog" aria-modal="true" aria-label="批次详情">
            <div className="coupon-modal-head">
              <div>
                <h2>{selectedStock.name}</h2>
                <small>{selectedStock.rule}</small>
              </div>
            </div>
            <div className="coupon-wechat-fields">
              {detailFields.map(([field, value]) => (
                <div key={field}>
                  <b>{field}</b>
                  <span>{field === '状态' || field === '同步状态' ? <StatusBadge value={value} /> : value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {formOpen && (
        <div className="coupon-modal-backdrop" role="presentation">
          <button className="coupon-modal-floating-close" type="button" onClick={() => setFormOpen(false)} aria-label="关闭">
            <X size={18} />
          </button>
          <form className="coupon-modal" onSubmit={handleCreateStock}>
            <div className="coupon-modal-head">
              <div>
                <h2>新建券批次</h2>
                <small>提交后先生成本地营销券批次，微信券批次号待同步后回填。</small>
              </div>
            </div>
            <div className="coupon-form-grid">
              <label><span>券名称</span><input name="stockName" defaultValue="工作日午餐轻食券" /></label>
              <label><span>券类型</span><select name="couponType" defaultValue="满减券"><option>满减券</option><option>折扣券</option><option>兑换券</option></select></label>
              <label><span>优惠规则</span><input name="rule" defaultValue="满39减8" /></label>
              <label><span>总库存</span><input name="stock" defaultValue="300" /></label>
              <label><span>有效期</span><input name="period" defaultValue="2026.09.18 - 2026.09.30" /></label>
              <label><span>适用门店</span><input name="merchant" defaultValue="杭州西湖店" /></label>
              <label><span>适用商品</span><input name="goods" defaultValue="轻食套餐、青提茉莉" /></label>
              <label><span>可用时间</span><input name="useTime" defaultValue="周一至周五 11:00-13:30" /></label>
              <label><span>每人限领</span><input name="maxAmount" defaultValue="1" /></label>
              <label className="wide"><span>微信同步请求号</span><input name="outRequestNo" defaultValue="wxbusifavor_20260918_lunch_001" /></label>
            </div>
            <div className="coupon-form-actions">
              <button type="button" onClick={() => setFormOpen(false)}>取消</button>
              <button type="submit">提交创建</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
function MarketingPage({ page, onSavePoster }: { page: MarketingPageArtifact; onSavePoster: () => void }) {
  const [qrOpen, setQrOpen] = useState(false)
  const pageSearch = typeof window === 'undefined' ? '' : window.location.search
  const hashSearch = typeof window === 'undefined' ? '' : (window.location.hash.split('?')[1] ?? '')
  const isSharePage = new URLSearchParams(pageSearch).get('share') === '1' || new URLSearchParams(hashSearch).get('share') === '1'
  const isBanquetPage = page.href.includes('weekend-banquet')
  const mobilePage = isBanquetPage
    ? {
      image: 'campaign-premium-banquet-3x4.png',
      imageAlt: '高级中餐宴请海报',
      kicker: '杭州西湖店 · 周末宴请',
      title: '周末雅宴，体面请客更从容',
      intro: '包间氛围、招牌宴请菜和会员专属礼遇都已备好，适合家庭聚餐、朋友小聚和商务宴请。',
      sectionLabel: '宴请亮点',
      sectionTitle: '高级中餐团圆宴',
      sectionBody: '本周末宴请优惠力度空前，满499立减80。招牌烤鸭、清蒸鱼、点心、时令热菜和中式茶席组合，适合 4 至 8 人周末聚餐，提前预订更划算。',
      tags: ['包间可预订', '家庭 / 商务 / 老友', '会员券可用'],
      audienceLabel: '适合谁',
      audienceTitle: '给想把周末聚餐安排体面的人',
      audienceBody: '不用临时找餐厅，也不用担心菜品不够撑场面。提前领券预订，到店直接享受宴请优惠，把时间留给家人、朋友和重要客人。',
      shareText: '周末宴请会员礼，提前预订更从容。',
    }
    : {
      image: 'campaign-light-meal-poster-3x4.png',
      imageAlt: '工作日轻食午餐海报',
      kicker: '杭州西湖店 · 工作日午餐',
      title: '今天午餐，吃轻一点也吃饱一点',
      intro: '清爽、饱腹、不费脑。午高峰前下单，还能领取工作日专属满减券。',
      sectionLabel: '套餐内容',
      sectionTitle: '低负担轻食套餐',
      sectionBody: '现做鸡胸、牛油果、时蔬和青提茉莉组合，适合午休时间有限、下午还想保持清爽状态的上班族。',
      tags: ['15 分钟左右出餐', '堂食 / 外卖 / 自提', '会员可叠加积分'],
      audienceLabel: '适合谁',
      audienceTitle: '给不想午后犯困的你',
      audienceBody: '鸡胸够嫩，牛油果增加饱腹感，青提茉莉清爽解腻。下午还要开会，也能吃得轻松一点。',
      shareText: '工作日午餐轻食券，清爽、饱腹、不费脑。',
    }
  const shareUrl = `${publicCampaignBaseUrl}?share=1${page.href}`
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=92x92&margin=6&data=${encodeURIComponent(shareUrl)}`
  const qrLargeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(shareUrl)}`
  const shareCampaign = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: page.title,
          text: mobilePage.shareText,
          url: shareUrl,
        })
        return
      }
      await navigator.clipboard?.writeText(shareUrl)
    } catch {
      await navigator.clipboard?.writeText(shareUrl)
    }
  }

  return (
    <div className={`campaign-page ${isSharePage ? 'campaign-share-page' : ''}`}>
      {!isSharePage && (
        <header className="report-topbar">
          <div className="report-brand">
            <img className="report-robot-logo" src={assetUrl('shengyitong-robot-logo.png')} alt="" />
            <div className="report-brand-copy">
              <img className="report-text-logo" src={assetUrl('shengyitong-text-logo.png')} alt="盛意通" />
              <small>AI 营销平台</small>
            </div>
          </div>
          <div className="report-top-title">
            <strong>{page.title}</strong>
            <small>{page.campaign} · AI 已生成</small>
          </div>
          <div className="campaign-top-actions">
            <button className="report-pin-button" onClick={onSavePoster}>
              <ImageIcon size={15} />
              生成海报
            </button>
            <button className="report-pin-button" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
              <Copy size={15} />
              复制页面链接
            </button>
            <button className="campaign-qr-button" type="button" onClick={() => setQrOpen(true)} aria-label="放大二维码">
              <img src={qrPreviewUrl} alt="" />
            </button>
          </div>
        </header>
      )}

      <main className="campaign-canvas">
        <section className="mobile-campaign-frame" aria-label="移动端活动页预览">
          <div className="mobile-campaign-page">
            <section className="mobile-campaign-hero">
              <img src={assetUrl(mobilePage.image)} alt={mobilePage.imageAlt} />
              <div>
                <span>{mobilePage.kicker}</span>
                <h1>{mobilePage.title}</h1>
                <p>{mobilePage.intro}</p>
              </div>
            </section>

            <section className="mobile-campaign-section">
              <small>{mobilePage.sectionLabel}</small>
              <h2>{mobilePage.sectionTitle}</h2>
              <p>{mobilePage.sectionBody}</p>
              <div className="mobile-campaign-tags">
                {mobilePage.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </section>

            <section className="mobile-campaign-section">
              <small>{mobilePage.audienceLabel}</small>
              <h2>{mobilePage.audienceTitle}</h2>
              <p>{mobilePage.audienceBody}</p>
            </section>

            <section className="mobile-campaign-coupon">
              <small>限时优惠券</small>
              <strong>{page.coupon}</strong>
              <p>登录会员账号领取；新顾客也可以输入手机号领取。</p>
              <form onSubmit={(event) => event.preventDefault()}>
                <input aria-label="手机号" placeholder="输入手机号领取优惠券" />
                <button type="submit">领取</button>
              </form>
            </section>

            <section className="mobile-campaign-share">
              <button onClick={shareCampaign}>
                <Share2 size={16} />
                分享给微信好友
              </button>
              <p>在微信内打开时，可通过右上角菜单转发给好友或朋友圈。</p>
            </section>
          </div>
        </section>
      </main>

      {qrOpen && (
        <div className="qr-modal-backdrop" onClick={() => setQrOpen(false)}>
          <div className="qr-modal" role="dialog" aria-modal="true" aria-label="活动页二维码" onClick={(event) => event.stopPropagation()}>
            <button className="qr-modal-close" type="button" onClick={() => setQrOpen(false)} aria-label="关闭二维码">
              <X size={16} />
            </button>
            <strong>扫码打开活动页</strong>
            <img src={qrLargeUrl} alt="活动页二维码" />
            <p>用手机微信扫一扫获取当前页面链接。</p>
            <button type="button" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
              <Copy size={15} />
              复制页面链接
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; alt: string; src: string }

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const paragraph: string[] = []
  const listItems: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    paragraph.length = 0
  }
  const flushList = () => {
    if (!listItems.length) return
    blocks.push({ type: 'list', items: [...listItems] })
    listItems.length = 0
  }

  markdown.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      return
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      return
    }

    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line)
    if (image) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'image', alt: image[1], src: image[2] })
      return
    }

    const listItem = /^-\s+(.+)$/.exec(line)
    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      return
    }

    flushList()
    paragraph.push(line)
  })

  flushParagraph()
  flushList()
  return blocks
}

function renderMarkdownInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    nodes.push(<strong key={`${keyPrefix}-strong-${match.index}`}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function resolveMarkdownAsset(src: string) {
  if (/^(https?:|data:|blob:|\/)/i.test(src)) return src
  return assetUrl(src)
}

function MarkdownHeading({ level, children }: { level: number; children: ReactNode }) {
  if (level <= 2) return <h2>{children}</h2>
  if (level === 3) return <h3>{children}</h3>
  return <h4>{children}</h4>
}

function CreativeMarkdownAnswer({ output }: { output: CreativeOutput }) {
  return (
    <div className="markdown-answer markdown-rendered">
      {parseMarkdown(output.markdown).map((block, index) => {
        if (block.type === 'heading') {
          return (
            <MarkdownHeading key={`md-${index}`} level={block.level}>
              {renderMarkdownInline(block.text, `md-${index}`)}
            </MarkdownHeading>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={`md-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`md-${index}-${itemIndex}`}>
                  {renderMarkdownInline(item, `md-${index}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'image') {
          return <img key={`md-${index}`} src={resolveMarkdownAsset(block.src)} alt={block.alt} />
        }
        return <p key={`md-${index}`}>{renderMarkdownInline(block.text, `md-${index}`)}</p>
      })}
    </div>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState('marketing-page')
  const [prompt, setPrompt] = useState('')
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>('history-marketing-page')
  const [approved, setApproved] = useState(false)
  const [toast, setToast] = useState('')
  const [usage, setUsage] = useState(getInitialUsage)
  const [suggestionIds, setSuggestionIds] = useState(randomSuggestionIds)
  const [railFocus, setRailFocus] = useState<RailFocus>('balanced')
  const [reportPinned, setReportPinned] = useState(isReportPinned)
  const [copyShareTargetId, setCopyShareTargetId] = useState<CopyShareTargetId | null>(null)
  const hideCommonFeatures = true

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0],
    [activeId],
  )
  const reportScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === reportScenarioId) ?? scenarios[0],
    [],
  )
  const copyShareTarget = copyShareTargets.find((target) => target.id === copyShareTargetId)
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

  if (window.location.hash.split('?')[0] === '#/campaigns/spring-salad') {
    return (
      <>
        <MarketingPage page={springSaladCampaign} onSavePoster={() => notify('已生成海报，可用于朋友圈和门店物料')} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </>
    )
  }

  if (window.location.hash.split('?')[0] === '#/campaigns/weekend-banquet') {
    return (
      <>
        <MarketingPage page={weekendBanquetCampaign} onSavePoster={() => notify('已生成海报，可用于朋友圈和门店物料')} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </>
    )
  }

  if (window.location.hash.startsWith('#/coupon-center')) {
    return <CouponCenterPage />
  }

  return (
    <div className={`ai-shell ${rightOpen ? '' : 'without-context'}`}>
      <aside className={`left-rail ${leftOpen ? 'is-open' : ''}`}>
        <div className="brand-row">
          <span className="brand-mark"><img src={assetUrl('shengyitong-robot-logo.png')} alt="盛意通" /></span>
          <div className="brand-copy">
            <img className="brand-text-logo" src={assetUrl('shengyitong-text-logo.png')} alt="盛意通" />
            <small>AI 营销平台</small>
          </div>
          <button className="icon-btn close-mobile" aria-label="关闭菜单" onClick={() => setLeftOpen(false)}><X size={19} /></button>
        </div>
        <button className="new-task" onClick={createNewSession}><Plus size={17} />新增会话</button>
        <div className={`rail-workspace ${hideCommonFeatures ? 'hide-common' : `focus-${railFocus}`}`}>
          <section className="rail-block compact" hidden={hideCommonFeatures}>
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
              <p className="rail-label">会话</p>
              <button
                className="rail-more-button"
                aria-pressed={railFocus === 'history'}
                onClick={() => setRailFocus((current) => current === 'history' ? 'balanced' : 'history')}
                hidden={hideCommonFeatures}
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
            <button className="icon-btn" title={rightOpen ? '收起工作台' : '展开工作台'} aria-label={rightOpen ? '收起工作台' : '展开工作台'} onClick={() => setRightOpen(!rightOpen)}>
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
              {activeScenario.id === 'marketing-page' && activeScenario.marketingPage ? (
                <>
                  {activeScenario.creativeOutput && <CreativeMarkdownAnswer output={activeScenario.creativeOutput} />}

                  <div className="report-link-card">
                    <LayoutDashboard size={18} />
                    <div>
                      <span>已生成领取页</span>
                      <a href={activeScenario.marketingPage.href} target="_blank" rel="noreferrer">
                        {activeScenario.marketingPage.title}
                        <ExternalLink size={14} />
                      </a>
                      <p>{activeScenario.marketingPage.description}</p>
                    </div>
                  </div>
                </>
              ) : activeScenario.creativeOutput ? (
                <>
                  <CreativeMarkdownAnswer output={activeScenario.creativeOutput} />

                  {activeScenario.id === 'copy-platform' && (
                    <div className="copy-share-actions">
                      <strong>平台分享</strong>
                      <div>
                        {copyShareTargets.map((target) => (
                          <button key={target.id} type="button" onClick={() => setCopyShareTargetId(target.id)}>
                            <Share2 size={15} />
                            {target.action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeScenario.marketingPage && (
                    <div className="report-link-card">
                      <LayoutDashboard size={18} />
                      <div>
                        <span>已生成领取页</span>
                        <a href={activeScenario.marketingPage.href} target="_blank" rel="noreferrer">
                          {activeScenario.marketingPage.title}
                          <ExternalLink size={14} />
                        </a>
                        <p>{activeScenario.marketingPage.description}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
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

              {activeScenario.marketingPage && (
                <div className="report-link-card">
                  <LayoutDashboard size={18} />
                  <div>
                    <span>已生成营销页</span>
                    <a href={activeScenario.marketingPage.href} target="_blank" rel="noreferrer">
                      {activeScenario.marketingPage.title}
                      <ExternalLink size={14} />
                    </a>
                    <p>{activeScenario.marketingPage.description}</p>
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

              {activeScenario.id === 'copy-platform' && (
                <div className="copy-share-actions">
                  <strong>平台分享</strong>
                  <div>
                    {copyShareTargets.map((target) => (
                      <button key={target.id} type="button" onClick={() => setCopyShareTargetId(target.id)}>
                        <Share2 size={15} />
                        {target.action}
                      </button>
                    ))}
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
                </>
              )}
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
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveId(item.id)
                        setPrompt(item.starter)
                      }}
                    >
                      {item.starter}
                    </button>
                  ))}
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
            <div><strong>工作台</strong></div>
            <button className="icon-btn" aria-label="关闭工作台" onClick={() => setRightOpen(false)}><X size={18} /></button>
          </div>
          <section>
            <div className="context-title"><span>活动能力</span></div>
            <div className="marketing-side-grid">
              {([
                ['活动管理', '活动方案、领券页、渠道和状态', Megaphone, '#/coupon-center/campaigns'],
                ['券批次管理', '券批次、库存、规则和同步状态', TicketPercent, '#/coupon-center/stocks'],
                ['用户领券记录', '领取用户、渠道、卡包入账状态', Users, '#/coupon-center/claims'],
                ['核销管理', '订单实付、优惠抵扣、核销状态', WalletCards, '#/coupon-center/redemptions'],
                ['券使用报表', '访问、领券、核销、GMV 和成本', BarChart3, '#/coupon-center/reports'],
              ] as Array<[string, string, LucideIcon, string]>).map(([name, detail, Icon, href]) => (
                <button
                  key={name}
                  onClick={() => {
                    window.open(`${window.location.origin}${window.location.pathname}${href}`, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <Icon size={16} />
                  <span>{name}</span>
                  <small>{detail}</small>
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="context-title"><span>活动指标</span><small>{activeScenario.context.updatedAt} 更新</small></div>
            <div className="mini-metrics">
              {[
                ['页面访问', '386', '+86', 'up'],
                ['领券人数', '128', '33.2%', 'up'],
                ['核销订单', '47', '36.7%', 'up'],
                ['优惠抵扣', '¥376', '自动抵扣', 'flat'],
              ].map(([label, value, delta, trend]) => <div key={label}><span>{label}</span><strong>{value}</strong><small className={trend}>{delta}</small></div>)}
            </div>
          </section>
        </aside>
      )}
      {copyShareTarget && (
        <div className="qr-modal-backdrop" onClick={() => setCopyShareTargetId(null)}>
          <div className="qr-modal copy-share-modal" role="dialog" aria-modal="true" aria-label={`${copyShareTarget.action}二维码`} onClick={(event) => event.stopPropagation()}>
            <button className="qr-modal-close" type="button" onClick={() => setCopyShareTargetId(null)} aria-label="关闭二维码">
              <X size={17} />
            </button>
            <strong>{copyShareTarget.action}</strong>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(getCopyShareUrl(copyShareTarget))}`}
              alt={`${copyShareTarget.action}二维码`}
            />
            <p>用{copyShareTarget.appName}扫码打开，系统会带入 3:4 海报图片、标题和文案内容。</p>
            <div className="copy-share-preview">
              <span>{copyShareTarget.title}</span>
              <small>{copyShareTarget.text}</small>
            </div>
            <button type="button" onClick={() => navigator.clipboard?.writeText(getCopyShareUrl(copyShareTarget))}>
              <Copy size={15} />
              复制跳转链接
            </button>
          </div>
        </div>
      )}
      {leftOpen && <button className="backdrop" aria-label="关闭菜单" onClick={() => setLeftOpen(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

