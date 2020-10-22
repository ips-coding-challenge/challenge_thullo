import Router from '@koa/router'
import AuthController from '../controllers/AuthController'
import jwt from '../middlewares/jwt'

const router = new Router()

router.post('/login', AuthController.login)
router.post('/register', AuthController.register)
router.post('/logout', AuthController.logout)
router.get('/me', jwt, AuthController.me)

export default router
