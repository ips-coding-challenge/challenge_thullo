import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { knex } from '../tests/setup'
import { can, response, userSelect, validationError } from '../utils/utils'

const createTaskSchema = Joi.object().keys({
  title: Joi.string().min(2).required(),
  position: Joi.number().required(),
  board_id: Joi.number().required(),
  list_id: Joi.number().required(),
})

const patchTaskSchema = Joi.object().keys({
  board_id: Joi.number().required(),
  title: Joi.string().min(2).optional(),
  description: Joi.string().min(2).optional(),
  cover: Joi.string().uri().optional(),
})

interface TaskCreateInput {
  title: string
  position: number
  board_id: number
  list_id: number
}

class TaskController {
  /**
   * Fetch all tasks for a list
   * Only use the ListController to fetch the tasks?
   * @param {Context} ctx
   */
  static async index(ctx: Context) {}

  static async show(ctx: Context) {
    const { id } = ctx.params

    try {
      const [task] = await knex('tasks').where('id', +id)

      if (!task) {
        return response(ctx, 404, 'Task not found')
      }

      if (await can(ctx, task.board_id)) {
        // Fetch the assignedMembers
        const assignedMembers = await knex('assignment_task')
          .innerJoin('users', 'users.id', '=', 'assignment_task.user_id')
          .where('task_id', task.id)
          .select([
            'assignment_task.id as assignment_id',
            'assignment_task.task_id as task_id',
            ...userSelect(),
          ])

        // Fetch the labels
        const labels = await knex('label_task')
          .innerJoin('labels', 'labels.id', '=', 'label_task.label_id')
          .where('task_id', task.id)
          .orderBy('label_task.id', 'asc')
          .select('*')

        const attachments = await knex('attachment_task')
          .where('task_id', task.id)
          .orderBy('created_at', 'asc')
          .select('*')

        const comments = await knex('comments')
          .innerJoin('users', 'users.id', '=', 'comments.user_id')
          .where('task_id', task.id)
          .orderBy('created_at', 'asc')
          .select('comments.*', 'users.username', 'users.avatar')

        response(ctx, 200, {
          data: {
            ...task,
            assignedMembers: assignedMembers || [],
            labels: labels || [],
            attachments: attachments || [],
            comments: comments || [],
          },
        })
      } else {
        response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('e', e)
    }
  }

  /**
   * Insert a task
   * @param {Context} ctx
   */
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
          data: { ...task, assignedMembers: [], labels: [] },
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

  /**
   * Update a task
   * @param {Context} ctx
   */
  static async update(ctx: Context) {
    try {
      await createTaskSchema.validateAsync(ctx.request.body)

      const data = <TaskCreateInput>ctx.request.body

      if (await can(ctx, data.board_id)) {
        const [task] = await knex('tasks')
          .where({ id: ctx.params.id })
          .update(
            {
              ...data,
            },
            ['*']
          )

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

  /**
   * Update some field in a task (title, description, cover)
   * @param ctx
   */
  static async patch(ctx: Context) {
    try {
      await patchTaskSchema.validateAsync(ctx.request.body)

      const data = <TaskCreateInput>ctx.request.body

      if (await can(ctx, data.board_id)) {
        delete data.board_id

        const [task] = await knex('tasks')
          .where({ id: ctx.params.id })
          .update(
            {
              ...data,
            },
            ['*']
          )

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
}

export default TaskController
