// ==================== 分析Hooks ====================

import { useCallback } from 'react'
import { trackAction, trackPageView } from '../services/analytics'

export function useActionTracking() {
  const track = useCallback((action: string, properties: Record<string, any> = {}) => {
    trackAction(action, properties)
  }, [])

  return { track }
}

export function usePageTracking(page: string) {
  const trackView = useCallback((referrer?: string) => {
    trackPageView(page, referrer)
  }, [page])

  return { trackView }
}