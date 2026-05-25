# posthog-zero

Unofficial minimal PostHog **event capture** for edge and embedded runtimes.

Built for:

- **Cloudflare Workers** - `fetch`, use with `ctx.waitUntil()`
- **Browser / Tauri webview** - `sendBeacon` when available, else `fetch`

## Install

```bash
npm i posthog-zero
```

## Usage

```ts
import { posthogZero } from 'posthog-zero'

const posthog = posthogZero({
  apiKey: process.env.POSTHOG_KEY!,
  host: 'https://us.i.posthog.com',
  defaults: { $lib: 'posthog-zero-example' },
})

await posthog.capture({
  event: 'button_clicked',
  distinctId: anonId,
  properties: { button: 'signup' },
})
```

### Cloudflare Workers

```ts
import { posthogZero } from 'posthog-zero'
import { getRequestProperties } from 'posthog-zero/request'

const posthog = posthogZero({
  apiKey: env.POSTHOG_KEY,
  host: env.POSTHOG_HOST,
  bots: 'drop', // or 'flag'
})

ctx.waitUntil(
  posthog.capture({
    event: '$pageview',
    distinctId: anonId,
    properties: getRequestProperties(request),
  })
)
```

Custom transport (tests, logging, or your own fetch/beacon):

```ts
posthogZero({
  apiKey: process.env.POSTHOG_KEY!,
  transport: (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }),
})
```

## Options

| Option      | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `apiKey`    | Project API key (`phc_...`)                                                    |
| `host`      | Ingest host (default US)                                                       |
| `defaults`  | Properties merged on every event                                               |
| `disabled`  | No network, `capture` still resolves                                           |
| `debug`     | Log payloads                                                                   |
| `transport` | `'auto'` \| `'beacon'` \| `'fetch'`, or `(url, body) => void \| Promise<void>` |
| `bots`      | `'drop'` \| `'flag'`                                                           |

`transport` as a function receives the wire `CaptureBody` (POST JSON to `url` yourself). Built-in `'auto'` uses `sendBeacon` when available, else `fetch`.

With `bots: 'flag'`, only bot traffic gets `is_bot: true` and `bot_name` (the matched blocklist substring). Human events are unchanged. Detection uses the same UA list as `@posthog/core` (browser SDK bot blocking).
