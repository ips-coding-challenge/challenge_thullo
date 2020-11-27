import Router from '@koa/router'
import AssignmentController from '../controllers/AssignmentController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.post('/assignments', jwt, AssignmentController.store)
router.delete('/assignments', jwt, AssignmentController.delete)

export default router
