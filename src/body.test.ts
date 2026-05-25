import { describe, expect, it } from 'vitest'

import { buildCaptureBody, captureUrl, sanitizeCaptureBody } from './body.js'

describe('buildCaptureBody', () => {
  it('maps camelCase distinctId to distinct_id', () => {
    const body = buildCaptureBody(
      'phc_test',
      { app: 'x' },
      {
        event: 'click',
        distinctId: 'user-1',
        properties: { foo: 'bar' },
      }
    )

    expect(body).toEqual({
      api_key: 'phc_test',
      event: 'click',
      distinct_id: 'user-1',
      properties: { app: 'x', foo: 'bar' },
      timestamp: expect.any(String),
    })
  })

  it('uses custom timestamp', () => {
    const body = buildCaptureBody('k', undefined, {
      event: 'e',
      distinctId: 'd',
      timestamp: '2020-01-01T00:00:00.000Z',
    })
    expect(body.timestamp).toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('captureUrl', () => {
  it('strips trailing slash on host', () => {
    expect(captureUrl('https://us.i.posthog.com/')).toBe(
      'https://us.i.posthog.com/i/v0/e/'
    )
  })
})

describe('sanitizeCaptureBody', () => {
  it('removes api_key', () => {
    const body = buildCaptureBody('secret', undefined, {
      event: 'e',
      distinctId: 'd',
    })
    expect(sanitizeCaptureBody(body)).not.toHaveProperty('api_key')
    expect(sanitizeCaptureBody(body).event).toBe('e')
  })
})
