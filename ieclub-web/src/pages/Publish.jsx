import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createTopic } from '../api/topic'
import { showToast } from '../components/Toast'
import ImageUpload from '../components/ImageUpload'

// 板块类型配置
const typeConfig = {
  demand: {
    id: 'demand',
    label: '我想听',
    icon: '👂',
    color: 'from-cyan-500 to-cyan-600',
    bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    description: '发布你想学习的话题，找到能教你的人',
    placeholder: {
      title: '例如：想学Python数据分析',
      content: '详细描述你想学习的内容、你的基础水平、期望达到的效果...'
    }
  },
  offer: {
    id: 'offer',
    label: '我来讲',
    icon: '🎤',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
    description: '分享你的知识，满15人可开讲',
    placeholder: {
      title: '例如：Python数据分析入门',
      content: '课程大纲、你的专业背景、适合什么基础的同学...'
    }
  },
  project: {
    id: 'project',
    label: '项目',
    icon: '🚀',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    description: '招募项目队友，一起创造',
    placeholder: {
      title: '例如：校园二手交易小程序',
      content: '项目介绍、目标、当前进展、需要什么样的队友...'
    }
  },
  share: {
    id: 'share',
    label: '分享',
    icon: '💡',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
    description: '分享知识、经验、资源',
    placeholder: {
      title: '例如：期末复习资料分享',
      content: '分享的内容、适合谁、如何获取...'
    }
  }
}

// 预设标签
const presetTags = {
  demand: ['编程', '设计', '考研', '语言', '数学', '物理', '经济', '法律'],
  offer: ['Python', 'Java', 'UI设计', '摄影', '视频剪辑', '写作', '演讲'],
  project: ['小程序', 'APP', '网站', '比赛', '创业', '公益', '调研'],
  share: ['学习资料', '求职经验', '考试攻略', '工具推荐', '读书笔记']
}

// 项目阶段选项
const projectStages = ['创意阶段', '开发中', '已上线', '招募中']

// 时长选项  
const durationOptions = ['30分钟', '1小时', '2小时', '半天', '一天', '多天']

// 紧急程度选项
const urgencyOptions = [
  { value: 'low', label: '不急，随时都行', color: 'text-green-600' },
  { value: 'medium', label: '一般，一周内', color: 'text-yellow-600' },
  { value: 'high', label: '较急，尽快', color: 'text-orange-600' },
  { value: 'urgent', label: '非常紧急', color: 'text-red-600' }
]

// 资源类型选项
const resourceTypes = [
  { value: 'document', label: '📄 文档资料', desc: 'PDF、Word、PPT等' },
  { value: 'video', label: '🎬 视频教程', desc: '录播课程、教学视频' },
  { value: 'code', label: '💻 代码项目', desc: 'GitHub、源码包' },
  { value: 'tool', label: '🔧 工具软件', desc: '实用工具、插件' },
  { value: 'experience', label: '💡 经验分享', desc: '心得、攻略、总结' },
  { value: 'other', label: '📦 其他资源', desc: '其他类型资源' }
]

export default function Publish() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // 基础状态
  const [publishType, setPublishType] = useState('demand')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  
  // 我想听/我来讲 特有
  const [duration, setDuration] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [threshold, setThreshold] = useState(15)
  
  // 项目特有
  const [projectStage, setProjectStage] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [lookingForRoles, setLookingForRoles] = useState([])
  const [roleInput, setRoleInput] = useState('')
  const [skillsNeeded, setSkillsNeeded] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  
  // 我想听特有
  const [urgency, setUrgency] = useState('medium')
  
  // 分享特有
  const [resourceType, setResourceType] = useState('')
  const [downloadLink, setDownloadLink] = useState('')
  const [extractCode, setExtractCode] = useState('')

  // 初始化类型
  useEffect(() => {
    const type = searchParams.get('type')
    if (type && typeConfig[type]) {
      setPublishType(type)
    }
  }, [searchParams])

  // 添加标签
  const addTag = (tag) => {
    if (!tag.trim()) return
    if (tags.includes(tag.trim())) {
      showToast('标签已存在', 'warning')
      return
    }
    if (tags.length >= 5) {
      showToast('最多5个标签', 'warning')
      return
    }
    setTags([...tags, tag.trim()])
    setTagInput('')
  }

  // 移除标签
  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  // 添加角色
  const addRole = () => {
    if (!roleInput.trim()) return
    if (!lookingForRoles.includes(roleInput.trim())) {
      setLookingForRoles([...lookingForRoles, roleInput.trim()])
    }
    setRoleInput('')
  }

  // 添加技能
  const addSkill = () => {
    if (!skillInput.trim()) return
    if (!skillsNeeded.includes(skillInput.trim())) {
      setSkillsNeeded([...skillsNeeded, skillInput.trim()])
    }
    setSkillInput('')
  }

  const handlePublish = async () => {
    // 验证
    if (!title.trim()) {
      showToast('请输入标题', 'warning')
      return
    }
    if (title.length < 5) {
      showToast('标题至少5个字', 'warning')
      return
    }
    if (!content.trim()) {
      showToast('请输入描述', 'warning')
      return
    }
    if (content.length < 10) {
      showToast('内容至少10个字', 'warning')
      return
    }
    if (publishType === 'project' && !projectStage) {
      showToast('请选择项目阶段', 'warning')
      return
    }

    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('需要登录后才能发布', 'warning')
      setTimeout(() => navigate('/login'), 1500)
      return
    }

    try {
      setLoading(true)
      
      // 构建请求数据
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category: publishType,
        topicType: publishType,
        tags,
        images: images.map(img => img.url),
      }
      
      // 根据类型添加特定字段
      if (publishType === 'demand' || publishType === 'offer') {
        if (duration) postData.duration = duration
        if (targetAudience) postData.targetAudience = targetAudience
        if (publishType === 'offer') {
          postData.threshold = threshold
        }
      }
      
      if (publishType === 'project') {
        if (projectStage) postData.projectStage = projectStage
        if (teamSize) postData.teamSize = parseInt(teamSize) || null
        if (lookingForRoles.length) postData.lookingForRoles = lookingForRoles
        if (skillsNeeded.length) postData.skillsNeeded = skillsNeeded
        if (website) postData.website = website
        if (github) postData.github = github
        if (contactInfo) postData.contactInfo = contactInfo
      }
      
      if (publishType === 'demand') {
        postData.urgency = urgency
      }
      
      if (publishType === 'share') {
        if (resourceType) postData.resourceType = resourceType
        if (downloadLink) postData.downloadLink = downloadLink
        if (extractCode) postData.extractCode = extractCode
      }

      await createTopic(postData)

      showToast('发布成功！🎉', 'success')
      
      // 跳转到广场
      setTimeout(() => navigate('/plaza'), 1000)
    } catch (error) {
      console.error('发布失败:', error)
      showToast(error.response?.data?.message || '发布失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const currentType = typeConfig[publishType]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 - 动态显示当前类型 */}
      <div className={`${currentType.bg} text-white rounded-2xl p-8 shadow-lg`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{currentType.icon}</span>
          <div>
            <h1 className="text-3xl font-bold mb-1">{currentType.label}</h1>
            <p className="text-white/90">{currentType.description}</p>
          </div>
        </div>
      </div>

      {/* 类型选择 */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">选择类型</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.values(typeConfig).map((type) => (
            <button
              key={type.id}
              onClick={() => setPublishType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                publishType === type.id
                  ? `${type.bg} text-white border-transparent shadow-lg scale-105`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-bold text-sm">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 表单 */}
      <div className="card space-y-6">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={currentType.placeholder.title}
            maxLength={50}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{title.length}/50</div>
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            详细描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={currentType.placeholder.content}
            rows={8}
            maxLength={2000}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{content.length}/2000</div>
        </div>

        {/* 我想听/我来讲 专属字段 */}
        {(publishType === 'demand' || publishType === 'offer') && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              📅 时间安排
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">期望时长</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择</option>
                  {durationOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">目标听众</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例如：有Python基础的同学"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {publishType === 'offer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成团人数</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Math.max(5, Math.min(100, parseInt(e.target.value) || 15)))}
                    min={5}
                    max={100}
                    className="w-24 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-bold text-purple-600"
                  />
                  <span className="text-gray-600">人想听后开讲</span>
                </div>
              </div>
            )}
            
            {publishType === 'demand' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">紧急程度</label>
                <div className="grid grid-cols-2 gap-3">
                  {urgencyOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUrgency(opt.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        urgency === opt.value
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-gray-200 hover:border-cyan-300'
                      }`}
                    >
                      <span className={`font-medium ${urgency === opt.value ? opt.color : 'text-gray-700'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 分享专属字段 */}
        {publishType === 'share' && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              💡 资源信息
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">资源类型</label>
              <div className="grid grid-cols-3 gap-3">
                {resourceTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setResourceType(type.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      resourceType === type.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">下载/访问链接</label>
                <input
                  type="url"
                  value={downloadLink}
                  onChange={(e) => setDownloadLink(e.target.value)}
                  placeholder="百度网盘/GitHub/其他链接"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">提取码（如有）</label>
                <input
                  type="text"
                  value={extractCode}
                  onChange={(e) => setExtractCode(e.target.value)}
                  placeholder="网盘提取码"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 项目专属字段 */}
        {publishType === 'project' && (
          <>
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                🚀 项目信息
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目阶段 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={projectStage}
                    onChange={(e) => setProjectStage(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">请选择</option>
                    {projectStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">团队规模</label>
                  <input
                    type="number"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    placeholder="目前团队人数"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                👥 招募需求
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">招募角色</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRole()}
                    placeholder="如：前端工程师"
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button onClick={addRole} className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600">
                    添加
                  </button>
                </div>
                {lookingForRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lookingForRoles.map((role, i) => (
                      <span key={i} className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {role}
                        <button onClick={() => setLookingForRoles(lookingForRoles.filter((_, idx) => idx !== i))} className="hover:text-purple-800">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所需技能</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="如：React、Node.js"
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button onClick={addSkill} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">
                    添加
                  </button>
                </div>
                {skillsNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillsNeeded.map((skill, i) => (
                      <span key={i} className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {skill}
                        <button onClick={() => setSkillsNeeded(skillsNeeded.filter((_, idx) => idx !== i))} className="hover:text-emerald-800">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                🔗 联系方式
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">项目网站</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系方式</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="微信/邮箱/手机号"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </>
        )}

        {/* 标签选择 */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            🏷️ 标签
          </h3>
          
          {/* 预设标签 */}
          <div className="flex flex-wrap gap-2">
            {presetTags[publishType].map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  tags.includes(tag)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          {/* 自定义标签 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag(tagInput)}
              placeholder="自定义标签"
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button onClick={() => addTag(tagInput)} className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600">
              添加
            </button>
          </div>
          
          {/* 已选标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  #{tag}
                  <button onClick={() => removeTag(index)} className="hover:text-purple-200">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            上传图片
            <span className="ml-2 text-xs text-gray-500 font-normal">（选填，最多9张）</span>
          </label>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxCount={9}
            maxSize={5}
          />
        </div>

        {/* 发布按钮 */}
        <button
          onClick={handlePublish}
          disabled={loading}
          className={`w-full ${currentType.bg} text-white py-4 rounded-xl font-bold text-lg transition-all ${
            loading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-lg hover:scale-[1.02]'
          }`}
        >
          {loading ? '发布中...' : `发布${currentType.label}`}
        </button>
      </div>
    </div>
  )
}

