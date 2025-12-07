export type EventPriority = 'high' | 'medium' | 'low'
export type EventStatus = 'pending' | 'in_progress' | 'completed'
export type ReminderType =
  | 'none'
  | 'start_sound'
  | 'start_vibrate'
  | 'deadline_sound'
  | 'deadline_vibrate'
  | 'both_sound'
  | 'both_vibrate'
  | null

export interface Event {
  id: string
  user_id: string
  title: string
  description: string | null
  deadline: string | null
  priority: EventPriority
  status: EventStatus
  category: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  sort_order: number
  start_time: string | null
  reminder_type: ReminderType
}

export interface Step {
  id: string
  event_id: string
  title: string
  description: string | null
  order_index: number
  is_completed: boolean
  completed_at: string | null
  is_auto_generated: boolean
  category: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export interface StepTemplate {
  id: string
  category: string
  keywords: string[]
  template_steps: TemplateStep[]
  priority: number
  created_at: string
}

export interface TemplateStep {
  title: string
  description: string
  category: string
}

export interface EventWithSteps extends Event {
  steps: Step[]
}

export interface CreateEventInput {
  title: string
  description?: string
  deadline?: string
  priority?: EventPriority
  category?: string
  start_time?: string
  reminder_type?: string
}

export interface UpdateEventInput {
  title?: string
  description?: string
  deadline?: string
  priority?: EventPriority
  status?: EventStatus
  category?: string
  completed_at?: string
  start_time?: string
  reminder_type?: string
}

export interface CreateStepInput {
  event_id: string
  title: string
  description?: string
  order_index: number
  category?: string
  is_auto_generated?: boolean
}

export interface UpdateStepInput {
  title?: string
  description?: string
  order_index?: number
  is_completed?: boolean
  completed_at?: string
  category?: string
  status?: string | null
}
