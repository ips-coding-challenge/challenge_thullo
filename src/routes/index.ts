import Router from '@koa/router'
import authRoutes from './auth.routes'
import boardRoutes from './board.routes'

const router = new Router({
  prefix: '/api',
})

router.use(authRoutes.routes())
router.use(boardRoutes.routes())

export default router
