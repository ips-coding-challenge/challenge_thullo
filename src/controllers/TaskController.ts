import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { knex } from '../tests/setup'
import { can, response, validationError } from '../utils/utils'

const createTaskSchema = Joi.object().keys({
  title: Joi.string().min(2).required(),
  position: Joi.number().required(),
  board_id: Joi.number().required(),
  list_id: Joi.number().required(),
})

interface TaskCreateInput {
  title: string
  position: number
  board_id: number
  list_id: number
}

class TaskController {
  static async index(ctx: Context) {}
  static async store(ctx: Context) {
    try {
      await createTaskSchema.validateAsync(ctx.request.body)

      const data = <TaskCreateInput>ctx.request.body

      if (await can(ctx, data.board_id)) {
        const [task] = await knex('tasks')
          .insert({
            ...data,
            user_id: ctx.state.user.id,
          })
          .returning('*')

        response(ctx, 201, {
          data: task,
        })
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('Store task error', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      }

      ctx.throw(400, `Bad request`)
    }
  }

  static async update(ctx: Context) {}
}

export default TaskController
