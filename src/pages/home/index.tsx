import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  batchUpdateEventSortOrder,
  completeEvent,
  deleteEvent,
  deleteLastMonthEvents,
  getAllEventsForHome,
  getEventStats,
  getLastMonthEvents
} from '@/db/api'
import type {Event} from '@/db/types'

const Home: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState({total: 0, pending: 0, inProgress: 0, completed: 0})
  const [loading, setLoading] = useState(false)
  const [scrollIntoView, setScrollIntoView] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'quadrant'>('list')

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [eventsData, statsData] = await Promise.all([getAllEventsForHome(), getEventStats()])
      setEvents(eventsData)
      setStats(statsData)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user])

  // 检查是否需要提醒删除上月事件
  const checkMonthlyReminder = useCallback(async () => {
    if (!user) return

    try {
      // 获取上次提醒的时间
      const lastReminderTime = Taro.getStorageSync('lastMonthlyReminderTime')
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`

      // 如果本月已经提醒过，则不再提醒
      if (lastReminderTime === currentMonth) {
        return
      }

      // 获取上月的事件
      const lastMonthEvents = await getLastMonthEvents()

      // 如果没有上月事件，则不提醒
      if (lastMonthEvents.length === 0) {
        // 记录本月已检查，避免重复检查
        Taro.setStorageSync('lastMonthlyReminderTime', currentMonth)
        return
      }

      // 显示提醒对话框
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthText = `${lastMonth.getFullYear()}年${lastMonth.getMonth() + 1}月`

      Taro.showModal({
        title: '每月提醒',
        content: `检测到您在${lastMonthText}创建了 ${lastMonthEvents.length} 个事件，是否删除这些事件？`,
        confirmText: '删除',
        cancelText: '保留',
        success: async (res) => {
          if (res.confirm) {
            // 用户选择删除
            Taro.showLoading({title: '删除中...', mask: true})
            const result = await deleteLastMonthEvents()
            Taro.hideLoading()

            if (result.success) {
              Taro.showToast({
                title: `已删除 ${result.count} 个事件`,
                icon: 'success',
                duration: 2000
              })
              // 重新加载数据
              loadData()
            } else {
              Taro.showToast({title: '删除失败', icon: 'none'})
            }
          }
          // 无论用户选择什么，都记录本月已提醒
          Taro.setStorageSync('lastMonthlyReminderTime', currentMonth)
        }
      })
    } catch (error) {
      console.error('检查月度提醒失败:', error)
    }
  }, [user, loadData])

  useDidShow(() => {
    loadData()
    // 延迟检查，确保页面加载完成后再显示提醒
    setTimeout(() => {
      checkMonthlyReminder()
    }, 1000)
  })

  const handleEventClick = (eventId: string) => {
    Taro.navigateTo({url: `/pages/event-detail/index?id=${eventId}`})
  }

  const handleScrollToEvent = (status: 'pending' | 'in_progress' | 'completed') => {
    const firstEvent = events.find((e) => e.status === status)
    if (firstEvent) {
      const targetId = `event-${firstEvent.id}`
      setScrollIntoView(targetId)
      // 清除滚动状态，以便下次可以再次触发
      setTimeout(() => {
        setScrollIntoView('')
      }, 500)
    } else {
      const statusText = status === 'pending' ? '待办' : status === 'in_progress' ? '进行中' : '已完成'
      Taro.showToast({title: `暂无${statusText}事件`, icon: 'none'})
    }
  }

  const handleCreateEvent = () => {
    Taro.navigateTo({url: '/pages/create-event/index'})
  }

  const handleCompleteEvent = async (eventId: string, e: any) => {
    e.stopPropagation()
    try {
      const success = await completeEvent(eventId)
      if (success) {
        Taro.showToast({title: '已完成', icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: '操作失败', icon: 'none'})
      }
    } catch (error) {
      console.error('完成事件失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
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

  // 上移事件
  const handleMoveUp = async (index: number, e: any) => {
    e.stopPropagation()
    if (index === 0) return

    const currentEvent = events[index]
    const prevEvent = events[index - 1]

    // 如果优先级不同，不允许移动
    if (currentEvent.priority !== prevEvent.priority) {
      Taro.showToast({title: '不能跨优先级移动', icon: 'none'})
      return
    }

    // 交换 sort_order 并交换数组位置
    const newEvents = [...events]
    const tempSortOrder = currentEvent.sort_order

    // 交换元素位置
    newEvents[index] = {...prevEvent, sort_order: tempSortOrder}
    newEvents[index - 1] = {...currentEvent, sort_order: prevEvent.sort_order}

    // 立即更新本地状态，实现视觉上的即时反馈
    setEvents(newEvents)

    // 更新数据库
    try {
      await batchUpdateEventSortOrder([
        {id: currentEvent.id, sort_order: prevEvent.sort_order},
        {id: prevEvent.id, sort_order: tempSortOrder}
      ])
      Taro.showToast({title: '已上移', icon: 'success', duration: 1000})
    } catch (error) {
      console.error('移动失败:', error)
      Taro.showToast({title: '移动失败', icon: 'none'})
      loadData() // 重新加载数据
    }
  }

  // 下移事件
  const handleMoveDown = async (index: number, e: any) => {
    e.stopPropagation()
    if (index === events.length - 1) return

    const currentEvent = events[index]
    const nextEvent = events[index + 1]

    // 如果优先级不同，不允许移动
    if (currentEvent.priority !== nextEvent.priority) {
      Taro.showToast({title: '不能跨优先级移动', icon: 'none'})
      return
    }

    // 交换 sort_order 并交换数组位置
    const newEvents = [...events]
    const tempSortOrder = currentEvent.sort_order

    // 交换元素位置
    newEvents[index] = {...nextEvent, sort_order: tempSortOrder}
    newEvents[index + 1] = {...currentEvent, sort_order: nextEvent.sort_order}

    // 立即更新本地状态，实现视觉上的即时反馈
    setEvents(newEvents)

    // 更新数据库
    try {
      await batchUpdateEventSortOrder([
        {id: currentEvent.id, sort_order: nextEvent.sort_order},
        {id: nextEvent.id, sort_order: tempSortOrder}
      ])
      Taro.showToast({title: '已下移', icon: 'success', duration: 1000})
    } catch (error) {
      console.error('移动失败:', error)
      Taro.showToast({title: '移动失败', icon: 'none'})
      loadData() // 重新加载数据
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

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const date = new Date(deadline)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return {text: `已逾期 ${Math.abs(days)} 天`, color: 'text-destructive'}
    }
    if (days === 0) {
      return {text: '今天截止', color: 'text-warning'}
    }
    if (days <= 3) {
      return {text: `还剩 ${days} 天`, color: 'text-warning'}
    }
    return {text: `还剩 ${days} 天`, color: 'text-muted-foreground'}
  }

  if (!user) {
    return null
  }

  return (
    <View style={{background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe, #ffffff)', minHeight: '100vh'}}>
      <ScrollView
        scrollY
        scrollIntoView={scrollIntoView}
        scrollWithAnimation
        className="h-screen box-border"
        style={{background: 'transparent'}}>
        <View className="p-5">
          {/* 顶部标题区域 - 小清新风格 */}
          <View className="mb-6 mt-2">
            <View className="flex items-center mb-3">
              <View className="i-mdi-flower text-3xl text-primary mr-2"></View>
              <Text className="text-3xl font-bold text-primary">重要事件</Text>
            </View>
            <Text className="text-base text-muted-foreground ml-1">✨ 智能管理您的重要事项</Text>
          </View>

          {/* 统计卡片 - 小清新风格 */}
          <View className="grid grid-cols-4 gap-3 mb-6">
            <View className="bg-white rounded-2xl p-4 shadow-md" style={{boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}>
              <View className="i-mdi-format-list-checks text-xl text-slate-400 mb-2"></View>
              <Text className="text-xs text-slate-500 mb-1">全部</Text>
              <Text className="text-2xl font-bold text-slate-700">{stats.total}</Text>
            </View>
            <View
              className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-all"
              style={{boxShadow: '0 4px 12px rgba(147,197,253,0.3)'}}
              onClick={() => handleScrollToEvent('pending')}>
              <View className="i-mdi-clock-outline text-xl text-blue-400 mb-2"></View>
              <Text className="text-xs text-blue-500 mb-1">待办</Text>
              <Text className="text-2xl font-bold text-blue-600">{stats.pending}</Text>
            </View>
            <View
              className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-all"
              style={{boxShadow: '0 4px 12px rgba(167,139,250,0.3)'}}
              onClick={() => handleScrollToEvent('in_progress')}>
              <View className="i-mdi-play-circle-outline text-xl text-purple-400 mb-2"></View>
              <Text className="text-xs text-purple-500 mb-1">进行中</Text>
              <Text className="text-2xl font-bold text-purple-600">{stats.inProgress}</Text>
            </View>
            <View
              className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-all"
              style={{boxShadow: '0 4px 12px rgba(134,239,172,0.3)'}}
              onClick={() => handleScrollToEvent('completed')}>
              <View className="i-mdi-check-circle text-xl text-green-400 mb-2"></View>
              <Text className="text-xs text-green-500 mb-1">已完成</Text>
              <Text className="text-2xl font-bold text-green-600">{stats.completed}</Text>
            </View>
          </View>

          {/* 提示文字 */}
          <View className="mb-4 text-center">
            <Text className="text-xs text-muted-foreground">
              💡 点击"待办"、"进行中"或"已完成"卡片可快速定位到对应事件
            </Text>
          </View>

          {/* 视图切换按钮 */}
          <View className="flex justify-center mb-5">
            <View className="bg-white rounded-full p-1 shadow-md flex" style={{boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
              <View
                className={`px-5 py-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-primary' : 'bg-transparent'}`}
                onClick={() => setViewMode('list')}>
                <Text className={`text-sm font-medium ${viewMode === 'list' ? 'text-white' : 'text-muted-foreground'}`}>
                  列表视图
                </Text>
              </View>
              <View
                className={`px-5 py-2 rounded-full transition-all ${viewMode === 'quadrant' ? 'bg-primary' : 'bg-transparent'}`}
                onClick={() => setViewMode('quadrant')}>
                <Text
                  className={`text-sm font-medium ${viewMode === 'quadrant' ? 'text-white' : 'text-muted-foreground'}`}>
                  四象限视图
                </Text>
              </View>
            </View>
          </View>

          {/* 待办事件标题和新建按钮 */}
          <View className="flex items-center justify-between mb-5">
            <View className="flex items-center">
              <View className="i-mdi-calendar-star text-2xl text-primary mr-2"></View>
              <Text className="text-xl font-bold text-foreground">待办事件</Text>
            </View>
            <Button
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm break-keep shadow-lg"
              size="default"
              onClick={handleCreateEvent}
              style={{boxShadow: '0 4px 12px rgba(59,130,246,0.4)'}}>
              <View className="flex items-center">
                <View className="i-mdi-plus-circle text-lg mr-1"></View>
                <Text className="text-white font-medium">新建</Text>
              </View>
            </Button>
          </View>

          {loading ? (
            <View className="flex items-center justify-center py-16">
              <View className="i-mdi-loading text-4xl text-primary animate-spin mb-3"></View>
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : events.length === 0 ? (
            <View
              className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl shadow-lg"
              style={{boxShadow: '0 8px 24px rgba(0,0,0,0.06)'}}>
              <View className="i-mdi-calendar-heart text-8xl text-blue-200 mb-4"></View>
              <Text className="text-lg text-slate-600 mb-2 font-medium">暂无待办事件</Text>
              <Text className="text-sm text-slate-400 mb-6">开始创建您的第一个事件吧 🌟</Text>
              <Button
                className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-base break-keep shadow-lg"
                size="default"
                onClick={handleCreateEvent}
                style={{boxShadow: '0 4px 16px rgba(59,130,246,0.4)'}}>
                <View className="flex items-center">
                  <View className="i-mdi-plus-circle text-xl mr-2"></View>
                  <Text className="text-white font-medium">创建第一个事件</Text>
                </View>
              </Button>
            </View>
          ) : viewMode === 'list' ? (
            // 列表视图
            <View className="space-y-4">
              {events.map((event, index) => {
                const deadlineInfo = formatDeadline(event.deadline)
                const isCompleted = event.status === 'completed'
                const canMoveUp =
                  !isCompleted &&
                  index > 0 &&
                  events[index - 1].priority === event.priority &&
                  events[index - 1].status !== 'completed'
                const canMoveDown =
                  !isCompleted &&
                  index < events.length - 1 &&
                  events[index + 1].priority === event.priority &&
                  events[index + 1].status !== 'completed'
                return (
                  <View
                    key={event.id}
                    id={`event-${event.id}`}
                    className={`rounded-2xl p-5 shadow-lg active:opacity-90 transition-all ${isCompleted ? 'bg-slate-50 opacity-75' : 'bg-white'}`}
                    onClick={() => handleEventClick(event.id)}
                    style={{boxShadow: '0 6px 20px rgba(0,0,0,0.08)'}}>
                    {/* 事件标题和描述 */}
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex items-center mb-2">
                          <View
                            className={`i-mdi-bookmark text-xl mr-2 ${isCompleted ? 'text-slate-400' : 'text-primary'}`}></View>
                          <Text
                            className={`text-lg font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {event.title}
                          </Text>
                        </View>
                        {event.description && (
                          <Text
                            className={`text-sm line-clamp-2 ml-7 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                            {event.description}
                          </Text>
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
                      <View className="px-3 py-1.5 rounded-full text-xs bg-purple-50">
                        <Text className="text-purple-600 font-medium">{getStatusText(event.status)}</Text>
                      </View>
                      {event.category && (
                        <View className="px-3 py-1.5 rounded-full text-xs bg-slate-100">
                          <Text className="text-slate-600 font-medium">{event.category}</Text>
                        </View>
                      )}
                    </View>

                    {/* 截止时间 */}
                    {deadlineInfo && (
                      <View className="flex items-center mb-4 ml-7 bg-slate-50 rounded-full px-3 py-2 inline-flex">
                        <View className={`i-mdi-clock-outline text-base ${deadlineInfo.color} mr-1.5`}></View>
                        <Text className={`text-sm ${deadlineInfo.color} font-medium`}>{deadlineInfo.text}</Text>
                      </View>
                    )}

                    {/* 开始时间 */}
                    {event.start_time && (
                      <View className="flex items-center mb-4 ml-7 bg-blue-50 rounded-full px-3 py-2 inline-flex">
                        <View className="i-mdi-calendar-start text-base text-blue-600 mr-1.5"></View>
                        <Text className="text-sm text-blue-600 font-medium">
                          开始：
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

                    {/* 操作按钮 */}
                    <View className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      {/* 左侧：排序按钮 */}
                      <View className="flex items-center gap-2">
                        <Button
                          className={`${canMoveUp ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'} px-4 py-2 rounded-full text-sm break-keep`}
                          size="mini"
                          disabled={!canMoveUp}
                          onClick={(e) => handleMoveUp(index, e)}>
                          <View className="flex items-center">
                            <View className="i-mdi-arrow-up text-base"></View>
                          </View>
                        </Button>
                        <Button
                          className={`${canMoveDown ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'} px-4 py-2 rounded-full text-sm break-keep`}
                          size="mini"
                          disabled={!canMoveDown}
                          onClick={(e) => handleMoveDown(index, e)}>
                          <View className="flex items-center">
                            <View className="i-mdi-arrow-down text-base"></View>
                          </View>
                        </Button>
                      </View>
                      {/* 右侧：操作按钮 */}
                      <View className="flex items-center gap-3">
                        <Button
                          className="bg-red-50 text-red-600 px-5 py-2 rounded-full text-sm break-keep"
                          size="mini"
                          onClick={(e) => handleDeleteEvent(event.id, e)}>
                          <View className="flex items-center">
                            <View className="i-mdi-delete-outline text-base mr-1"></View>
                            <Text className="text-red-600 font-medium">删除</Text>
                          </View>
                        </Button>
                        {!isCompleted && (
                          <Button
                            className="bg-green-50 text-green-600 px-5 py-2 rounded-full text-sm break-keep"
                            size="mini"
                            onClick={(e) => handleCompleteEvent(event.id, e)}>
                            <View className="flex items-center">
                              <View className="i-mdi-check-circle text-base mr-1"></View>
                              <Text className="text-green-600 font-medium">完成</Text>
                            </View>
                          </Button>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          ) : (
            // 四象限视图
            <View className="mb-6">
              {/* 四象限说明 */}
              <View
                className="mb-4 bg-white rounded-2xl p-4 shadow-md"
                style={{boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}>
                <Text className="text-sm text-muted-foreground text-center mb-2">📊 时间管理四象限矩阵</Text>
                <Text className="text-xs text-muted-foreground text-center">
                  根据事件的紧急程度和重要程度进行分类管理
                </Text>
              </View>

              {/* 四象限布局 */}
              <View className="grid grid-cols-2 gap-3">
                {/* 第一象限：紧急且重要（高优先级） */}
                <View
                  className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 shadow-md"
                  style={{boxShadow: '0 4px 12px rgba(239,68,68,0.2)'}}>
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-alert-circle text-xl text-red-500 mr-2"></View>
                    <Text className="text-sm font-bold text-red-600">紧急且重要</Text>
                  </View>
                  <View className="space-y-2">
                    {events
                      .filter((e) => e.priority === 'high' && e.status !== 'completed')
                      .map((event) => (
                        <View
                          key={event.id}
                          className="bg-white rounded-xl p-3 shadow-sm active:opacity-80 transition-all"
                          onClick={() => handleEventClick(event.id)}>
                          <Text className="text-sm font-medium text-slate-800 line-clamp-1 mb-1">{event.title}</Text>
                          {formatDeadline(event.deadline) && (
                            <Text className={`text-xs ${formatDeadline(event.deadline)?.color}`}>
                              {formatDeadline(event.deadline)?.text}
                            </Text>
                          )}
                        </View>
                      ))}
                    {events.filter((e) => e.priority === 'high' && e.status !== 'completed').length === 0 && (
                      <Text className="text-xs text-red-400 text-center py-4">暂无事件</Text>
                    )}
                  </View>
                </View>

                {/* 第二象限：重要但不紧急（中优先级） */}
                <View
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-md"
                  style={{boxShadow: '0 4px 12px rgba(59,130,246,0.2)'}}>
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-star-circle text-xl text-blue-500 mr-2"></View>
                    <Text className="text-sm font-bold text-blue-600">重要</Text>
                  </View>
                  <View className="space-y-2">
                    {events
                      .filter((e) => e.priority === 'medium' && e.status !== 'completed')
                      .map((event) => (
                        <View
                          key={event.id}
                          className="bg-white rounded-xl p-3 shadow-sm active:opacity-80 transition-all"
                          onClick={() => handleEventClick(event.id)}>
                          <Text className="text-sm font-medium text-slate-800 line-clamp-1 mb-1">{event.title}</Text>
                          {formatDeadline(event.deadline) && (
                            <Text className={`text-xs ${formatDeadline(event.deadline)?.color}`}>
                              {formatDeadline(event.deadline)?.text}
                            </Text>
                          )}
                        </View>
                      ))}
                    {events.filter((e) => e.priority === 'medium' && e.status !== 'completed').length === 0 && (
                      <Text className="text-xs text-blue-400 text-center py-4">暂无事件</Text>
                    )}
                  </View>
                </View>

                {/* 第三象限：紧急但不重要（低优先级） */}
                <View
                  className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 shadow-md"
                  style={{boxShadow: '0 4px 12px rgba(245,158,11,0.2)'}}>
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-clock-fast text-xl text-yellow-600 mr-2"></View>
                    <Text className="text-sm font-bold text-yellow-700">一般</Text>
                  </View>
                  <View className="space-y-2">
                    {events
                      .filter((e) => e.priority === 'low' && e.status !== 'completed')
                      .map((event) => (
                        <View
                          key={event.id}
                          className="bg-white rounded-xl p-3 shadow-sm active:opacity-80 transition-all"
                          onClick={() => handleEventClick(event.id)}>
                          <Text className="text-sm font-medium text-slate-800 line-clamp-1 mb-1">{event.title}</Text>
                          {formatDeadline(event.deadline) && (
                            <Text className={`text-xs ${formatDeadline(event.deadline)?.color}`}>
                              {formatDeadline(event.deadline)?.text}
                            </Text>
                          )}
                        </View>
                      ))}
                    {events.filter((e) => e.priority === 'low' && e.status !== 'completed').length === 0 && (
                      <Text className="text-xs text-yellow-600 text-center py-4">暂无事件</Text>
                    )}
                  </View>
                </View>

                {/* 第四象限：不紧急也不重要（待开始） */}
                <View
                  className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-4 shadow-md"
                  style={{boxShadow: '0 4px 12px rgba(100,116,139,0.2)'}}>
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-pause-circle text-xl text-slate-500 mr-2"></View>
                    <Text className="text-sm font-bold text-slate-600">不紧急不重要</Text>
                  </View>
                  <View className="space-y-2">
                    {events
                      .filter((e) => e.status === 'pending')
                      .map((event) => (
                        <View
                          key={event.id}
                          className="bg-white rounded-xl p-3 shadow-sm active:opacity-80 transition-all"
                          onClick={() => handleEventClick(event.id)}>
                          <Text className="text-sm font-medium text-slate-800 line-clamp-1 mb-1">{event.title}</Text>
                          {formatDeadline(event.deadline) && (
                            <Text className={`text-xs ${formatDeadline(event.deadline)?.color}`}>
                              {formatDeadline(event.deadline)?.text}
                            </Text>
                          )}
                        </View>
                      ))}
                    {events.filter((e) => e.status === 'pending').length === 0 && (
                      <Text className="text-xs text-slate-400 text-center py-4">暂无事件</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* 已完成事件 */}
              {events.filter((e) => e.status === 'completed').length > 0 && (
                <View className="mt-6">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-check-circle text-xl text-green-500 mr-2"></View>
                    <Text className="text-base font-bold text-green-600">已完成事件</Text>
                  </View>
                  <View className="space-y-2">
                    {events
                      .filter((e) => e.status === 'completed')
                      .map((event) => (
                        <View
                          key={event.id}
                          className="bg-slate-50 rounded-xl p-3 shadow-sm opacity-75 active:opacity-60 transition-all"
                          onClick={() => handleEventClick(event.id)}>
                          <Text className="text-sm font-medium text-slate-500 line-through line-clamp-1">
                            {event.title}
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default Home
