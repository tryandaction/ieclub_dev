import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '../../components/common/Button.jsx';
import { Tag } from '../../components/common/Tag.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';
import { TextArea } from '../../components/common/TextArea.jsx';

/**
 * 活动详情页组件
 * 功能：
 * - 活动详细信息展示
 * - 活动报名/取消报名
 * - 活动签到（二维码）
 * - 活动评价
 * - 参与者列表
 * - 活动议程展示
 * - 分享功能
 */
export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState('detail'); // detail, agenda, participants, reviews
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    note: ''
  });
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    content: ''
  });

  // 模拟数据加载
  useEffect(() => {
    // 模拟API调用
    setTimeout(() => {
      setEvent({
        id: parseInt(id),
        title: '跨学科创新论坛：AI时代的教育变革',
        coverImage: null, // 可以添加封面图
        category: '学术讲座',
        organizer: {
          id: 1,
          name: '王教授团队',
          avatar: null,
          bio: '教育学院资深教授，专注于教育创新研究'
        },
        date: '2025-10-15 14:00',
        endDate: '2025-10-15 17:00',
        location: '慧园行政楼报告厅',
        locationDetail: '北京师范大学慧园行政楼一层报告厅，地铁4号线北师大站A口出',
        participants: 45,
        maxParticipants: 100,
        registrationDeadline: '2025-10-14 23:59',
        tags: ['学术讲座', '跨学科', 'AI', '教育创新'],
        description: `
本次论坛邀请教育学、计算机科学、心理学等多领域专家，从不同视角探讨AI如何重塑教育形态。

### 论坛亮点
- 🎯 多学科专家深度对话
- 🔥 前沿研究成果分享
- 💡 互动讨论与思维碰撞
- 🤝 学术交流与合作机会

### 适合人群
- 教育学、计算机、心理学相关专业师生
- 对AI教育应用感兴趣的研究者
- 教育创新实践者

### 温馨提示
- 建议提前15分钟到场签到
- 可携带笔记本电脑参与互动
- 论坛结束后有茶歇交流环节
        `,
        agenda: [
          {
            time: '14:00 - 14:15',
            title: '开幕致辞',
            speaker: '王教授',
            description: '论坛背景介绍与嘉宾介绍'
          },
          {
            time: '14:15 - 15:00',
            title: 'AI驱动的个性化学习',
            speaker: '李教授（计算机学院）',
            description: '介绍AI在个性化教育中的最新应用与研究成果'
          },
          {
            time: '15:00 - 15:45',
            title: '教育心理学视角下的AI辅助教学',
            speaker: '张教授（心理学院）',
            description: '从认知科学角度探讨AI教学工具的设计原则'
          },
          {
            time: '15:45 - 16:00',
            title: '茶歇',
            speaker: null,
            description: '休息与自由交流'
          },
          {
            time: '16:00 - 16:40',
            title: '圆桌讨论：AI教育的机遇与挑战',
            speaker: '全体嘉宾',
            description: '开放式讨论，观众可以提问互动'
          },
          {
            time: '16:40 - 17:00',
            title: '总结与展望',
            speaker: '王教授',
            description: '论坛总结与未来展望'
          }
        ],
        speakers: [
          {
            id: 1,
            name: '王教授',
            title: '教育学院院长',
            avatar: null,
            bio: '教育创新研究专家，发表论文100+篇'
          },
          {
            id: 2,
            name: '李教授',
            title: '计算机学院教授',
            avatar: null,
            bio: 'AI教育应用研究者，多个国家级项目负责人'
          },
          {
            id: 3,
            name: '张教授',
            title: '心理学院教授',
            avatar: null,
            bio: '认知科学与教育心理学专家'
          }
        ],
        participantsList: [
          { id: 1, name: '小明', avatar: null, major: '教育学', grade: '研一' },
          { id: 2, name: '小红', avatar: null, major: '计算机', grade: '本科三年级' },
          { id: 3, name: '小刚', avatar: null, major: '心理学', grade: '研二' },
        ],
        reviews: [
          {
            id: 1,
            user: { name: '小李', avatar: null },
            rating: 5,
            content: '非常精彩的论坛！多位专家的观点都很有启发性。',
            date: '2025-10-15 18:00',
            likes: 12
          },
          {
            id: 2,
            user: { name: '小王', avatar: null },
            rating: 4,
            content: '内容很丰富，建议增加更多互动环节。',
            date: '2025-10-15 19:30',
            likes: 8
          }
        ],
        requirements: [
          '需实名报名',
          '请准时到场',
          '禁止录音录像（除非获得许可）',
          '保持会场安静'
        ],
        contact: {
          name: '王老师',
          phone: '010-1234567',
          email: 'wang@bnu.edu.cn'
        },
        status: 'upcoming', // upcoming, ongoing, ended, cancelled
        canCheckIn: false, // 是否可以签到
        checkInCode: 'QR123456' // 签到二维码数据
      });
      setLoading(false);
    }, 500);
  }, [id]);

  // 处理报名
  const handleRegister = () => {
    if (!registerForm.name || !registerForm.phone) {
      alert('请填写必填信息');
      return;
    }
    // TODO: 调用API提交报名信息
    setRegistered(true);
    setShowRegisterModal(false);
    setRegisterForm({ name: '', phone: '', email: '', note: '' });
  };

  // 处理取消报名
  const handleCancelRegistration = () => {
    if (window.confirm('确定要取消报名吗？')) {
      // TODO: 调用API取消报名
      setRegistered(false);
    }
  };

  // 处理签到
  const handleCheckIn = () => {
    // TODO: 调用API进行签到
    alert('签到成功！');
    setShowCheckInModal(false);
  };

  // 提交评价
  const handleSubmitReview = () => {
    if (!reviewForm.content.trim()) {
      alert('请填写评价内容');
      return;
    }
    // TODO: 调用API提交评价
    const newReview = {
      id: Date.now(),
      user: { name: '我', avatar: null },
      rating: reviewForm.rating,
      content: reviewForm.content,
      date: new Date().toLocaleString('zh-CN'),
      likes: 0
    };
    setEvent({
      ...event,
      reviews: [newReview, ...event.reviews]
    });
    setShowReviewModal(false);
    setReviewForm({ rating: 5, content: '' });
  };

  // 分享功能
  const handleShare = () => {
    // TODO: 实现分享功能
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description.substring(0, 100),
        url: window.location.href
      });
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon icon="eos-icons:loading" className="text-4xl text-purple-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Icon icon="mdi:alert-circle-outline" className="text-6xl text-gray-400 mb-4" />
        <p className="text-gray-600">活动不存在</p>
        <Button variant="primary" onClick={() => navigate('/events')} className="mt-4">
          返回活动列表
        </Button>
      </div>
    );
  }

  const progress = (event.participants / event.maxParticipants) * 100;
  const isFull = event.participants >= event.maxParticipants;
  const isEnded = event.status === 'ended';
  const canRegister = !isFull && !isEnded && event.status === 'upcoming';

  return (
    <div className="pb-20 md:pb-6">
      {/* 返回按钮 */}
      <div className="sticky top-0 z-30 bg-white border-b md:relative md:bg-transparent md:border-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="text-2xl text-gray-700" />
          </button>
          <h1 className="font-bold text-lg truncate flex-1">活动详情</h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon icon="mdi:share-variant" className="text-xl text-gray-700" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-4">
        {/* 活动头部 */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6">
          {/* 封面图（如果有） */}
          {event.coverImage && (
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
              <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* 没有封面图则显示渐变背景 */}
          {!event.coverImage && (
            <div className="relative h-32 md:h-40 bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 flex items-center justify-center">
              <span className="text-6xl md:text-7xl">📅</span>
            </div>
          )}

          <div className="p-6">
            {/* 标题和类别 */}
            <div className="mb-4">
              <Tag variant="green" className="mb-3">{event.category}</Tag>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <Tag key={idx} variant="purple" size="sm">#{tag}</Tag>
                ))}
              </div>
            </div>

            {/* 活动信息网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InfoItem
                icon="mdi:calendar-clock"
                label="活动时间"
                value={`${event.date} - ${event.endDate.split(' ')[1]}`}
              />
              <InfoItem
                icon="mdi:map-marker"
                label="活动地点"
                value={event.location}
              />
              <InfoItem
                icon="mdi:account-group"
                label="参与人数"
                value={`${event.participants}/${event.maxParticipants}人`}
              />
              <InfoItem
                icon="mdi:clock-alert"
                label="报名截止"
                value={event.registrationDeadline}
              />
            </div>

            {/* 报名进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-semibold">报名进度</span>
                <span className="font-bold text-gray-800">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress >= 80
                      ? 'bg-gradient-to-r from-red-400 to-red-600'
                      : 'bg-gradient-to-r from-green-400 to-teal-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 主办方信息 */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Avatar name={event.organizer.name} size="md" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{event.organizer.name}</div>
                <div className="text-sm text-gray-600">{event.organizer.bio}</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 flex gap-3">
              {registered ? (
                <>
                  <Button
                    variant="success"
                    icon="mdi:check-circle"
                    className="flex-1"
                    disabled
                  >
                    已报名
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelRegistration}
                    className="flex-1"
                  >
                    取消报名
                  </Button>
                </>
              ) : (
                <Button
                  variant={canRegister ? 'primary' : 'secondary'}
                  icon={canRegister ? 'mdi:account-plus' : 'mdi:close-circle'}
                  onClick={() => canRegister && setShowRegisterModal(true)}
                  disabled={!canRegister}
                  className="flex-1"
                >
                  {isFull ? '活动已满' : isEnded ? '活动已结束' : '立即报名'}
                </Button>
              )}
              {registered && event.canCheckIn && (
                <Button
                  variant="primary"
                  icon="mdi:qrcode-scan"
                  onClick={() => setShowCheckInModal(true)}
                >
                  签到
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6">
          <div className="flex border-b overflow-x-auto scrollbar-hide">
            <TabButton
              active={activeTab === 'detail'}
              onClick={() => setActiveTab('detail')}
              icon="mdi:text-box"
            >
              详情
            </TabButton>
            <TabButton
              active={activeTab === 'agenda'}
              onClick={() => setActiveTab('agenda')}
              icon="mdi:format-list-bulleted"
            >
              议程
            </TabButton>
            <TabButton
              active={activeTab === 'speakers'}
              onClick={() => setActiveTab('speakers')}
              icon="mdi:account-tie"
            >
              嘉宾
            </TabButton>
            <TabButton
              active={activeTab === 'participants'}
              onClick={() => setActiveTab('participants')}
              icon="mdi:account-group"
            >
              参与者
            </TabButton>
            <TabButton
              active={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              icon="mdi:star"
            >
              评价
            </TabButton>
          </div>

          <div className="p-6">
            {/* 详情Tab */}
            {activeTab === 'detail' && (
              <div className="prose max-w-none">
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: event.description.replace(/###/g, '<h3 class="font-bold text-lg mt-4 mb-2">').replace(/\n/g, '<br/>') }}
                />
                
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Icon icon="mdi:information" className="text-blue-600" />
                    活动要求
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {event.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Icon icon="mdi:check" className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Icon icon="mdi:phone" className="text-gray-600" />
                    联系方式
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>联系人：{event.contact.name}</p>
                    <p>电话：{event.contact.phone}</p>
                    <p>邮箱：{event.contact.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 议程Tab */}
            {activeTab === 'agenda' && (
              <div className="space-y-4">
                {event.agenda.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-24 text-sm font-semibold text-purple-600">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
                      {item.speaker && (
                        <p className="text-sm text-gray-600 mb-1">
                          <Icon icon="mdi:account" className="inline mr-1" />
                          {item.speaker}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 嘉宾Tab */}
            {activeTab === 'speakers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <Avatar name={speaker.name} size="lg" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{speaker.name}</h4>
                      <p className="text-sm text-purple-600 mb-2">{speaker.title}</p>
                      <p className="text-sm text-gray-600">{speaker.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 参与者Tab */}
            {activeTab === 'participants' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">
                    已报名 {event.participants} 人
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {event.participantsList.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <Avatar name={participant.name} size="md" className="mb-2" />
                      <div className="font-semibold text-sm text-gray-800">
                        {participant.name}
                      </div>
                      <div className="text-xs text-gray-600">{participant.major}</div>
                      <div className="text-xs text-gray-500">{participant.grade}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 评价Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">
                    活动评价 ({event.reviews.length})
                  </h3>
                  {isEnded && registered && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon="mdi:star"
                      onClick={() => setShowReviewModal(true)}
                    >
                      写评价
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {event.reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Icon icon="mdi:comment-text-outline" className="text-5xl mx-auto mb-2 opacity-50" />
                      <p>暂无评价</p>
                    </div>
                  ) : (
                    event.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar name={review.user.name} size="sm" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-800">
                                {review.user.name}
                              </span>
                              <span className="text-xs text-gray-500">{review.date}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  icon={star <= review.rating ? 'mdi:star' : 'mdi:star-outline'}
                                  className={`text-lg ${
                                    star <= review.rating ? 'text-yellow-500' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{review.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <button className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                            <Icon icon="mdi:thumb-up-outline" />
                            <span>{review.likes}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 报名Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="活动报名"
      >
        <div className="space-y-4">
          <Input
            label="姓名"
            required
            value={registerForm.name}
            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
            placeholder="请输入真实姓名"
          />
          <Input
            label="手机号"
            required
            type="tel"
            value={registerForm.phone}
            onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
            placeholder="用于接收活动通知"
          />
          <Input
            label="邮箱"
            type="email"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            placeholder="选填"
          />
          <TextArea
            label="备注"
            value={registerForm.note}
            onChange={(e) => setRegisterForm({ ...registerForm, note: e.target.value })}
            placeholder="有什么想对主办方说的吗？（选填）"
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleRegister} className="flex-1">
              确认报名
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowRegisterModal(false)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 签到Modal */}
      <Modal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        title="活动签到"
      >
        <div className="text-center">
          <div className="bg-gray-100 p-8 rounded-xl mb-4 inline-block">
            {/* TODO: 生成实际的二维码 */}
            <div className="w-48 h-48 bg-white border-2 border-gray-300 flex items-center justify-center">
              <Icon icon="mdi:qrcode" className="text-8xl text-gray-400" />
            </div>
          </div>
          <p className="text-gray-600 mb-4">请向工作人员出示此二维码进行签到</p>
          <Button variant="primary" onClick={handleCheckIn} className="w-full">
            确认签到
          </Button>
        </div>
      </Modal>

      {/* 评价Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="活动评价"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">活动评分</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="transition-transform hover:scale-110"
                >
                  <Icon
                    icon={star <= reviewForm.rating ? 'mdi:star' : 'mdi:star-outline'}
                    className={`text-4xl ${
                      star <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <TextArea
            label="评价内容"
            required
            value={reviewForm.content}
            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
            placeholder="分享你对这次活动的感受吧..."
            rows={5}
          />
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleSubmitReview} className="flex-1">
              提交评价
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowReviewModal(false)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 信息项组件
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon icon={icon} className="text-xl text-purple-600 mt-0.5 flex-shrink-0" />
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  </div>
);

// Tab按钮组件
const TabButton = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-semibold whitespace-nowrap transition-all ${
      active
        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    }`}
  >
    <Icon icon={icon} className="text-lg" />
    <span>{children}</span>
  </button>
);

export default EventDetailPage;

