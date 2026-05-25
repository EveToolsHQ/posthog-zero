import type {
  CaptureBody,
  CaptureTransport,
  Transport,
  TransportPreset,
} from './types.js'

function isCaptureTransport(
  transport: Transport
): transport is CaptureTransport {
  return typeof transport === 'function'
}

function beaconAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function' &&
    typeof Blob !== 'undefined'
  )
}

function useBeaconPreset(preset: TransportPreset): boolean {
  return beaconAvailable() && (preset === 'beacon' || preset === 'auto')
}

function resolveFetch(): typeof fetch {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch
  throw new Error('posthog-zero: fetch is not available in this runtime')
}

function sendViaBeacon(url: string, body: CaptureBody): Promise<void> {
  const json = JSON.stringify(body)
  const blob = new Blob([json], { type: 'application/json' })
  navigator.sendBeacon(url, blob)
  return Promise.resolve()
}

function sendViaFetch(url: string, body: CaptureBody): Promise<void> {
  const json = JSON.stringify(body)
  return resolveFetch()(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined)
}

export function sendCapture(
  url: string,
  body: CaptureBody,
  transport: Transport
): Promise<void> {
  if (isCaptureTransport(transport)) {
    return Promise.resolve(transport(url, body)).catch(() => undefined)
  }

  if (useBeaconPreset(transport)) {
    return sendViaBeacon(url, body)
  }

  return sendViaFetch(url, body)
}
