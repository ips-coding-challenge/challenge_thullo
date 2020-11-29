import Joi, { ValidationError } from '@hapi/joi'
import { Context } from 'koa'
import { knex } from '../tests/setup'
import { can, isAdmin, response, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  content: Joi.string().min(2).required(),
  task_id: Joi.number().required(),
})

const deleteSchema = Joi.object().keys({
  comment_id: Joi.number().required(),
  task_id: Joi.number().required(),
})

class CommentController {
  /**
   * Create a comment for a task
   * @param ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { content, task_id } = ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      if (await can(ctx, task.board_id)) {
        const [comment] = await knex('comments')
          .insert({
            content,
            user_id: ctx.state.user.id,
            task_id: task.id,
          })
          .returning('*')

        response(ctx, 201, {
          data: comment,
        })
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  static async update(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { content, task_id } = ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      if (await can(ctx, task.board_id)) {
        const commentId = ctx.params.id
        const [comment] = await knex('comments').where('id', commentId)
        if (
          (await isAdmin(ctx, task.board_id)) ||
          comment.user_id === ctx.state.user.id
        ) {
          const [updatedComment] = await knex('comments')
            .update({
              content,
            })
            .where('id', commentId)
            .returning('*')

          response(ctx, 200, {
            data: updatedComment,
          })
        }
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('e', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  static async delete(ctx: Context) {
    try {
      await deleteSchema.validateAsync(ctx.request.body)

      const { comment_id, task_id } = ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      if (await can(ctx, task.board_id)) {
        const [comment] = await knex('comments').where('id', comment_id)
        if (
          (await isAdmin(ctx, task.board_id)) ||
          comment.user_id === ctx.state.user.id
        ) {
          await knex('comments').where('id', comment_id).delete()

          response(ctx, 204, {})
        }
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('e', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }
}

export default CommentController
