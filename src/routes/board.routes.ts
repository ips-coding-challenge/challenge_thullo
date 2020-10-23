import Router from '@koa/router'
import BoardController from '../controllers/BoardController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.get('/boards', jwt, BoardController.index)
router.post('/boards', jwt, BoardController.store)

export default router
