import Joi, { ValidationError } from '@hapi/joi'
import { Context } from 'koa'
import { knex } from '../tests/setup'
import { can, response, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  task_id: Joi.number().required(),
  label_id: Joi.number().required(),
})

class LabelTaskController {
  /**
   * Add a label to a task
   * @param ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { task_id, label_id } = ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (task) {
        if (await can(ctx, task.board_id)) {
          const [label] = await knex('labels').where('id', label_id)

          if (!label) {
            return response(ctx, 404, 'Label not found')
          }

          await knex('label_task').insert({
            task_id,
            label_id,
          })

          response(ctx, 201, {})
        } else {
          return response(ctx, 403, 'Not allowed')
        }
      } else {
        return response(ctx, 404, 'Task not found')
      }
    } catch (e) {
      console.log('Add a label to a task error', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `This label is already assigned to that task`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  static async delete(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { task_id, label_id } = ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      if (await can(ctx, task.board_id)) {
        await knex('label_task').where({ task_id, label_id }).delete()

        response(ctx, 204, {})
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('delete label from a task error', e)
    }
  }
}

export default LabelTaskController
