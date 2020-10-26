import Router from '@koa/router'
import authRoutes from './auth.routes'
import boardRoutes from './board.routes'
import listRoutes from './list.routes'
import boardUserRoutes from './board_user.routes'
import taskRoutes from './task.route'

const router = new Router({
  prefix: '/api',
})

router.use(authRoutes.routes())
router.use(boardRoutes.routes())
router.use(listRoutes.routes())
router.use(boardUserRoutes.routes())
router.use(taskRoutes.routes())

export default router
