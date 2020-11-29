import Router from '@koa/router'
import CommentController from '../controllers/CommentController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.post('/comments', jwt, CommentController.store)
router.put('/comments/:id', jwt, CommentController.update)
router.delete('/comments', jwt, CommentController.delete)

export default router
