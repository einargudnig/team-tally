import { defineMiddleware } from 'astro:middleware'
import { logToHub } from './lib/hub-log'

export const onRequest = defineMiddleware(async (ctx, next) => {
  try {
    const res = await next()
    if (res.status >= 500) {
      await logToHub({ level: 'error', event: 'request.5xx', fields: { path: ctx.url.pathname, status: res.status } })
    }
    return res
  } catch (err) {
    await logToHub({ level: 'error', event: 'server.error', fields: { path: ctx.url.pathname, message: err instanceof Error ? err.message : String(err) } })
    throw err
  }
})
