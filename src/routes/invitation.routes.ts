import Router from '@koa/router'
import InvitationController from '../controllers/InvitationController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.get('/invitations', jwt, InvitationController.index)
router.get('/invitations/:token', jwt, InvitationController.validToken)
router.post('/invitations', jwt, InvitationController.store)

export default router
