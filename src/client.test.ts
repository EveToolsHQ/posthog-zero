import { afterEach, describe, expect, it, vi } from 'vitest'

import { posthogZero } from './client.js'
import type { CaptureBody } from './types.js'

describe('posthogZero', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('POSTs capture body via fetch preset', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const posthog = posthogZero({
      apiKey: 'phc_test',
      host: 'https://us.i.posthog.com',
      defaults: { $lib: 'test' },
      transport: 'fetch',
    })

    await posthog.capture({
      event: 'button_clicked',
      distinctId: 'anon-1',
      properties: { button: 'signup' },
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://us.i.posthog.com/i/v0/e/')
    expect(init?.method).toBe('POST')
    const sent = JSON.parse(init?.body as string)
    expect(sent.distinct_id).toBe('anon-1')
    expect(sent.event).toBe('button_clicked')
    expect(sent.properties).toMatchObject({
      $lib: 'test',
      button: 'signup',
    })
  })

  it('does not send when disabled', async () => {
    const transport = vi.fn()

    const posthog = posthogZero({
      apiKey: 'phc_test',
      disabled: true,
      transport,
    })

    await posthog.capture({ event: 'e', distinctId: 'd' })
    expect(transport).not.toHaveBeenCalled()
  })

  it('logs when debug without sending if disabled', async () => {
    const transport = vi.fn()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    const posthog = posthogZero({
      apiKey: 'phc_secret',
      disabled: true,
      debug: true,
      transport,
    })

    await posthog.capture({ event: 'e', distinctId: 'd' })

    expect(transport).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalled()
    const logged = info.mock.calls[0]?.[1] as {
      distinct_id?: string
      api_key?: string
    }
    expect(logged.distinct_id).toBe('d')
    expect(logged.api_key).toBeUndefined()
  })

  it('swallows transport errors', async () => {
    const posthog = posthogZero({
      apiKey: 'phc_test',
      transport: () => Promise.reject(new Error('network')),
    })

    await expect(
      posthog.capture({ event: 'e', distinctId: 'd' })
    ).resolves.toBeUndefined()
  })

  it('custom transport receives wire payload', async () => {
    const calls: { url: string; body: CaptureBody }[] = []
    const posthog = posthogZero({
      apiKey: 'phc_test',
      transport: (url, body) => {
        calls.push({ url, body })
      },
    })

    await posthog.capture({ event: 'wrapped', distinctId: 'd' })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('https://us.i.posthog.com/i/v0/e/')
    expect(calls[0]?.body.event).toBe('wrapped')
    expect(calls[0]?.body.distinct_id).toBe('d')
    expect(calls[0]?.body.api_key).toBe('phc_test')
  })

  it('drops bot captures when bots is drop', async () => {
    const transport = vi.fn()
    const posthog = posthogZero({
      apiKey: 'phc_test',
      bots: 'drop',
      transport,
    })

    await posthog.capture({
      event: '$pageview',
      distinctId: 'd',
      properties: {
        $raw_user_agent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    })

    expect(transport).not.toHaveBeenCalled()
  })

  it('flags bot captures when bots is flag', async () => {
    const calls: { body: CaptureBody }[] = []
    const posthog = posthogZero({
      apiKey: 'phc_test',
      bots: 'flag',
      transport: (_url, body) => {
        calls.push({ body })
      },
    })

    await posthog.capture({
      event: '$pageview',
      distinctId: 'd',
      properties: {
        $raw_user_agent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    })

    expect(calls[0]?.body.properties.is_bot).toBe(true)
    expect(calls[0]?.body.properties.bot_name).toBeDefined()
  })

  it('custom transport can log and delegate to fetch', async () => {
    const inner = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', inner)

    const posthog = posthogZero({
      apiKey: 'phc_test',
      transport: async (url, body) => {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      },
    })

    await posthog.capture({ event: 'wrapped', distinctId: 'd' })
    expect(inner).toHaveBeenCalledOnce()
    const sent = JSON.parse(inner.mock.calls[0]?.[1]?.body as string)
    expect(sent.event).toBe('wrapped')
  })
})
