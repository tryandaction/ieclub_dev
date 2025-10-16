// ==================== 供需匹配服务 ====================

import { request } from './request'
// import type { DemandMatchResult, SkillTag } from '../types/enhanced'

/**
 * 技能匹配 - 找到能帮你的人
 */
export function findMatchingHelpers(params: {
  topicId?: string
  skillsRequired: string[]
  urgency?: string
  location?: string
  limit?: number
}) {
  return request<{
    matches: any[] // DemandMatchResult[]
    total: number
  }>({
    url: '/api/v2/matching/helpers',
    method: 'POST',
    data: params
  })
}

/**
 * 需求匹配 - 找到你能帮的人
 */
export function findMatchingDemands(params: {
  skills?: string[]
  limit?: number
}) {
  return request<{
    demands: Array<{
      topic: any // EnhancedTopic
      matchScore: number
      matchedSkills: string[]
    }>
  }>({
    url: '/api/v2/matching/demands',
    method: 'GET',
    data: params
  })
}

/**
 * 更新用户技能标签
 */
export function updateUserSkills(skills: any[]) { // SkillTag[]
  return request({
    url: '/api/v2/user/skills',
    method: 'PUT',
    data: { skills }
  })
}