import * as path from 'path'
import Koa, { BaseContext, Next } from 'koa'
import cors from '@koa/cors'
import morgan from 'koa-morgan'
import * as dotenv from 'dotenv'
import bodyparser from 'koa-bodyparser'
import router from './routes'
import { RouterContext } from '@koa/router'

dotenv.config({
  path: path.join(
    __dirname,
    `../.env.${process.env.NODE_ENV || 'development'}`
  ),
})

const PORT = process.env.PORT || 3000

const app = new Koa()
app.use(async (ctx: BaseContext & RouterContext, next: Next) => {
  try {
    await next()
  } catch (err) {
    console.log('In here too')
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})
// General handling Error
app.on('error', (err, ctx) => {
  // console.log('General Log', err)
})

app.use(morgan('combined'))
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
)
app.use(bodyparser())

app.use(router.routes())
app.use(router.allowedMethods())

const server = app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})

export default server
