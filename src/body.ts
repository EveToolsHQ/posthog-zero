import type { CaptureBody, CaptureInput, EventProperties } from './types.js'

const DEFAULT_HOST = 'https://us.i.posthog.com'

export function normalizeHost(host?: string): string {
  return (host ?? DEFAULT_HOST).replace(/\/$/, '')
}

export function captureUrl(host: string): string {
  return `${normalizeHost(host)}/i/v0/e/`
}

export function toTimestamp(value?: string | Date): string {
  if (value === undefined) return new Date().toISOString()
  if (value instanceof Date) return value.toISOString()
  return value
}

export function buildCaptureBody(
  apiKey: string,
  defaults: EventProperties | undefined,
  input: CaptureInput
): CaptureBody {
  return {
    api_key: apiKey,
    event: input.event,
    distinct_id: input.distinctId,
    properties: {
      ...defaults,
      ...input.properties,
    },
    timestamp: toTimestamp(input.timestamp),
  }
}

/** For debug logs, omit `api_key` */
export function sanitizeCaptureBody(
  body: CaptureBody
): Omit<CaptureBody, 'api_key'> {
  const { api_key: _key, ...rest } = body
  return rest
}
