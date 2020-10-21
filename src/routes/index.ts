import Router from '@koa/router'
import authRoutes from './auth.routes'

const router = new Router({
  prefix: '/api',
})

router.use(authRoutes.routes())

export default router
