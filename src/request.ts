import {
  detectBrowser,
  detectBrowserVersion,
  detectDevice,
  detectDeviceType,
  detectOS,
} from '@posthog/core/utils'

import type { EventProperties } from './types.js'

function getSearchEngine(referrer: string | undefined): string | undefined {
  if (!referrer) return undefined
  try {
    const host = new URL(referrer).hostname
    if (host === 'google.com' || host.endsWith('.google.com')) return 'google'
    if (host === 'bing.com' || host.endsWith('.bing.com')) return 'bing'
    if (host === 'yahoo.com' || host.endsWith('.yahoo.com')) return 'yahoo'
    if (host === 'duckduckgo.com' || host.endsWith('.duckduckgo.com'))
      return 'duckduckgo'
  } catch {
    // ignore malformed URLs
  }
  return undefined
}

function getUrlProperties(request: Request): EventProperties {
  try {
    const parsedUrl = new URL(request.url)
    return {
      $current_url: parsedUrl.href,
      $host: parsedUrl.hostname,
      $pathname: parsedUrl.pathname,
      $search: parsedUrl.search || undefined,
    }
  } catch {
    return {}
  }
}

/**
 * PostHog-style properties from a generic `Request` (Workers, Astro middleware, etc.):
 * request URL, referrer, user-agent, browser/OS/device (`$raw_user_agent` for `bots` option).
 * Merge any extra properties in your `capture` call.
 */
export function getRequestProperties(request: Request): EventProperties {
  const referer = request.headers.get('referer') ?? undefined
  let referringDomain: string | undefined
  try {
    referringDomain = referer
      ? new URL(referer).hostname || undefined
      : undefined
  } catch {
    referringDomain = undefined
  }

  const uaString = request.headers.get('user-agent') ?? undefined
  const [osName, osVersion] = uaString ? detectOS(uaString) : ['', '']
  const browserName = uaString ? detectBrowser(uaString, '') : ''
  const browserVersion = uaString ? detectBrowserVersion(uaString, '') : null

  const browserLanguage =
    request.headers.get('accept-language')?.split(',')[0]?.trim() || undefined

  return {
    ...getUrlProperties(request),
    $referrer: referer,
    $referring_domain: referringDomain,
    $raw_user_agent: uaString,
    $browser_language: browserLanguage,
    $browser_language_prefix: browserLanguage?.split('-')[0],
    $search_engine: getSearchEngine(referer),
    $os: osName || undefined,
    $os_version: osVersion || undefined,
    $browser: browserName || undefined,
    $browser_version: browserVersion ?? undefined,
    $device: uaString ? detectDevice(uaString) || undefined : undefined,
    $device_type: uaString
      ? detectDeviceType(uaString) || undefined
      : undefined,
  }
}
