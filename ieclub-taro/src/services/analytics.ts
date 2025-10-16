// ==================== 分析服务 ====================

import { request } from './request'
// import type { AnalyticsEvent } from '../types/enhanced'

/**
 * 上报埋点事件
 */
export function trackEvent(event: any) { // AnalyticsEvent
  // 使用 sendBeacon 保证上报成功
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(event)], { type: 'application/json' })
    navigator.sendBeacon('/api/v2/analytics/track', blob)
  } else {
    // 降级到普通请求
    request({
      url: '/api/v2/analytics/track',
      method: 'POST',
      data: event,
      needAuth: false
    }).catch(() => {
      // 忽略错误，不影响用户体验
    })
  }
}

/**
 * 上报页面访问
 */
export function trackPageView(page: string, referrer?: string) {
  trackEvent({
    eventType: 'page_view',
    sessionId: getSessionId(),
    timestamp: new Date(),
    properties: { page, referrer },
    page,
    referrer,
    device: getDeviceInfo()
  })
}

/**
 * 上报用户行为
 */
export function trackAction(action: string, properties: Record<string, any>) {
  trackEvent({
    eventType: 'user_action',
    sessionId: getSessionId(),
    timestamp: new Date(),
    properties: { action, ...properties },
    device: getDeviceInfo()
  })
}

// 辅助函数
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

function getDeviceInfo() {
  const ua = navigator.userAgent
  return {
    type: /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop',
    os: getOS(ua),
    browser: getBrowser(ua)
  }
}

function getOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  if (/android/i.test(ua)) return 'Android'
  if (/ios|iphone|ipad/i.test(ua)) return 'iOS'
  return 'Unknown'
}

function getBrowser(ua: string): string {
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  if (/edge/i.test(ua)) return 'Edge'
  return 'Unknown'
}