import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useEffect, useState} from 'react'
import {createStep, deleteStep, getEventWithSteps, updateEvent} from '@/db/api'
import {StepGenerator} from '@/db/stepGenerator'
import type {CreateStepInput, EventPriority, EventWithSteps, ReminderType} from '@/db/types'
import {stepsToDescription} from '@/utils/stepDescriptionSync'

const EditEvent: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const eventId = router.params.id || ''
  const [event, setEvent] = useState<EventWithSteps | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<EventPriority>('medium')
  const [deadline, setDeadline] = useState('')
  const [startTime, setStartTime] = useState('')
  const [reminderType, setReminderType] = useState<ReminderType>(null)
  const [originalTitle, setOriginalTitle] = useState('')
  const [originalDescription, setOriginalDescription] = useState('')
  const [originalCategory, setOriginalCategory] = useState('')
  const [originalPriority, setOriginalPriority] = useState<EventPriority>('medium')
  const [originalDeadline, setOriginalDeadline] = useState('')
  const [originalStartTime, setOriginalStartTime] = useState('')
  const [originalReminderType, setOriginalReminderType] = useState<ReminderType>(null)
  const [previewSteps, setPreviewSteps] = useState<CreateStepInput[]>([])
  const [loading, setLoading] = useState(false)

  const categories = [
    '会议准备',
    '项目开发',
    '活动策划',
    '学习计划',
    '发货',
    '进口',
    '机械维修',
    '本地销售',
    '通用任务',
    '其他'
  ]
  const priorities: {label: string; value: EventPriority}[] = [
    {label: '高优先级', value: 'high'},
    {label: '中优先级', value: 'medium'},
    {label: '低优先级', value: 'low'}
  ]
  const reminderOptions = [
    {label: '不提醒', value: 'none'},
    {label: '开始时铃声提醒', value: 'start_sound'},
    {label: '开始时振动提醒', value: 'start_vibrate'},
    {label: '截止时铃声提醒', value: 'deadline_sound'},
    {label: '截止时振动提醒', value: 'deadline_vibrate'},
    {label: '开始和截止都铃声提醒', value: 'both_sound'},
    {label: '开始和截止都振动提醒', value: 'both_vibrate'}
  ]

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return
      setLoading(true)
      try {
        const data = await getEventWithSteps(eventId)
        setEvent(data)
        setTitle(data.title)
        setDescription(data.description || '')
        setCategory(data.category || '')
        setPriority(data.priority)
        setDeadline(data.deadline || '')
        setStartTime(data.start_time || '')
        setReminderType(data.reminder_type || null)
        setOriginalTitle(data.title)
        setOriginalDescription(data.description || '')
        setOriginalCategory(data.category || '')
        setOriginalPriority(data.priority)
        setOriginalDeadline(data.deadline || '')
        setOriginalStartTime(data.start_time || '')
        setOriginalReminderType(data.reminder_type || null)
      } catch (error) {
        console.error('加载事件失败:', error)
        Taro.showToast({title: '加载失败', icon: 'none'})
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [eventId])

  useEffect(() => {
    if (!event) return

    const generatePreview = async () => {
      if (description.trim()) {
        const steps = await StepGenerator.generateSteps(
          'preview',
          title,
          description || undefined,
          category || undefined
        )
        setPreviewSteps(steps)
      } else {
        setPreviewSteps([])
      }
    }

    const timer = setTimeout(() => {
      generatePreview()
    }, 500)

    return () => clearTimeout(timer)
  }, [description, title, category, event])

  const handleSave = async () => {
    if (!event || !user) return

    if (!title.trim()) {
      Taro.showToast({title: '请输入事件标题', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      // 更新事件信息
      const success = await updateEvent(eventId, {
        title: title.trim(),
        description,
        category: category || undefined,
        priority,
        deadline: deadline || undefined,
        start_time: startTime || undefined,
        reminder_type: reminderType === 'none' ? null : reminderType || undefined
      })
      if (!success) {
        Taro.showToast({title: '更新失败', icon: 'none'})
        return
      }

      Taro.showToast({title: '保存成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateSteps = async () => {
    if (!event || !user) return

    Taro.showModal({
      title: '重新生成步骤',
      content: '这将删除所有现有步骤并根据新描述生成新步骤，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          setLoading(true)
          try {
            // 删除所有现有步骤
            for (const step of event.steps) {
              await deleteStep(step.id)
            }

            // 生成新步骤
            const newSteps = await StepGenerator.generateSteps(
              eventId,
              title,
              description || undefined,
              category || undefined
            )

            // 创建新步骤
            for (const step of newSteps) {
              await createStep(step)
            }

            // 更新事件信息
            await updateEvent(eventId, {
              title: title.trim(),
              description,
              category: category || undefined,
              priority
            })

            Taro.showToast({title: '步骤已重新生成', icon: 'success'})
            setTimeout(() => {
              Taro.navigateBack()
            }, 1000)
          } catch (error) {
            console.error('重新生成步骤失败:', error)
            Taro.showToast({title: '操作失败', icon: 'none'})
          } finally {
            setLoading(false)
          }
        }
      }
    })
  }

  const handleSyncStepsToDescription = () => {
    if (!event || event.steps.length === 0) return

    const stepsText = stepsToDescription(event.steps)
    setDescription(stepsText)
    Taro.showToast({title: '已同步到描述', icon: 'success', duration: 1500})
  }

  // 一键退出功能
  const handleQuickExit = () => {
    const hasChanges =
      title !== originalTitle ||
      description !== originalDescription ||
      category !== originalCategory ||
      priority !== originalPriority ||
      deadline !== originalDeadline ||
      startTime !== originalStartTime ||
      reminderType !== originalReminderType

    if (!hasChanges) {
      // 没有修改，直接退出
      Taro.navigateBack()
      return
    }

    // 有修改，询问用户
    Taro.showModal({
      title: '退出编辑',
      content: '检测到您有未保存的修改，是否保存后退出？',
      confirmText: '保存并退出',
      cancelText: '不保存',
      success: async (res) => {
        if (res.confirm) {
          // 保存并退出
          if (!title.trim()) {
            Taro.showToast({title: '请输入事件标题', icon: 'none'})
            return
          }
          setLoading(true)
          try {
            const success = await updateEvent(eventId, {
              title: title.trim(),
              description,
              category: category || undefined,
              priority,
              deadline: deadline || undefined,
              start_time: startTime || undefined,
              reminder_type: reminderType === 'none' ? null : reminderType || undefined
            })
            if (success) {
              Taro.showToast({title: '保存成功', icon: 'success'})
              setTimeout(() => {
                Taro.navigateBack()
              }, 1000)
            } else {
              Taro.showToast({title: '保存失败', icon: 'none'})
              setLoading(false)
            }
          } catch (error) {
            console.error('保存失败:', error)
            Taro.showToast({title: '保存失败', icon: 'none'})
            setLoading(false)
          }
        } else if (res.cancel) {
          // 不保存，直接退出
          Taro.navigateBack()
        }
      }
    })
  }

  if (!user || loading || !event) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 顶部一键退出按钮 */}
          <View className="flex items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">编辑事件</Text>
            <Button
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm break-keep"
              size="mini"
              onClick={handleQuickExit}>
              <View className="flex items-center">
                <View className="i-mdi-exit-to-app text-base mr-1"></View>
                <Text className="text-slate-700 font-medium">退出</Text>
              </View>
            </Button>
          </View>

          {/* 事件信息 */}
          <View className="bg-card rounded-lg p-4 shadow-sm mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">事件信息</Text>

            {/* 标题 */}
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">标题</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入事件标题"
                  value={title}
                  onInput={(e) => setTitle(e.detail.value)}
                  maxlength={100}
                />
              </View>
            </View>

            {/* 分类 */}
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">分类</Text>
              <Picker
                mode="selector"
                range={categories}
                value={categories.indexOf(category) >= 0 ? categories.indexOf(category) : 0}
                onChange={(e) => setCategory(categories[e.detail.value])}>
                <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full flex items-center justify-between">
                  <Text className={category ? 'text-foreground' : 'text-muted-foreground'}>
                    {category || '请选择分类'}
                  </Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 优先级 */}
            <View className="mb-0">
              <Text className="text-sm text-muted-foreground mb-1">优先级</Text>
              <Picker
                mode="selector"
                range={priorities.map((p) => p.label)}
                value={priorities.findIndex((p) => p.value === priority)}
                onChange={(e) => setPriority(priorities[e.detail.value].value)}>
                <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full flex items-center justify-between">
                  <Text className="text-foreground">
                    {priorities.find((p) => p.value === priority)?.label || '中优先级'}
                  </Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 截止时间 */}
            <View className="mb-0">
              <View className="flex items-center justify-between mb-1">
                <Text className="text-sm text-muted-foreground">截止时间</Text>
                {deadline && (
                  <Text className="text-xs text-red-500" onClick={() => setDeadline('')}>
                    清除
                  </Text>
                )}
              </View>
              <Picker mode="date" value={deadline} onChange={(e) => setDeadline(e.detail.value)}>
                <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full flex items-center justify-between">
                  <Text className={deadline ? 'text-foreground' : 'text-muted-foreground'}>
                    {deadline ? deadline.replace(/-/g, '/') : '选择截止时间（可选）'}
                  </Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 开始时间 */}
            <View className="mb-0">
              <View className="flex items-center justify-between mb-1">
                <Text className="text-sm text-muted-foreground">开始时间</Text>
                {startTime && (
                  <Text className="text-xs text-red-500" onClick={() => setStartTime('')}>
                    清除
                  </Text>
                )}
              </View>
              <Picker
                mode="multiSelector"
                value={[0, 0, 0, 0, 0]}
                range={[
                  Array.from({length: 10}, (_, i) => 2025 + i),
                  Array.from({length: 12}, (_, i) => i + 1),
                  Array.from({length: 31}, (_, i) => i + 1),
                  Array.from({length: 24}, (_, i) => i),
                  Array.from({length: 60}, (_, i) => i)
                ]}
                onChange={(e) => {
                  const [year, month, day, hour, minute] = e.detail.value
                  const picker = e.currentTarget as any
                  const ranges = picker.range as number[][]
                  const selectedYear = ranges[0][year]
                  const selectedMonth = String(ranges[1][month]).padStart(2, '0')
                  const selectedDay = String(ranges[2][day]).padStart(2, '0')
                  const selectedHour = String(ranges[3][hour]).padStart(2, '0')
                  const selectedMinute = String(ranges[4][minute]).padStart(2, '0')
                  setStartTime(`${selectedYear}-${selectedMonth}-${selectedDay} ${selectedHour}:${selectedMinute}`)
                }}>
                <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full flex items-center justify-between">
                  <Text className={startTime ? 'text-foreground' : 'text-muted-foreground'}>
                    {startTime || '选择开始时间（可选）'}
                  </Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 提醒方式 */}
            <View className="mb-0">
              <Text className="text-sm text-muted-foreground mb-1">提醒方式</Text>
              <Picker
                mode="selector"
                range={reminderOptions.map((r) => r.label)}
                value={reminderOptions.findIndex((r) => r.value === reminderType)}
                onChange={(e) => {
                  const selected = reminderOptions[e.detail.value]
                  setReminderType(selected.value as ReminderType)
                }}>
                <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full flex items-center justify-between">
                  <Text className="text-foreground">
                    {reminderOptions.find((r) => r.value === reminderType)?.label || '不提醒'}
                  </Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>
            </View>
          </View>

          {/* 编辑描述 */}
          <View className="bg-card rounded-lg p-4 shadow-sm mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">编辑描述</Text>
            <Text className="text-sm text-muted-foreground mb-2">修改描述后，系统会自动生成新的步骤预览</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                placeholder="输入事件描述，可以使用列表格式（如：1. xxx 或 - xxx）"
                value={description}
                onInput={(e) => setDescription(e.detail.value)}
                maxlength={500}
                style={{minHeight: '120px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">{description.length}/500</Text>
          </View>

          {/* 当前步骤 */}
          {event.steps.length > 0 && (
            <View className="bg-card rounded-lg p-4 shadow-sm mb-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-foreground">当前步骤 ({event.steps.length}个)</Text>
                <Button
                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-xs break-keep"
                  size="mini"
                  onClick={handleSyncStepsToDescription}>
                  同步到描述
                </Button>
              </View>
              {event.steps.map((step, index) => (
                <View key={step.id} className="flex items-start mb-2">
                  <Text className="text-sm text-muted-foreground mr-2">{index + 1}.</Text>
                  <Text
                    className={`text-sm flex-1 ${step.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {step.title}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 步骤预览 */}
          {previewSteps.length > 0 && (
            <View className="bg-accent/10 rounded-lg p-4 mb-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-base font-semibold text-accent">智能生成步骤预览 ({previewSteps.length}个)</Text>
              </View>
              <Text className="text-sm text-muted-foreground mb-3">
                根据新描述生成的步骤预览，点击"重新生成步骤"按钮应用
              </Text>
              {previewSteps.map((step, index) => (
                <View key={index} className="flex items-start mb-2">
                  <View className="i-mdi-check-circle text-base text-accent mr-2 mt-0.5"></View>
                  <View className="flex-1">
                    <Text className="text-sm text-foreground font-medium">{step.title}</Text>
                    {step.description && <Text className="text-xs text-muted-foreground mt-1">{step.description}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 操作按钮 */}
          <View className="flex gap-3 mb-4">
            <Button
              className="flex-1 bg-primary text-primary-foreground py-3 rounded text-base break-keep"
              size="default"
              onClick={handleSave}
              disabled={loading}>
              保存描述
            </Button>
            {previewSteps.length > 0 && (
              <Button
                className="flex-1 bg-accent text-accent-foreground py-3 rounded text-base break-keep"
                size="default"
                onClick={handleRegenerateSteps}
                disabled={loading}>
                重新生成步骤
              </Button>
            )}
          </View>

          <Text className="text-xs text-muted-foreground text-center">提示：重新生成步骤会删除所有现有步骤</Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default EditEvent
