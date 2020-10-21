import Router from '@koa/router'
import AuthController from '../controllers/AuthController'

const router = new Router()

router.post('/login', AuthController.login)
router.post('/register', AuthController.register)
router.post('/logout', AuthController.logout)

export default router
