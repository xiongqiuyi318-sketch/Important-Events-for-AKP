import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {deleteEvent, deleteStep, getEventWithSteps, toggleStepComplete, updateEvent, updateStep} from '@/db/api'
import type {EventWithSteps, ReminderType, Step} from '@/db/types'
import {stepsToDescription} from '@/utils/stepDescriptionSync'

// 辅助函数：获取提醒方式的显示文本和图标
const getReminderDisplay = (reminderType: ReminderType) => {
  const displays = {
    start_sound: {text: '开始时铃声提醒', icon: 'i-mdi-bell-ring'},
    start_vibrate: {text: '开始时振动提醒', icon: 'i-mdi-vibrate'},
    deadline_sound: {text: '截止时铃声提醒', icon: 'i-mdi-bell-ring'},
    deadline_vibrate: {text: '截止时振动提醒', icon: 'i-mdi-vibrate'},
    both_sound: {text: '开始和截止都铃声提醒', icon: 'i-mdi-bell-ring'},
    both_vibrate: {text: '开始和截止都振动提醒', icon: 'i-mdi-vibrate'}
  }
  return displays[reminderType as keyof typeof displays] || {text: '', icon: ''}
}

const EventDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const eventId = router.params.id || ''
  const [event, setEvent] = useState<EventWithSteps | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepTitle, setEditingStepTitle] = useState('')
  const [editingStatusStepId, setEditingStatusStepId] = useState<string | null>(null)
  const [editingStatusValue, setEditingStatusValue] = useState('')

  const loadData = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const data = await getEventWithSteps(eventId)
      setEvent(data)
    } catch (error) {
      console.error('加载事件详情失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useDidShow(() => {
    loadData()
  })

  // 同步步骤到描述
  const syncStepsToDescription = useCallback(
    async (steps: Step[]) => {
      if (!event) return
      const newDescription = stepsToDescription(steps)
      await updateEvent(eventId, {description: newDescription})
    },
    [event, eventId]
  )

  const handleToggleStep = async (stepId: string, isCompleted: boolean) => {
    const success = await toggleStepComplete(stepId, !isCompleted)
    if (success) {
      loadData()
    } else {
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleStartEdit = (step: Step) => {
    setEditingStepId(step.id)
    setEditingStepTitle(step.title)
  }

  const handleSaveEdit = async () => {
    if (!editingStepId || !editingStepTitle.trim() || !event) return

    const success = await updateStep(editingStepId, {title: editingStepTitle.trim()})
    if (success) {
      setEditingStepId(null)
      setEditingStepTitle('')
      // 重新加载数据
      const updatedEvent = await getEventWithSteps(eventId)
      setEvent(updatedEvent)
      // 同步步骤到描述
      await syncStepsToDescription(updatedEvent.steps)
      Taro.showToast({title: '保存成功', icon: 'success'})
    } else {
      Taro.showToast({title: '保存失败', icon: 'none'})
    }
  }

  const handleCancelEdit = () => {
    setEditingStepId(null)
    setEditingStepTitle('')
  }

  const handleStartEditStatus = (step: Step) => {
    setEditingStatusStepId(step.id)
    setEditingStatusValue(step.status || '')
  }

  const handleSaveStatus = async () => {
    if (!editingStatusStepId) return

    const success = await updateStep(editingStatusStepId, {status: editingStatusValue.trim() || null})
    if (success) {
      setEditingStatusStepId(null)
      setEditingStatusValue('')
      loadData()
      Taro.showToast({title: '状态已更新', icon: 'success'})
    } else {
      Taro.showToast({title: '更新失败', icon: 'none'})
    }
  }

  const handleCancelEditStatus = () => {
    setEditingStatusStepId(null)
    setEditingStatusValue('')
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!event) return

    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个步骤吗？'
    })

    if (res.confirm) {
      const success = await deleteStep(stepId)
      if (success) {
        // 重新加载数据
        const updatedEvent = await getEventWithSteps(eventId)
        setEvent(updatedEvent)
        // 同步步骤到描述
        await syncStepsToDescription(updatedEvent.steps)
        Taro.showToast({title: '删除成功', icon: 'success'})
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    }
  }

  const handleAddStep = async () => {
    Taro.navigateTo({
      url: `/pages/add-step/index?eventId=${eventId}`
    })
  }

  const handleUpdateStatus = async (status: 'pending' | 'in_progress' | 'completed') => {
    const success = await updateEvent(eventId, {status})
    if (success) {
      loadData()
      Taro.showToast({title: '状态已更新', icon: 'success'})
    } else {
      Taro.showToast({title: '更新失败', icon: 'none'})
    }
  }

  const handleDeleteEvent = async () => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个事件吗？删除后无法恢复。'
    })

    if (res.confirm) {
      const success = await deleteEvent(eventId)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待开始'
      case 'in_progress':
        return '进行中'
      case 'completed':
        return '已完成'
      default:
        return ''
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级'
      case 'medium':
        return '中优先级'
      case 'low':
        return '低优先级'
      default:
        return ''
    }
  }

  const calculateProgress = () => {
    if (!event || event.steps.length === 0) return 0
    const completedCount = event.steps.filter((s) => s.is_completed).length
    return Math.round((completedCount / event.steps.length) * 100)
  }

  if (!user || loading || !event) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  const progress = calculateProgress()
  const completedSteps = event.steps.filter((s) => s.is_completed).length

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          <View className="bg-card rounded-lg p-4 shadow-sm mb-4">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-xl font-bold text-foreground">{event.title}</Text>
              <Button
                className="bg-accent text-accent-foreground px-3 py-1 rounded text-xs break-keep"
                size="mini"
                onClick={() => Taro.navigateTo({url: `/pages/edit-event/index?id=${eventId}`})}>
                编辑描述
              </Button>
            </View>
            {event.description && <Text className="text-sm text-muted-foreground mb-3">{event.description}</Text>}

            <View className="flex items-center gap-2 mb-3">
              <View className="px-3 py-1 rounded bg-primary">
                <Text className="text-xs text-primary-foreground">{getPriorityText(event.priority)}</Text>
              </View>
              <View className="px-3 py-1 rounded bg-secondary">
                <Text className="text-xs text-secondary-foreground">{getStatusText(event.status)}</Text>
              </View>
              {event.category && (
                <View className="px-3 py-1 rounded bg-muted">
                  <Text className="text-xs text-muted-foreground">{event.category}</Text>
                </View>
              )}
            </View>

            {event.deadline && (
              <View className="flex items-center mb-3">
                <View className="i-mdi-clock-outline text-base text-muted-foreground mr-1"></View>
                <Text className="text-sm text-muted-foreground">
                  截止时间：
                  {new Date(event.deadline).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </Text>
              </View>
            )}

            {event.start_time && (
              <View className="flex items-center mb-3">
                <View className="i-mdi-calendar-start text-base text-blue-600 mr-1"></View>
                <Text className="text-sm text-blue-600">
                  开始时间：
                  {new Date(event.start_time).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}

            {event.reminder_type &&
              event.reminder_type !== 'none' &&
              (() => {
                const display = getReminderDisplay(event.reminder_type)
                return display.text ? (
                  <View className="flex items-center mb-3">
                    <View className={`${display.icon} text-base text-orange-600 mr-1`}></View>
                    <Text className="text-sm text-orange-600">提醒：{display.text}</Text>
                  </View>
                ) : null
              })()}

            <View className="mb-2">
              <View className="flex items-center justify-between mb-1">
                <Text className="text-sm text-foreground">完成进度</Text>
                <Text className="text-sm font-semibold text-primary">{progress}%</Text>
              </View>
              <View className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <View className="h-full bg-primary transition-all" style={{width: `${progress}%`}}></View>
              </View>
              <Text className="text-xs text-muted-foreground mt-1">
                已完成 {completedSteps}/{event.steps.length} 个步骤
              </Text>
            </View>
          </View>

          <View className="flex items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">执行步骤</Text>
            <Button
              className="bg-accent text-accent-foreground px-4 py-2 rounded text-xs break-keep"
              size="mini"
              onClick={handleAddStep}>
              添加步骤
            </Button>
          </View>

          {event.steps.length === 0 ? (
            <View className="bg-card rounded-lg p-8 text-center">
              <View className="i-mdi-format-list-checks text-4xl text-muted mb-2"></View>
              <Text className="text-muted-foreground">暂无步骤</Text>
            </View>
          ) : (
            <View className="space-y-2">
              {event.steps.map((step, index) => (
                <View
                  key={step.id}
                  className={`bg-card rounded-lg p-4 shadow-sm ${step.is_completed ? 'opacity-60' : ''}`}>
                  <View className="flex items-start gap-3">
                    <View
                      className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                        step.is_completed ? 'bg-success' : 'bg-secondary'
                      }`}
                      onClick={() => handleToggleStep(step.id, step.is_completed)}>
                      {step.is_completed ? (
                        <View className="i-mdi-check text-success-foreground text-base"></View>
                      ) : (
                        <Text className="text-xs text-secondary-foreground">{index + 1}</Text>
                      )}
                    </View>

                    <View className="flex-1">
                      {editingStepId === step.id ? (
                        <View>
                          <View style={{overflow: 'hidden'}}>
                            <Input
                              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full mb-2"
                              value={editingStepTitle}
                              onInput={(e) => setEditingStepTitle(e.detail.value)}
                              focus
                            />
                          </View>
                          <View className="flex items-center gap-2">
                            <Button
                              className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs break-keep"
                              size="mini"
                              onClick={handleSaveEdit}>
                              保存
                            </Button>
                            <Button
                              className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-xs break-keep"
                              size="mini"
                              onClick={handleCancelEdit}>
                              取消
                            </Button>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <Text
                            className={`text-base ${step.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {step.title}
                          </Text>
                          {step.description && (
                            <Text className="text-sm text-muted-foreground mt-1">{step.description}</Text>
                          )}
                          {step.is_auto_generated && (
                            <View className="flex items-center mt-1">
                              <View className="i-mdi-auto-fix text-xs text-accent mr-1"></View>
                              <Text className="text-xs text-accent">智能生成</Text>
                            </View>
                          )}

                          {/* 步骤状态显示 */}
                          {editingStatusStepId === step.id ? (
                            <View className="mt-2 bg-muted p-3 rounded-lg">
                              <Text className="text-xs text-muted-foreground mb-2">编辑步骤状态</Text>
                              <View style={{overflow: 'hidden'}}>
                                <Input
                                  className="bg-background text-foreground px-3 py-2 rounded border border-border w-full mb-2"
                                  placeholder="请输入步骤状态，例如：进行中、等待审批等"
                                  value={editingStatusValue}
                                  onInput={(e) => setEditingStatusValue(e.detail.value)}
                                  maxlength={50}
                                  focus
                                />
                              </View>
                              <View className="flex items-center gap-2">
                                <Button
                                  className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs break-keep"
                                  size="mini"
                                  onClick={handleSaveStatus}>
                                  确认
                                </Button>
                                <Button
                                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-xs break-keep"
                                  size="mini"
                                  onClick={handleCancelEditStatus}>
                                  取消
                                </Button>
                              </View>
                            </View>
                          ) : (
                            step.status && (
                              <View className="mt-2 bg-accent/10 px-3 py-2 rounded-lg flex items-center">
                                <View className="i-mdi-information-outline text-sm text-accent mr-2"></View>
                                <Text className="text-sm text-accent flex-1">状态：{step.status}</Text>
                              </View>
                            )
                          )}

                          <View className="flex items-center gap-2 mt-2">
                            {!step.is_completed && (
                              <Button
                                className="bg-success text-success-foreground px-3 py-1 rounded text-xs break-keep"
                                size="mini"
                                onClick={() => handleToggleStep(step.id, step.is_completed)}>
                                已完成
                              </Button>
                            )}
                            <Button
                              className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs break-keep"
                              size="mini"
                              onClick={() => handleStartEdit(step)}>
                              编辑步骤
                            </Button>
                            <Button
                              className="bg-accent text-accent-foreground px-3 py-1 rounded text-xs break-keep"
                              size="mini"
                              onClick={() => handleStartEditStatus(step)}>
                              编辑状态
                            </Button>
                            <Button
                              className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-xs break-keep"
                              size="mini"
                              onClick={() => handleDeleteStep(step.id)}>
                              删除
                            </Button>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className="mt-6 space-y-3">
            <Text className="text-sm font-medium text-foreground mb-2">快速操作</Text>
            <View className="flex items-center gap-2">
              {event.status !== 'in_progress' && (
                <Button
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg text-sm break-keep"
                  size="default"
                  onClick={() => handleUpdateStatus('in_progress')}>
                  开始执行
                </Button>
              )}
              {event.status !== 'completed' && (
                <Button
                  className="flex-1 bg-success text-success-foreground py-3 rounded-lg text-sm break-keep"
                  size="default"
                  onClick={() => handleUpdateStatus('completed')}>
                  标记完成
                </Button>
              )}
            </View>
            <Button
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-lg text-sm break-keep"
              size="default"
              onClick={handleDeleteEvent}>
              删除事件
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default EventDetail
