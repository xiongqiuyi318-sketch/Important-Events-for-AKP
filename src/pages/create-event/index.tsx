import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useEffect, useState} from 'react'
import {createEvent, createEventWithCustomSteps} from '@/db/api'
import {StepGenerator} from '@/db/stepGenerator'
import type {CreateStepInput, EventPriority, ReminderType} from '@/db/types'

// 扩展步骤类型，添加手动标记
interface PreviewStep extends CreateStepInput {
  is_manual?: boolean
  temp_id?: string
}

const CreateEvent: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<EventPriority>('medium')
  const [deadline, setDeadline] = useState('')
  const [startTime, setStartTime] = useState('')
  const [reminderType, setReminderType] = useState<ReminderType>(null)
  const [loading, setLoading] = useState(false)
  const [previewSteps, setPreviewSteps] = useState<PreviewStep[]>([])
  const [addingPosition, setAddingPosition] = useState<{index: number; position: 'before' | 'after'} | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')

  const priorityOptions = [
    {label: '低优先级', value: 'low'},
    {label: '中优先级', value: 'medium'},
    {label: '高优先级', value: 'high'}
  ]

  const categoryOptions = [
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
    const generatePreview = async () => {
      if (title.trim()) {
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
  }, [title, description, category])

  const handlePriorityChange = (e: any) => {
    const index = e.detail.value
    setPriority(priorityOptions[index].value as EventPriority)
  }

  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    setCategory(categoryOptions[index])
  }

  const handleDeadlineChange = (e: any) => {
    setDeadline(e.detail.value)
  }

  // 开始添加步骤
  const handleStartAddStep = (index: number, position: 'before' | 'after') => {
    setAddingPosition({index, position})
    setNewStepTitle('')
  }

  // 确认添加步骤
  const handleConfirmAddStep = () => {
    if (!newStepTitle.trim()) {
      Taro.showToast({title: '请输入步骤标题', icon: 'none'})
      return
    }

    if (!addingPosition) return

    const newStep: PreviewStep = {
      event_id: 'preview',
      title: newStepTitle.trim(),
      order_index: 0,
      is_manual: true,
      temp_id: `manual_${Date.now()}`
    }

    const newSteps = [...previewSteps]
    // 根据位置插入步骤
    const insertIndex = addingPosition.position === 'before' ? addingPosition.index : addingPosition.index + 1
    newSteps.splice(insertIndex, 0, newStep)

    // 重新计算 order_index
    newSteps.forEach((step, idx) => {
      step.order_index = idx
    })

    setPreviewSteps(newSteps)
    setAddingPosition(null)
    setNewStepTitle('')
    Taro.showToast({title: '步骤已添加', icon: 'success', duration: 1000})
  }

  // 取消添加步骤
  const handleCancelAddStep = () => {
    setAddingPosition(null)
    setNewStepTitle('')
  }

  // 删除手动添加的步骤
  const handleDeleteManualStep = (index: number) => {
    const newSteps = previewSteps.filter((_, idx) => idx !== index)
    // 重新计算 order_index
    newSteps.forEach((step, idx) => {
      step.order_index = idx
    })
    setPreviewSteps(newSteps)
    Taro.showToast({title: '步骤已删除', icon: 'success', duration: 1000})
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.showToast({title: '请输入事件标题', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      let event

      // 检查是否有手动添加的步骤
      const hasManualSteps = previewSteps.some((step) => step.is_manual)

      if (hasManualSteps || previewSteps.length > 0) {
        // 如果有手动添加的步骤或预览步骤，使用自定义步骤创建
        const stepsToCreate = previewSteps.map((step) => ({
          event_id: 'temp',
          title: step.title,
          description: step.description,
          order_index: step.order_index,
          category: step.category,
          is_auto_generated: !step.is_manual
        }))

        event = await createEventWithCustomSteps(
          {
            title: title.trim(),
            description: description.trim() || undefined,
            category: category || undefined,
            priority,
            deadline: deadline || undefined,
            start_time: startTime || undefined,
            reminder_type: reminderType === 'none' ? null : reminderType || undefined
          },
          stepsToCreate
        )
      } else {
        // 否则使用默认的创建方法（自动生成步骤）
        event = await createEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          priority,
          deadline: deadline || undefined,
          start_time: startTime || undefined,
          reminder_type: reminderType === 'none' ? null : reminderType || undefined
        })
      }

      if (event) {
        Taro.showToast({title: '创建成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '创建失败', icon: 'none'})
      }
    } catch (error) {
      console.error('创建事件失败:', error)
      Taro.showToast({title: '创建失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground mb-2">创建事件</Text>
            <Text className="text-sm text-muted-foreground">填写事件信息，系统将自动生成执行步骤</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                事件标题 <Text className="text-destructive">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-card text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  placeholder="请输入事件标题"
                  value={title}
                  onInput={(e) => setTitle(e.detail.value)}
                  maxlength={100}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">事件分类</Text>
              <Picker mode="selector" range={categoryOptions} onChange={handleCategoryChange}>
                <View className="bg-card text-foreground px-4 py-3 rounded-lg border border-border">
                  <Text className={category ? 'text-foreground' : 'text-muted-foreground'}>
                    {category || '选择分类（可选）'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">优先级</Text>
              <Picker
                mode="selector"
                range={priorityOptions.map((p) => p.label)}
                value={priorityOptions.findIndex((p) => p.value === priority)}
                onChange={handlePriorityChange}>
                <View className="bg-card text-foreground px-4 py-3 rounded-lg border border-border">
                  <Text className="text-foreground">{priorityOptions.find((p) => p.value === priority)?.label}</Text>
                </View>
              </Picker>
            </View>

            <View>
              <View className="flex items-center justify-between mb-2">
                <Text className="text-sm font-medium text-foreground">截止时间</Text>
                {deadline && (
                  <Text className="text-xs text-red-500" onClick={() => setDeadline('')}>
                    清除
                  </Text>
                )}
              </View>
              <Picker mode="date" value={deadline} onChange={handleDeadlineChange}>
                <View className="bg-card text-foreground px-4 py-3 rounded-lg border border-border">
                  <Text className={deadline ? 'text-foreground' : 'text-muted-foreground'}>
                    {deadline ? deadline.replace(/-/g, '/') : '选择截止时间（可选）'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <View className="flex items-center justify-between mb-2">
                <Text className="text-sm font-medium text-foreground">开始时间</Text>
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
                <View className="bg-card text-foreground px-4 py-3 rounded-lg border border-border">
                  <Text className={startTime ? 'text-foreground' : 'text-muted-foreground'}>
                    {startTime || '选择开始时间（可选）'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">提醒方式</Text>
              <Picker
                mode="selector"
                range={reminderOptions.map((r) => r.label)}
                value={reminderOptions.findIndex((r) => r.value === reminderType)}
                onChange={(e) => {
                  const selected = reminderOptions[e.detail.value]
                  setReminderType(selected.value as ReminderType)
                }}>
                <View className="bg-card text-foreground px-4 py-3 rounded-lg border border-border">
                  <Text className="text-foreground">
                    {reminderOptions.find((r) => r.value === reminderType)?.label || '不提醒'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">事件描述</Text>
              <Text className="text-xs text-muted-foreground mb-2">
                💡 提示：在描述中列出具体步骤，系统将智能识别并生成任务清单
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-card text-foreground px-4 py-3 rounded-lg border border-border w-full"
                  placeholder="请输入事件描述或具体步骤，例如：&#10;1. 准备会议材料&#10;2. 发送会议通知&#10;3. 预定会议室"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                  maxlength={500}
                  style={{minHeight: '120px'}}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{description.length}/500</Text>
            </View>
          </View>

          {previewSteps.length > 0 && (
            <View className="mt-6">
              <View className="flex flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold text-foreground">智能生成步骤预览</Text>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-xs text-primary font-medium">{previewSteps.length} 个步骤</Text>
                </View>
              </View>
              <View className="bg-card rounded-lg border border-border p-4">
                {previewSteps.map((step, index) => (
                  <View key={step.temp_id || index}>
                    {/* 在第一个步骤前添加按钮 */}
                    {index === 0 && addingPosition?.index !== 0 && addingPosition?.position !== 'before' && (
                      <View className="ml-9 mb-3">
                        <View
                          className="flex flex-row items-center text-accent cursor-pointer"
                          onClick={() => handleStartAddStep(0, 'before')}>
                          <View className="i-mdi-plus-circle text-base text-accent mr-1" />
                          <Text className="text-xs text-accent">在此步骤前添加</Text>
                        </View>
                      </View>
                    )}

                    {/* 在第一个步骤前的添加输入框 */}
                    {index === 0 && addingPosition?.index === 0 && addingPosition?.position === 'before' && (
                      <View className="ml-9 mb-3 bg-accent/5 rounded-lg p-3 border border-accent/20">
                        <Text className="text-xs text-muted-foreground mb-2">在步骤 1 前添加新步骤</Text>
                        <View style={{overflow: 'hidden'}}>
                          <Input
                            className="bg-background text-foreground px-3 py-2 rounded border border-border w-full mb-2"
                            placeholder="输入步骤标题"
                            value={newStepTitle}
                            onInput={(e) => setNewStepTitle(e.detail.value)}
                            maxlength={100}
                            focus
                          />
                        </View>
                        <View className="flex flex-row gap-2">
                          <Button
                            className="flex-1 bg-accent text-accent-foreground py-2 rounded text-sm break-keep"
                            size="mini"
                            onClick={handleConfirmAddStep}>
                            确认添加
                          </Button>
                          <Button
                            className="flex-1 bg-secondary text-secondary-foreground py-2 rounded text-sm break-keep"
                            size="mini"
                            onClick={handleCancelAddStep}>
                            取消
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* 步骤显示 */}
                    <View className="flex flex-row items-start mb-3">
                      <View
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                          step.is_manual ? 'bg-accent/20' : 'bg-primary/10'
                        }`}>
                        <Text className={`text-xs font-medium ${step.is_manual ? 'text-accent' : 'text-primary'}`}>
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex flex-row items-center">
                          <Text className="text-sm text-foreground font-medium flex-1">{step.title}</Text>
                          {step.is_manual && (
                            <View
                              className="i-mdi-delete text-lg text-destructive ml-2"
                              onClick={() => handleDeleteManualStep(index)}
                            />
                          )}
                        </View>
                        {step.description && (
                          <Text className="text-xs text-muted-foreground mt-1">{step.description}</Text>
                        )}
                        {step.is_manual && (
                          <View className="mt-1">
                            <Text className="text-xs text-accent">手动添加</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* 在步骤后添加的输入框 */}
                    {addingPosition?.index === index && addingPosition?.position === 'after' && (
                      <View className="ml-9 mb-3 bg-accent/5 rounded-lg p-3 border border-accent/20">
                        <Text className="text-xs text-muted-foreground mb-2">在步骤 {index + 1} 后添加新步骤</Text>
                        <View style={{overflow: 'hidden'}}>
                          <Input
                            className="bg-background text-foreground px-3 py-2 rounded border border-border w-full mb-2"
                            placeholder="输入步骤标题"
                            value={newStepTitle}
                            onInput={(e) => setNewStepTitle(e.detail.value)}
                            maxlength={100}
                            focus
                          />
                        </View>
                        <View className="flex flex-row gap-2">
                          <Button
                            className="flex-1 bg-accent text-accent-foreground py-2 rounded text-sm break-keep"
                            size="mini"
                            onClick={handleConfirmAddStep}>
                            确认添加
                          </Button>
                          <Button
                            className="flex-1 bg-secondary text-secondary-foreground py-2 rounded text-sm break-keep"
                            size="mini"
                            onClick={handleCancelAddStep}>
                            取消
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* 在非第一个步骤前添加的输入框 */}
                    {index > 0 && addingPosition?.index === index && addingPosition?.position === 'before' && (
                      <View className="ml-9 mb-3 bg-accent/5 rounded-lg p-3 border border-accent/20">
                        <Text className="text-xs text-muted-foreground mb-2">在步骤 {index + 1} 前添加新步骤</Text>
                        <View style={{overflow: 'hidden'}}>
                          <Input
                            className="bg-background text-foreground px-3 py-2 rounded border border-border w-full mb-2"
                            placeholder="输入步骤标题"
                            value={newStepTitle}
                            onInput={(e) => setNewStepTitle(e.detail.value)}
                            maxlength={100}
                            focus
                          />
                        </View>
                        <View className="flex flex-row gap-2">
                          <Button
                            className="flex-1 bg-accent text-accent-foreground py-2 rounded text-sm break-keep"
                            size="mini"
                            onClick={handleConfirmAddStep}>
                            确认添加
                          </Button>
                          <Button
                            className="flex-1 bg-secondary text-secondary-foreground py-2 rounded text-sm break-keep"
                            size="mini"
                            onClick={handleCancelAddStep}>
                            取消
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* 添加按钮（在步骤前和步骤后） */}
                    {!addingPosition && (
                      <View className="ml-9 mb-3 flex flex-row gap-4">
                        {/* 在此步骤前添加（非第一个步骤） */}
                        {index > 0 && (
                          <View
                            className="flex flex-row items-center text-accent cursor-pointer"
                            onClick={() => handleStartAddStep(index, 'before')}>
                            <View className="i-mdi-plus-circle text-base text-accent mr-1" />
                            <Text className="text-xs text-accent">在此步骤前添加</Text>
                          </View>
                        )}
                        {/* 在此步骤后添加 */}
                        <View
                          className="flex flex-row items-center text-accent cursor-pointer"
                          onClick={() => handleStartAddStep(index, 'after')}>
                          <View className="i-mdi-plus-circle text-base text-accent mr-1" />
                          <Text className="text-xs text-accent">在此步骤后添加</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              <Text className="text-xs text-muted-foreground mt-2 text-center">
                💡 蓝色为智能生成步骤，橙色为手动添加步骤
              </Text>
            </View>
          )}

          <View className="mt-8 space-y-3">
            <Button
              className="w-full bg-primary text-primary-foreground py-4 rounded-lg text-base break-keep"
              size="default"
              onClick={handleSubmit}
              disabled={loading}>
              {loading ? '创建中...' : '创建事件'}
            </Button>
            <Button
              className="w-full bg-secondary text-secondary-foreground py-4 rounded-lg text-base break-keep"
              size="default"
              onClick={() => Taro.navigateBack()}>
              取消
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default CreateEvent
