import { describe, expect, it } from 'vitest'

import {
  applyBotsMode,
  enrichBotFlags,
  getBotName,
  isBotFromProperties,
} from './bots.js'

describe('bots', () => {
  const googlebotUa = 'Googlebot/2.1 (+http://www.google.com/bot.html)'

  it('detects bot names from UA', () => {
    expect(getBotName(googlebotUa)).toBeDefined()
    expect(getBotName('Mozilla/5.0 Chrome')).toBeUndefined()
  })

  it('isBotFromProperties uses is_bot or $raw_user_agent', () => {
    expect(isBotFromProperties({ is_bot: true })).toBe(true)
    expect(isBotFromProperties({ $raw_user_agent: googlebotUa })).toBe(true)
    expect(
      isBotFromProperties({
        $raw_user_agent:
          'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0 Safari/537.36',
      })
    ).toBe(false)
  })

  it('enrichBotFlags only adds props for bots', () => {
    expect(enrichBotFlags({ $raw_user_agent: googlebotUa })).toMatchObject({
      is_bot: true,
      bot_name: expect.any(String),
    })
    expect(
      enrichBotFlags({
        $raw_user_agent:
          'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0 Safari/537.36',
      })
    ).not.toHaveProperty('is_bot')
  })

  it('applyBotsMode drop skips bot traffic', () => {
    const body = {
      api_key: 'k',
      event: 'e',
      distinct_id: 'd',
      properties: { $raw_user_agent: googlebotUa },
      timestamp: '2020-01-01T00:00:00.000Z',
    }
    expect(applyBotsMode(body, 'drop')).toBeNull()
    expect(applyBotsMode(body, 'flag')?.properties.is_bot).toBe(true)
  })
})
