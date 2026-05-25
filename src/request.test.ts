import { describe, expect, it } from 'vitest'

import { getRequestProperties } from './request.js'

describe('getRequestProperties', () => {
  it('parses referrer and user-agent headers', () => {
    const request = new Request('https://example.com/page', {
      headers: {
        referer: 'https://www.google.com/search?q=flame',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
      },
    })

    const props = getRequestProperties(request)

    expect(props.$current_url).toBe('https://example.com/page')
    expect(props.$host).toBe('example.com')
    expect(props.$pathname).toBe('/page')
    expect(props.$search).toBeUndefined()
    expect(props.$referrer).toBe('https://www.google.com/search?q=flame')
    expect(props.$referring_domain).toBe('www.google.com')
    expect(props.$search_engine).toBe('google')
    expect(props.$browser_language).toBe('en-US')
    expect(props.$browser_language_prefix).toBe('en')
    expect(props.$raw_user_agent).toContain('Chrome')
    expect(props).not.toHaveProperty('is_bot')
  })

  it('includes query string in $search', () => {
    const request = new Request('https://example.com/items?sort=asc')

    const props = getRequestProperties(request)

    expect(props.$current_url).toBe('https://example.com/items?sort=asc')
    expect(props.$pathname).toBe('/items')
    expect(props.$search).toBe('?sort=asc')
  })

  it('includes $raw_user_agent for bot UAs', () => {
    const request = new Request('https://example.com/', {
      headers: {
        'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    })

    const props = getRequestProperties(request)
    expect(props.$raw_user_agent).toContain('Googlebot')
    expect(props).not.toHaveProperty('is_bot')
  })
})
