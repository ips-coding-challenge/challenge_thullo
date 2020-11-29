import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { knex } from '../tests/setup'
import { can, response, userSelect, validationError } from '../utils/utils'
import { userInfo } from 'os'

const createSchema = Joi.object().keys({
  name: Joi.string().min(2).required(),
  visibility: Joi.string().valid('private', 'public').required(),
  cover: Joi.string().uri().optional(),
})

const updateSchema = Joi.object().keys({
  visibility: Joi.string().valid('private', 'public').optional(),
})

interface BoardInput {
  name: string
  visibility: Visibility
  cover?: string
  description?: string
}

enum Visibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

class BoardController {
  /**
   * Fetch all boards
   * @param {Context} ctx
   */
  static async index(ctx: Context) {
    try {
      // Fetch all the boardsIDs where the user is a member
      const boardsId = await knex('board_user').pluck('board_id').where({
        user_id: ctx.state.user.id,
      })

      //Fetch all the boards
      const boards = await knex('boards')
        .innerJoin('users', 'users.id', '=', 'boards.user_id')
        .where({
          'boards.user_id': ctx.state.user.id,
        })
        .orWhereIn('boards.id', boardsId)
        .orderBy('created_at', 'desc')
        .select('boards.*', 'users.username')

      const members = await knex('board_user')
        .innerJoin('users', 'users.id', '=', 'board_user.user_id')
        .whereIn(
          'board_id',
          boards.map((b) => b.id)
        )
        .select(
          'users.id',
          'username',
          'avatar',
          'email',
          'board_user.board_id'
        )
        .groupBy('board_user.board_id', 'users.id')

      // add members for each board
      boards.forEach((board) => {
        board.members = []
        members.forEach((m) => {
          if (m.board_id === board.id) {
            board.members.push(m)
          }
        })
      })

      response(ctx, 200, {
        data: boards,
      })
    } catch (e) {
      console.log(e)
      ctx.throw(400, 'Bad Request')
    }
  }

  /**
   * Fetch a single board by id
   * @param {Context} ctx
   */
  static async show(ctx: Context) {
    try {
      const { id } = ctx.params
      const [board] = await knex('boards').where('id', id)

      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      if (await can(ctx, id)) {
        const members = await knex('board_user')
          .innerJoin('users', 'users.id', '=', 'board_user.user_id')
          .where({
            board_id: board.id,
          })
          .select([...userSelect(), 'board_user.role'])

        const [owner] = await knex('users')
          .where({
            'users.id': board.user_id,
          })
          .select(userSelect())

        // Add the role admin for the owner of the board
        owner.role = 'admin'

        response(ctx, 200, {
          data: {
            ...board,
            members: members.concat(owner) || [].concat(owner),
          },
        })
      } else {
        response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('Show Board Error', e)
    }
  }
  /**
   * Create a new board
   * @param {Context} ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const data = <BoardInput>ctx.request.body

      const [board] = await knex('boards')
        .insert({
          name: data.name,
          cover: data.cover,
          visibility: data.visibility,
          user_id: ctx.state.user.id,
        })
        .returning('*')

      response(ctx, 201, {
        data: { ...board, members: [] },
      })
    } catch (e) {
      console.log(`E`, e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `You already have a board with this name`,
        })
      } else {
        ctx.throw(400, 'Bad Request')
      }
    }
  }

  static async update(ctx: Context) {
    try {
      await updateSchema.validateAsync(ctx.request.body)

      const boardId = +ctx.params.id

      const data = <BoardInput>ctx.request.body

      if (Object.keys(data).length === 0) {
        return response(ctx, 422, 'Invalid data')
      }

      console.log('data', data)

      if (await can(ctx, boardId)) {
        const [board] = await knex('boards')
          .where('id', boardId)
          .update({
            visibility: data.visibility,
          })
          .returning('*')

        response(ctx, 201, {
          data: { ...board, members: [] },
        })
      } else {
        response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log(`E`, e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `You already have a board with this name`,
        })
      } else {
        ctx.throw(400, 'Bad Request')
      }
    }
  }
}

export default BoardController
