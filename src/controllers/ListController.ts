import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import knex from '../db/connection'
import { can, response, userSelect, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  name: Joi.string().min(2).required(),
  board_id: Joi.number().required(),
})

interface ListInput {
  name: string
  board_id: number
}

class ListController {
  /**
   * Fetch all the lists from a board
   * @param {Context} ctx
   */
  static async index(ctx: Context) {
    try {
      const { board_id } = ctx.request.query

      if (!board_id) {
        return response(ctx, 400, 'board_id is missing')
      }

      if (await can(ctx, board_id)) {
        const lists = await knex('lists')
          .where({
            board_id: +board_id,
          })
          .orderBy('id')

        // Fetch the tasks belongings to those lists
        const listIds = lists.map((l) => l.id)
        const tasks = await knex('tasks')
          .whereIn('list_id', listIds)
          .orderBy('position')

        const tasksIds = tasks.map((t) => t.id)
        // Get the members assigned to that task
        const assignedMembersToTask = await knex('assignment_task')
          .innerJoin('users', 'users.id', '=', 'assignment_task.user_id')
          .whereIn('assignment_task.task_id', tasksIds)
          .select([
            'assignment_task.id as assignment_id',
            'assignment_task.task_id as task_id',
            ...userSelect(),
          ])

        // Get the label assigned to that task
        const labelAssignedToTask = await knex('label_task')
          .innerJoin('labels', 'labels.id', '=', 'label_task.label_id')
          .whereIn('label_task.task_id', tasksIds)
          .orderBy('labels.name', 'asc')
          .select('*')

        // Get the attachments
        const attachmentsTask = await knex('attachment_task')
          .whereIn('attachment_task.task_id', tasksIds)
          .select('*')

        // Get the comments

        const commentsTask = await knex('comments')
          .innerJoin('users', 'users.id', '=', 'comments.user_id')
          .whereIn('task_id', tasksIds)
          .select('comments.*', 'users.username', 'users.avatar')

        lists.forEach((l) => {
          l.tasks = []
          tasks.map((task) => {
            if (task.list_id === l.id) {
              let assignedMembers = []
              let labels = []
              let attachments = []
              let comments = []
              assignedMembersToTask.forEach((m) => {
                if (m.task_id === task.id) {
                  assignedMembers.push(m)
                }
              })
              labelAssignedToTask.forEach((l) => {
                if (l.task_id === task.id) {
                  labels.push(l)
                }
              })
              attachmentsTask.forEach((a) => {
                if (a.task_id === task.id) {
                  attachments.push(a)
                }
              })
              commentsTask.forEach((c) => {
                if (c.task_id === task.id) {
                  comments.push(c)
                }
              })
              l.tasks.push({
                ...task,
                assignedMembers,
                labels,
                attachments,
                comments,
              })
            }
          })
        })

        response(ctx, 200, {
          data: lists,
        })
      } else {
        response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('list index error', e)
    }
  }

  /**
   * Create a list
   * @param {Context} ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const data = <ListInput>ctx.request.body

      const [board] = await knex('boards').where({
        id: data.board_id,
      })

      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      if (await can(ctx, board.id)) {
        const [list] = await knex('lists')
          .insert({
            name: data.name,
            board_id: +data.board_id,
          })
          .returning('*')

        response(ctx, 201, {
          data: { ...list, tasks: [] },
        })
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('Store list error', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `You already have a list with this name`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  static async update(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const data = <ListInput>ctx.request.body

      const [board] = await knex('boards').where({
        id: data.board_id,
      })

      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      if (await can(ctx, board.id)) {
        const { id } = ctx.params
        if (!id) {
          return response(ctx, 400, 'list ID is missing')
        }
        const list = await knex('lists')
          .where({ id })
          .andWhere({ board_id: data.board_id })
          .update({
            name: data.name,
          })
          .returning('*')

        response(ctx, 200, {
          data: list,
        })
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('Store list error', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `You already have a list with this name`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  static async delete(ctx: Context) {
    try {
      const data = <ListInput>ctx.request.body

      const [board] = await knex('boards').where({
        id: data.board_id,
      })

      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      if (await can(ctx, board.id)) {
        const { id } = ctx.params
        if (!id) {
          return response(ctx, 400, 'list ID is missing')
        }
        const list = await knex('lists')
          .where({ id })
          .andWhere({ board_id: data.board_id })
          .delete()

        response(ctx, 204, {})
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('Store list error', e)
      ctx.throw(400, 'Bad request')
    }
  }
}

export default ListController
