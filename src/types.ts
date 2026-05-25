export type EventProperties = Record<
  string,
  string | number | boolean | undefined
>

export type CaptureInput = {
  event: string
  distinctId: string
  properties?: EventProperties
  timestamp?: string | Date
}

/** Wire payload for PostHog /i/v0/e/ */
export type CaptureBody = {
  api_key: string
  event: string
  distinct_id: string
  properties: EventProperties
  timestamp: string
}

export type TransportPreset = 'auto' | 'beacon' | 'fetch'

/** POST JSON to `url` (e.g. via fetch or sendBeacon). Errors are swallowed by the client. */
export type CaptureTransport = (
  url: string,
  body: CaptureBody
) => void | Promise<void>

export type Transport = TransportPreset | CaptureTransport

/**
 * Bot handling uses PostHog's UA blocklist (`@posthog/core`).
 * - `drop`: skip capture when `$raw_user_agent` (or `is_bot: true`) indicates a bot.
 * - `flag`: add `is_bot` and `bot_name` on bot traffic (from `$raw_user_agent`).
 */
export type BotsMode = 'drop' | 'flag'

export type PosthogZeroOptions = {
  apiKey: string
  /** Ingest host, default `https://us.i.posthog.com` */
  host?: string
  /** Merged into every event's `properties` */
  defaults?: EventProperties
  /** Skip network (capture still resolves) */
  disabled?: boolean
  /** Log sanitized payloads to `console` */
  debug?: boolean
  /**
   * `auto`: sendBeacon when available, else fetch.
   * Or a custom sender that receives the wire payload (serialize as needed).
   */
  transport?: Transport
  bots?: BotsMode
}

export type PosthogZeroClient = {
  capture: (input: CaptureInput) => Promise<void>
}
