import Router from '@koa/router'
import AttachmentController from '../controllers/AttachmentController'
import jwt from '../middlewares/jwt'
const router = new Router()

router.post('/attachments', jwt, AttachmentController.store)
router.delete('/attachments', jwt, AttachmentController.delete)

export default router
