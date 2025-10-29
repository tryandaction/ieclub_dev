const mockActivities = [
  {
    id: 1,
    title: 'Python数据分析工作坊',
    cover: '🐍',
    time: '明天 14:00-17:00',
    location: '图书馆301',
    participants: { current: 23, max: 30 },
  },
]

export default function Activities() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">精彩活动</h1>
        <p className="text-white/90">参与活动，收获成长</p>
      </div>

      {/* 活动网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
            {/* 封面 */}
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-48 flex items-center justify-center">
              <span className="text-8xl">{activity.cover}</span>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{activity.title}</h3>

              <div className="space-y-2 text-sm text-gray-600">
                <p>🕐 {activity.time}</p>
                <p>📍 {activity.location}</p>
                <p>👥 {activity.participants.current}/{activity.participants.max} 人</p>
              </div>

              <button className="w-full bg-gradient-primary text-white py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all">
                立即报名
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

