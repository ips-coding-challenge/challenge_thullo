import Joi from '@hapi/joi'
import { Context } from 'koa'
import knex from '../db/connection'
import { can, isAdmin, response, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  name: Joi.string().min(2).required(),
  url: Joi.string().uri().required(),
  format: Joi.string(),
  public_id: Joi.string().required(),
  task_id: Joi.number().required(),
})

const deleteSchema = Joi.object().keys({
  attachment_id: Joi.number().required(),
  task_id: Joi.number().required(),
})

class AttachmentController {
  /**
   * create an attachment for a task
   * @param ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { name, url, format, public_id, task_id } = <any>ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      if (await can(ctx, task.board_id)) {
        const attachment = await knex('attachment_task')
          .insert({
            name,
            url,
            format,
            public_id,
            task_id,
            user_id: ctx.state.user.id,
          })
          .returning('*')

        response(ctx, 201, {
          data: attachment,
        })
      } else {
        response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('e', e)
      if (e instanceof Joi.ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `You already have a attachment with this name for this task`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  /**
   * Delete an attachment from a task
   * @param ctx
   */
  static async delete(ctx: Context) {
    try {
      await deleteSchema.validateAsync(ctx.request.body)

      const { attachment_id, task_id } = <any>ctx.request.body

      const [attachment] = await knex('attachment_task').where(
        'id',
        attachment_id
      )

      if (!attachment) {
        return response(ctx, 404, 'Attachment not found')
      }

      const [task] = await knex('tasks').where('id', task_id)
      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      const admin = await isAdmin(ctx, task.board_id)

      if (attachment.user_id !== ctx.state.user.id && !admin) {
        return response(ctx, 403, 'Not allowed')
      }

      await knex('attachment_task').where('id', attachment_id).delete()

      response(ctx, 204, {})
    } catch (e) {
      console.log('delete attachment error', e)
    }
  }
}

export default AttachmentController
