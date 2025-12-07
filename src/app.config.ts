const pages = [
  'pages/home/index',
  'pages/history/index',
  'pages/login/index',
  'pages/create-event/index',
  'pages/event-detail/index',
  'pages/edit-event/index',
  'pages/add-step/index'
]

export default defineAppConfig({
  pages,
  tabBar: {
    color: '#64748b',
    selectedColor: '#1E3A8A',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '事件',
        iconPath: './assets/images/unselected/home.png',
        selectedIconPath: './assets/images/selected/home.png'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史',
        iconPath: './assets/images/unselected/history.png',
        selectedIconPath: './assets/images/selected/history.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '重要事件管理',
    navigationBarTextStyle: 'black'
  }
})
