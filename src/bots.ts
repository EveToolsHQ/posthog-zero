import { DEFAULT_BLOCKED_UA_STRS, isBlockedUA } from '@posthog/core/utils'

import type { BotsMode, CaptureBody, EventProperties } from './types.js'

/** Matched blocklist substring, if any. */
export function getBotName(ua: string | undefined): string | undefined {
  if (!ua) return undefined
  const uaLower = ua.toLowerCase()
  for (const blocked of DEFAULT_BLOCKED_UA_STRS) {
    if (uaLower.indexOf(blocked.toLowerCase()) !== -1) {
      return blocked
    }
  }
  return undefined
}

export function isBotFromProperties(
  properties: EventProperties | undefined
): boolean {
  if (!properties) return false
  if (properties.is_bot === true) return true
  const ua = properties.$raw_user_agent
  if (typeof ua === 'string') return isBlockedUA(ua)
  return false
}

/** Adds `is_bot` and `bot_name` when UA matches PostHog's blocklist. */
export function enrichBotFlags(properties: EventProperties): EventProperties {
  const ua = properties.$raw_user_agent
  if (typeof ua !== 'string') return properties
  const botName = getBotName(ua)
  if (!botName) return properties
  return { ...properties, is_bot: true, bot_name: botName }
}

/** Returns `null` when `bots: 'drop'` and properties indicate a bot. */
export function applyBotsMode(
  body: CaptureBody,
  bots: BotsMode | undefined
): CaptureBody | null {
  if (!bots) return body

  if (bots === 'drop') {
    return isBotFromProperties(body.properties) ? null : body
  }

  return { ...body, properties: enrichBotFlags(body.properties) }
}
