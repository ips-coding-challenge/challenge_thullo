import Router from '@koa/router'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import boardRoutes from './board.routes'
import listRoutes from './list.routes'
import boardUserRoutes from './board_user.routes'
import taskRoutes from './task.routes'
import invitationRoutes from './invitation.routes'
import assignmentRoutes from './assignment.routes'
import labelRoutes from './label.routes'
import labelTaskRoutes from './label_task.routes'
import attachmentRoutes from './attachment.routes'
import commentRoutes from './comment.routes'

const router = new Router({
  prefix: '/api',
})

router.use(authRoutes.routes())
router.use(userRoutes.routes())
router.use(boardRoutes.routes())
router.use(listRoutes.routes())
router.use(boardUserRoutes.routes())
router.use(taskRoutes.routes())
router.use(invitationRoutes.routes())
router.use(assignmentRoutes.routes())
router.use(labelRoutes.routes())
router.use(labelTaskRoutes.routes())
router.use(attachmentRoutes.routes())
router.use(commentRoutes.routes())

export default router
