import { buildCaptureBody, captureUrl, sanitizeCaptureBody } from './body.js'
import { applyBotsMode } from './bots.js'
import { sendCapture } from './transport.js'
import type {
  CaptureInput,
  PosthogZeroClient,
  PosthogZeroOptions,
} from './types.js'

export function posthogZero(options: PosthogZeroOptions): PosthogZeroClient {
  const host = options.host
  const url = captureUrl(host ?? 'https://us.i.posthog.com')
  const defaults = options.defaults
  const disabled = options.disabled ?? false
  const debug = options.debug ?? false
  const transport = options.transport ?? 'auto'
  const bots = options.bots

  return {
    capture(input: CaptureInput): Promise<void> {
      const body = applyBotsMode(
        buildCaptureBody(options.apiKey, defaults, input),
        bots
      )

      if (!body) {
        return Promise.resolve()
      }

      if (debug) {
        console.info('[posthog-zero]', sanitizeCaptureBody(body))
      }

      if (disabled) {
        return Promise.resolve()
      }

      return sendCapture(url, body, transport)
    },
  }
}
