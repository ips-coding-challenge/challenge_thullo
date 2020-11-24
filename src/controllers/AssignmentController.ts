import Joi, { ValidationError } from '@hapi/joi'
import { Context } from 'koa'
import knex from '../db/connection'
import { can, response, userSelect, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  task_id: Joi.number().required(),
  user_id: Joi.number().required(),
})

class AssignmentController {
  /**
   * Assign the board's member to the task
   * @param ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { task_id, user_id } = ctx.request.body

      const [task] = await knex('tasks').where('id', task_id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      const [board] = await knex('boards').where('id', task.board_id)
      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      if (await can(ctx, board.id)) {
        await knex('assignment_task').insert({
          task_id,
          user_id,
        })

        const userAssigned = await knex('users')
          .innerJoin(
            'assignment_task',
            'assignment_task.user_id',
            '=',
            'users.id'
          )
          .where('users.id', user_id)
          .select(['assignment_task.id as assignment_id', ...userSelect()])

        response(ctx, 201, {
          data: userAssigned,
        })
      } else {
        response(ctx, 403, 'Not Allowed')
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          message: `This member is already assigned to that task`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }
}

export default AssignmentController
