import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { knex } from '../tests/setup'
import { can, response, validationError } from '../utils/utils'

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
        const tasks = await knex('tasks').whereIn('list_id', listIds)

        lists.forEach((l) => {
          l.tasks = []
          tasks.map((task) => {
            if (task.list_id === l.id) {
              l.tasks.push(task)
            }
          })
        })

        console.log('lists', lists)

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
