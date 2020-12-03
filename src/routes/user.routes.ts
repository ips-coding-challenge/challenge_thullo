import Router from '@koa/router'
import UserController from '../controllers/UserController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.put('/users', jwt, UserController.update)

export default router
