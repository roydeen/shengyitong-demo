import { CalendarClock, ClipboardCheck, TrendingUp, TriangleAlert, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AiBusinessCategory = 'operation_alert' | 'growth_opportunity' | 'member_operation' | 'marketing_event' | 'execution_followup'

export const aiBusinessCategoryLabels: Record<AiBusinessCategory, string> = {
  operation_alert: '经营异常',
  growth_opportunity: '增长机会',
  member_operation: '会员经营',
  marketing_event: '营销节点',
  execution_followup: '执行跟进',
}

export const aiBusinessCategoryIcons: Record<AiBusinessCategory, LucideIcon> = {
  operation_alert: TriangleAlert,
  growth_opportunity: TrendingUp,
  member_operation: Users,
  marketing_event: CalendarClock,
  execution_followup: ClipboardCheck,
}
