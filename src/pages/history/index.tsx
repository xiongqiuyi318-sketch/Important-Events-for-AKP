import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {deleteEvent, getCompletedEvents} from '@/db/api'
import type {Event} from '@/db/types'

const History: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getCompletedEvents()
      setEvents(data)
    } catch (error) {
      console.error('加载历史记录失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  const handleEventClick = (eventId: string) => {
    Taro.navigateTo({url: `/pages/event-detail/index?id=${eventId}`})
  }

  const handleDeleteEvent = async (eventId: string, e: any) => {
    e.stopPropagation()
    try {
      const result = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个事件吗？删除后无法恢复。',
        confirmText: '删除',
        cancelText: '取消'
      })

      if (result.confirm) {
        const success = await deleteEvent(eventId)
        if (success) {
          Taro.showToast({title: '删除成功', icon: 'success'})
          loadData()
        } else {
          Taro.showToast({title: '删除失败', icon: 'none'})
        }
      }
    } catch (error) {
      console.error('删除事件失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-warning'
      case 'medium':
        return 'text-accent'
      case 'low':
        return 'text-muted-foreground'
      default:
        return 'text-foreground'
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

  const calculateDuration = (createdAt: string, completedAt: string | null) => {
    if (!completedAt) return null
    const start = new Date(createdAt)
    const end = new Date(completedAt)
    const diff = end.getTime() - start.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `耗时 ${days} 天 ${hours} 小时`
    }
    if (hours > 0) {
      return `耗时 ${hours} 小时`
    }
    return '当天完成'
  }

  const groupEventsByMonth = () => {
    const grouped: {[key: string]: Event[]} = {}

    events.forEach((event) => {
      const date = new Date(event.completed_at || event.created_at)
      const key = `${date.getFullYear()}年${date.getMonth() + 1}月`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(event)
    })

    return Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(a[1][0].completed_at || a[1][0].created_at)
      const dateB = new Date(b[1][0].completed_at || b[1][0].created_at)
      return dateB.getTime() - dateA.getTime()
    })
  }

  if (!user) {
    return null
  }

  const groupedEvents = groupEventsByMonth()

  return (
    <View style={{background: 'linear-gradient(to bottom, #fef3c7, #fde68a, #ffffff)', minHeight: '100vh'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-5">
          {/* 顶部标题区域 - 小清新风格 */}
          <View className="mb-6 mt-2">
            <View className="flex items-center mb-3">
              <View className="i-mdi-history text-3xl text-amber-600 mr-2"></View>
              <Text className="text-3xl font-bold text-amber-700">历史记录</Text>
            </View>
            <Text className="text-base text-amber-600 ml-1">📚 查看已完成的事件</Text>
          </View>

          {/* 成就卡片 - 小清新风格 */}
          <View
            className="bg-white rounded-3xl p-6 shadow-lg mb-6"
            style={{boxShadow: '0 8px 24px rgba(251,191,36,0.2)'}}>
            <View className="flex items-center justify-between">
              <View className="flex-1">
                <View className="flex items-center mb-2">
                  <View className="i-mdi-star text-2xl text-yellow-400 mr-2"></View>
                  <Text className="text-base text-amber-600 font-medium">累计完成</Text>
                </View>
                <Text className="text-5xl font-bold text-amber-700">{events.length}</Text>
                <Text className="text-sm text-amber-500 mt-1">个事件 🎉</Text>
              </View>
              <View className="i-mdi-trophy text-7xl text-yellow-400"></View>
            </View>
          </View>

          {loading ? (
            <View className="flex items-center justify-center py-16">
              <View className="i-mdi-loading text-4xl text-amber-600 animate-spin mb-3"></View>
              <Text className="text-amber-600">加载中...</Text>
            </View>
          ) : events.length === 0 ? (
            <View
              className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl shadow-lg"
              style={{boxShadow: '0 8px 24px rgba(0,0,0,0.06)'}}>
              <View className="i-mdi-calendar-check text-8xl text-amber-200 mb-4"></View>
              <Text className="text-lg text-slate-600 mb-2 font-medium">暂无历史记录</Text>
              <Text className="text-sm text-slate-400">完成事件后会在这里显示 ✨</Text>
            </View>
          ) : (
            <View className="space-y-6">
              {groupedEvents.map(([month, monthEvents]) => (
                <View key={month}>
                  {/* 月份标题 */}
                  <View className="flex items-center mb-4">
                    <View className="w-3 h-3 rounded-full bg-amber-400 mr-3 shadow-md"></View>
                    <Text className="text-lg font-bold text-amber-700">{month}</Text>
                    <View className="flex-1 h-0.5 bg-amber-200 ml-3 rounded-full"></View>
                    <Text className="text-sm text-amber-500 ml-3">{monthEvents.length} 个</Text>
                  </View>

                  {/* 事件列表 */}
                  <View className="space-y-4">
                    {monthEvents.map((event) => {
                      const duration = calculateDuration(event.created_at, event.completed_at)
                      return (
                        <View
                          key={event.id}
                          className="bg-white rounded-2xl p-5 shadow-lg active:opacity-90 transition-all"
                          onClick={() => handleEventClick(event.id)}
                          style={{boxShadow: '0 6px 20px rgba(0,0,0,0.08)'}}>
                          {/* 事件标题和描述 */}
                          <View className="flex items-start justify-between mb-3">
                            <View className="flex-1">
                              <View className="flex items-center mb-2">
                                <View className="i-mdi-check-circle text-xl text-green-500 mr-2"></View>
                                <Text className="text-lg font-bold text-slate-800">{event.title}</Text>
                              </View>
                              {event.description && (
                                <Text className="text-sm text-slate-500 line-clamp-2 ml-7">{event.description}</Text>
                              )}
                            </View>
                          </View>

                          {/* 标签区域 */}
                          <View className="flex items-center gap-2 mb-3 ml-7">
                            <View
                              className={`px-3 py-1.5 rounded-full text-xs ${getPriorityColor(event.priority)} bg-opacity-10`}>
                              <Text className={`${getPriorityColor(event.priority)} font-medium`}>
                                {getPriorityText(event.priority)}
                              </Text>
                            </View>
                            {event.category && (
                              <View className="px-3 py-1.5 rounded-full text-xs bg-slate-100">
                                <Text className="text-slate-600 font-medium">{event.category}</Text>
                              </View>
                            )}
                          </View>

                          {/* 完成信息和操作按钮 */}
                          <View className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                            <View className="flex-1">
                              <View className="flex items-center mb-2 bg-green-50 rounded-full px-3 py-2 inline-flex">
                                <View className="i-mdi-calendar-check text-sm text-green-600 mr-1.5"></View>
                                <Text className="text-xs text-green-600 font-medium">
                                  完成于 {event.completed_at ? new Date(event.completed_at).toLocaleDateString() : '-'}
                                </Text>
                              </View>
                              {duration && (
                                <View className="flex items-center bg-blue-50 rounded-full px-3 py-2 inline-flex mt-2">
                                  <View className="i-mdi-timer-outline text-sm text-blue-600 mr-1.5"></View>
                                  <Text className="text-xs text-blue-600 font-medium">耗时 {duration}</Text>
                                </View>
                              )}
                            </View>
                            <Button
                              className="bg-red-50 text-red-600 px-5 py-2 rounded-full text-sm break-keep"
                              size="mini"
                              onClick={(e) => handleDeleteEvent(event.id, e)}>
                              <View className="flex items-center">
                                <View className="i-mdi-delete-outline text-base mr-1"></View>
                                <Text className="text-red-600 font-medium">删除</Text>
                              </View>
                            </Button>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default History
