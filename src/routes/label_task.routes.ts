import Router from '@koa/router'
import LabelTaskController from '../controllers/LabelTaskController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.post('/tasks/:id/labels', jwt, LabelTaskController.store)
router.delete('/tasks/:id/labels', jwt, LabelTaskController.delete)

export default router
