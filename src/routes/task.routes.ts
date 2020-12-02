import Router from '@koa/router'
import TaskController from '../controllers/TaskController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.get('/tasks/:id', jwt, TaskController.show)
router.post('/tasks', jwt, TaskController.store)
router.put('/tasks/:id', jwt, TaskController.update)
router.patch('/tasks/:id', jwt, TaskController.patch)
router.delete('/tasks', jwt, TaskController.delete)

export default router
