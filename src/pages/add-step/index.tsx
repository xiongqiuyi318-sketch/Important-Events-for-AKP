import {Button, Input, Picker, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useEffect, useState} from 'react'
import {createStep, getEventWithSteps, updateEvent, updateStep} from '@/db/api'
import type {EventWithSteps} from '@/db/types'
import {stepsToDescription} from '@/utils/stepDescriptionSync'

const AddStep: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const eventId = router.params.eventId || ''
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [event, setEvent] = useState<EventWithSteps | null>(null)
  const [selectedPosition, setSelectedPosition] = useState(0) // 默认添加到最后

  // 加载事件和步骤数据
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await getEventWithSteps(eventId)
        setEvent(data)
        // 默认选择最后一个位置
        setSelectedPosition(data.steps.length)
      } catch (error) {
        console.error('加载事件失败:', error)
        Taro.showToast({title: '加载失败', icon: 'none'})
      }
    }
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  // 生成位置选项
  const getPositionOptions = () => {
    if (!event) return ['最后一步']

    const options: string[] = []
    if (event.steps.length === 0) {
      options.push('第 1 步')
    } else {
      options.push('第 1 步（最前面）')
      for (let i = 1; i < event.steps.length; i++) {
        options.push(`第 ${i + 1} 步`)
      }
      options.push(`第 ${event.steps.length + 1} 步（最后）`)
    }
    return options
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.showToast({title: '请输入步骤标题', icon: 'none'})
      return
    }

    if (!event) {
      Taro.showToast({title: '事件数据未加载', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      // 创建新步骤，临时使用一个很大的 order_index
      const tempOrderIndex = 9999
      const success = await createStep({
        event_id: eventId,
        title: title.trim(),
        description: description.trim() || undefined,
        order_index: tempOrderIndex
      })

      if (!success) {
        Taro.showToast({title: '添加失败', icon: 'none'})
        setLoading(false)
        return
      }

      // 重新加载事件数据以获取新步骤的 ID
      const updatedEvent = await getEventWithSteps(eventId)
      const newStep = updatedEvent.steps.find((s) => s.order_index === tempOrderIndex)

      if (!newStep) {
        Taro.showToast({title: '添加失败', icon: 'none'})
        setLoading(false)
        return
      }

      // 根据选择的位置重新排序所有步骤
      const sortedSteps = updatedEvent.steps
        .filter((s) => s.id !== newStep.id)
        .sort((a, b) => a.order_index - b.order_index)

      // 在指定位置插入新步骤
      sortedSteps.splice(selectedPosition, 0, newStep)

      // 更新所有步骤的 order_index
      for (let i = 0; i < sortedSteps.length; i++) {
        await updateStep(sortedSteps[i].id, {order_index: i})
      }

      // 重新加载并同步步骤到描述
      const finalEvent = await getEventWithSteps(eventId)
      const newDescription = stepsToDescription(finalEvent.steps)
      await updateEvent(eventId, {description: newDescription})

      Taro.showToast({title: '添加成功', icon: 'success'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('添加步骤失败:', error)
      Taro.showToast({title: '添加失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  if (!user || !event) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  const positionOptions = getPositionOptions()

  return (
    <View className="min-h-screen bg-background p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground mb-2">添加步骤</Text>
        <Text className="text-sm text-muted-foreground">为事件添加新的执行步骤</Text>
      </View>

      <View className="space-y-4">
        {/* 位置选择器 */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">
            插入位置 <Text className="text-destructive">*</Text>
          </Text>
          <Picker
            mode="selector"
            range={positionOptions}
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(Number(e.detail.value))}>
            <View className="bg-card text-foreground px-4 py-3 rounded-lg border border-border">
              <Text className="text-foreground">{positionOptions[selectedPosition]}</Text>
            </View>
          </Picker>
          <Text className="text-xs text-muted-foreground mt-1">选择新步骤在步骤列表中的位置</Text>
        </View>

        {/* 当前步骤列表预览 */}
        {event.steps.length > 0 && (
          <View className="bg-card rounded-lg p-4 border border-border">
            <Text className="text-sm font-medium text-foreground mb-3">当前步骤列表</Text>
            <View className="space-y-2">
              {event.steps
                .sort((a, b) => a.order_index - b.order_index)
                .map((step, index) => (
                  <View key={step.id} className="flex items-center">
                    <View className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2">
                      <Text className="text-xs text-primary-foreground">{index + 1}</Text>
                    </View>
                    <Text className="text-sm text-foreground flex-1">{step.title}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <View>
          <Text className="text-sm font-medium text-foreground mb-2">
            步骤标题 <Text className="text-destructive">*</Text>
          </Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-card text-foreground px-4 py-3 rounded-lg border border-border w-full"
              placeholder="请输入步骤标题"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={100}
            />
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-foreground mb-2">步骤描述</Text>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="bg-card text-foreground px-4 py-3 rounded-lg border border-border w-full"
              placeholder="请输入步骤描述（可选）"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={200}
              style={{minHeight: '100px'}}
            />
          </View>
        </View>
      </View>

      <View className="mt-8 space-y-3">
        <Button
          className="w-full bg-primary text-primary-foreground py-4 rounded-lg text-base break-keep"
          size="default"
          onClick={handleSubmit}
          disabled={loading}>
          {loading ? '添加中...' : '添加步骤'}
        </Button>
        <Button
          className="w-full bg-secondary text-secondary-foreground py-4 rounded-lg text-base break-keep"
          size="default"
          onClick={() => Taro.navigateBack()}>
          取消
        </Button>
      </View>
    </View>
  )
}

export default AddStep
