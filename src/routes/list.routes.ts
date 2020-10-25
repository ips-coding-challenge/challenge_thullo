import Router from '@koa/router'
import ListController from '../controllers/ListController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.get('/lists', jwt, ListController.index)
router.post('/lists', jwt, ListController.store)
router.put('/lists/:id', jwt, ListController.update)

export default router
