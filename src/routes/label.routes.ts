import Router from '@koa/router'
import LabelController from '../controllers/LabelController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.post('/labels', jwt, LabelController.store)

export default router
