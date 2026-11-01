type AnalyticsValue =
  | string
  | number
  | boolean
  | Array<Record<string, string | number | boolean>>
type AnalyticsParams = Record<string, AnalyticsValue>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
let initialized = false
const sentOnce = new Set<string>()

function initializeAnalytics() {
  if (initialized || !measurementId || typeof window === 'undefined') return
  initialized = true
  window.dataLayer = window.dataLayer ?? []
  // gtag.js only recognises commands pushed as an `arguments` object, exactly as in
  // Google's official snippet. Pushing a plain array (e.g. rest args) is silently ignored.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
}

function send(eventName: string, params: AnalyticsParams = {}) {
  initializeAnalytics()
  if (!measurementId || !window.gtag) return
  window.gtag('event', eventName, params)
}

export function trackOnce(eventName: string, key: string, params: AnalyticsParams = {}) {
  const eventKey = `${eventName}:${key}`
  if (sentOnce.has(eventKey)) return
  sentOnce.add(eventKey)
  send(eventName, params)
}

export function trackPageView() {
  trackOnce('page_view', window.location.pathname, {
    page_path: window.location.pathname,
    page_title: document.title,
  })
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  send(eventName, params)
}
