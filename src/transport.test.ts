import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendCapture } from './transport.js'
import type { CaptureBody } from './types.js'

const body: CaptureBody = {
  api_key: 'phc_test',
  event: 'e',
  distinct_id: 'd',
  properties: {},
  timestamp: '2020-01-01T00:00:00.000Z',
}

describe('sendCapture', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls custom transport with url and body', async () => {
    const transport = vi.fn()
    await sendCapture('https://us.i.posthog.com/i/v0/e/', body, transport)
    expect(transport).toHaveBeenCalledWith(
      'https://us.i.posthog.com/i/v0/e/',
      body
    )
  })

  it('uses fetch for fetch preset', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await sendCapture('https://us.i.posthog.com/i/v0/e/', body, 'fetch')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(body))
  })
})
