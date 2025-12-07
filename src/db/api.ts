import {supabase} from '@/client/supabase'
import {StepGenerator} from './stepGenerator'
import type {
  CreateEventInput,
  CreateStepInput,
  Event,
  EventStatus,
  EventWithSteps,
  Step,
  UpdateEventInput,
  UpdateStepInput
} from './types'

export async function getEvents(status?: EventStatus): Promise<Event[]> {
  let query = supabase.from('events').select('*').order('created_at', {ascending: false})

  if (status) {
    query = query.eq('status', status)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取事件列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

export async function getEventById(id: string): Promise<Event | null> {
  const {data, error} = await supabase.from('events').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取事件详情失败:', error)
    return null
  }

  return data
}

export async function getEventWithSteps(id: string): Promise<EventWithSteps | null> {
  const event = await getEventById(id)
  if (!event) return null

  const steps = await getStepsByEventId(id)

  return {
    ...event,
    steps
  }
}

export async function createEvent(input: CreateEventInput): Promise<Event | null> {
  const {data: userData} = await supabase.auth.getUser()
  if (!userData.user) {
    console.error('用户未登录')
    return null
  }

  const {data, error} = await supabase
    .from('events')
    .insert({
      user_id: userData.user.id,
      title: input.title,
      description: input.description || null,
      deadline: input.deadline || null,
      priority: input.priority || 'medium',
      category: input.category || null,
      start_time: input.start_time || null,
      reminder_type: input.reminder_type || null
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建事件失败:', error)
    return null
  }

  if (data) {
    await StepGenerator.createStepsForEvent(data.id, input.title, input.description, input.category)
  }

  return data
}

export async function createEventWithCustomSteps(
  input: CreateEventInput,
  customSteps: CreateStepInput[]
): Promise<Event | null> {
  const {data: userData} = await supabase.auth.getUser()
  if (!userData.user) {
    console.error('用户未登录')
    return null
  }

  const {data, error} = await supabase
    .from('events')
    .insert({
      user_id: userData.user.id,
      title: input.title,
      description: input.description || null,
      deadline: input.deadline || null,
      priority: input.priority || 'medium',
      category: input.category || null,
      start_time: input.start_time || null,
      reminder_type: input.reminder_type || null
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建事件失败:', error)
    return null
  }

  if (data && customSteps.length > 0) {
    // 创建自定义步骤
    const stepsToCreate = customSteps.map((step) => ({
      ...step,
      event_id: data.id
    }))

    const {error: stepsError} = await supabase.from('steps').insert(stepsToCreate)

    if (stepsError) {
      console.error('创建步骤失败:', stepsError)
    } else {
      // 同步步骤到描述
      const {data: createdSteps} = await supabase
        .from('steps')
        .select('*')
        .eq('event_id', data.id)
        .order('order_index', {ascending: true})

      if (createdSteps && createdSteps.length > 0) {
        const {stepsToDescription} = await import('@/utils/stepDescriptionSync')
        const newDescription = stepsToDescription(createdSteps)
        await supabase.from('events').update({description: newDescription}).eq('id', data.id)
      }
    }
  }

  return data
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<boolean> {
  const {error} = await supabase.from('events').update(input).eq('id', id)

  if (error) {
    console.error('更新事件失败:', error)
    return false
  }

  return true
}

export async function deleteEvent(id: string): Promise<boolean> {
  const {error} = await supabase.from('events').delete().eq('id', id)

  if (error) {
    console.error('删除事件失败:', error)
    return false
  }

  return true
}

export async function completeEvent(id: string): Promise<boolean> {
  const now = new Date().toISOString()
  return await updateEvent(id, {
    status: 'completed',
    completed_at: now
  })
}

// 更新事件排序
export async function updateEventSortOrder(eventId: string, sortOrder: number): Promise<boolean> {
  const {error} = await supabase.from('events').update({sort_order: sortOrder}).eq('id', eventId)

  if (error) {
    console.error('更新事件排序失败:', error)
    return false
  }

  return true
}

// 批量更新事件排序
export async function batchUpdateEventSortOrder(updates: {id: string; sort_order: number}[]): Promise<boolean> {
  try {
    for (const update of updates) {
      await updateEventSortOrder(update.id, update.sort_order)
    }
    return true
  } catch (error) {
    console.error('批量更新事件排序失败:', error)
    return false
  }
}

export async function getStepsByEventId(eventId: string): Promise<Step[]> {
  const {data, error} = await supabase
    .from('steps')
    .select('*')
    .eq('event_id', eventId)
    .order('order_index', {ascending: true})

  if (error) {
    console.error('获取步骤列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

export async function createStep(input: CreateStepInput): Promise<Step | null> {
  const {data, error} = await supabase.from('steps').insert(input).select().maybeSingle()

  if (error) {
    console.error('创建步骤失败:', error)
    return null
  }

  return data
}

export async function updateStep(id: string, input: UpdateStepInput): Promise<boolean> {
  const {error} = await supabase.from('steps').update(input).eq('id', id)

  if (error) {
    console.error('更新步骤失败:', error)
    return false
  }

  return true
}

export async function deleteStep(id: string): Promise<boolean> {
  const {error} = await supabase.from('steps').delete().eq('id', id)

  if (error) {
    console.error('删除步骤失败:', error)
    return false
  }

  return true
}

export async function toggleStepComplete(id: string, isCompleted: boolean): Promise<boolean> {
  const completedAt = isCompleted ? new Date().toISOString() : null
  return await updateStep(id, {
    is_completed: isCompleted,
    completed_at: completedAt
  })
}

export async function reorderSteps(steps: {id: string; order_index: number}[]): Promise<boolean> {
  try {
    for (const step of steps) {
      await updateStep(step.id, {order_index: step.order_index})
    }
    return true
  } catch (error) {
    console.error('重新排序步骤失败:', error)
    return false
  }
}

export async function getCompletedEvents(): Promise<Event[]> {
  return await getEvents('completed')
}

export async function getPendingEvents(): Promise<Event[]> {
  const {data, error} = await supabase.from('events').select('*').in('status', ['pending', 'in_progress'])

  if (error) {
    console.error('获取待办事件失败:', error)
    return []
  }

  if (!Array.isArray(data)) return []

  // 自定义排序：优先级（高→中→低）> sort_order > 创建时间
  const priorityOrder = {high: 1, medium: 2, low: 3}
  return data.sort((a, b) => {
    // 1. 按优先级排序
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // 2. 按 sort_order 排序
    const sortOrderDiff = a.sort_order - b.sort_order
    if (sortOrderDiff !== 0) return sortOrderDiff

    // 3. 按创建时间排序
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

// 获取所有事件（包括已完成的），用于首页显示
export async function getAllEventsForHome(): Promise<Event[]> {
  const {data, error} = await supabase.from('events').select('*')

  if (error) {
    console.error('获取事件失败:', error)
    return []
  }

  if (!Array.isArray(data)) return []

  // 自定义排序：状态（待办→进行中→已完成）> 优先级（高→中→低）> sort_order > 创建时间
  const statusOrder = {pending: 1, in_progress: 2, completed: 3}
  const priorityOrder = {high: 1, medium: 2, low: 3}

  return data.sort((a, b) => {
    // 1. 按状态排序（待办和进行中在前，已完成在后）
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff

    // 2. 按优先级排序
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // 3. 按 sort_order 排序
    const sortOrderDiff = a.sort_order - b.sort_order
    if (sortOrderDiff !== 0) return sortOrderDiff

    // 4. 按创建时间排序
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

export async function getEventStats() {
  const {data: userData} = await supabase.auth.getUser()
  if (!userData.user) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    }
  }

  const {data, error} = await supabase.from('events').select('status').eq('user_id', userData.user.id)

  if (error) {
    console.error('获取统计数据失败:', error)
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    }
  }

  const events = Array.isArray(data) ? data : []

  return {
    total: events.length,
    pending: events.filter((e) => e.status === 'pending').length,
    inProgress: events.filter((e) => e.status === 'in_progress').length,
    completed: events.filter((e) => e.status === 'completed').length
  }
}

// 获取上月创建的事件
export async function getLastMonthEvents(): Promise<Event[]> {
  const {data: userData} = await supabase.auth.getUser()
  if (!userData.user) {
    return []
  }

  // 计算上个月的起始和结束日期
  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const {data, error} = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userData.user.id)
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString())

  if (error) {
    console.error('获取上月事件失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// 删除上月创建的所有事件
export async function deleteLastMonthEvents(): Promise<{success: boolean; count: number}> {
  const {data: userData} = await supabase.auth.getUser()
  if (!userData.user) {
    return {success: false, count: 0}
  }

  // 计算上个月的起始和结束日期
  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // 先获取要删除的事件数量
  const eventsToDelete = await getLastMonthEvents()
  const count = eventsToDelete.length

  if (count === 0) {
    return {success: true, count: 0}
  }

  // 删除上月的所有事件
  const {error} = await supabase
    .from('events')
    .delete()
    .eq('user_id', userData.user.id)
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString())

  if (error) {
    console.error('删除上月事件失败:', error)
    return {success: false, count: 0}
  }

  return {success: true, count}
}
