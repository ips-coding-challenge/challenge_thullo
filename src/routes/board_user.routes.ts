import Router from '@koa/router'
import BoardUserController from '../controllers/BoardUserController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.post('/members', jwt, BoardUserController.store)
router.delete('/members', jwt, BoardUserController.delete)

export default router
