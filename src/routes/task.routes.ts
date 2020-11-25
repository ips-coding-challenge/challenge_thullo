import Router from '@koa/router'
import TaskController from '../controllers/TaskController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.get('/tasks', jwt, TaskController.index)
router.get('/tasks/:id', jwt, TaskController.show)
router.post('/tasks', jwt, TaskController.store)
router.put('/tasks/:id', jwt, TaskController.update)

export default router
