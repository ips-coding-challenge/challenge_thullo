import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { knex } from '../tests/setup'
import { response, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  name: Joi.string().min(2).required(),
  visibility: Joi.string().valid('private', 'public').required(),
  cover: Joi.string().uri().optional(),
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
  static async index(ctx: Context) {
    try {
      // Fetch all the boardsIDs where the user is a member
      const boardsId = await knex('board_user').pluck('board_id').where({
        user_id: ctx.state.user.id,
      })

      //Fetch all the boards
      const boards = await knex('boards')
        .where({
          'boards.user_id': ctx.state.user.id,
        })
        .orWhereIn('boards.id', boardsId)
        .select('boards.*')

      const members = await knex('board_user')
        .innerJoin('users', 'users.id', '=', 'board_user.user_id')
        .whereIn(
          'board_id',
          boards.map((b) => b.id)
        )
        .select('users.id', 'username', 'avatar', 'board_user.board_id')
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
   *
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
        data: board,
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
}

export default BoardController
