import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { response, validationError } from '../utils/utils'
import { knex } from '../tests/setup'

const createSchema = Joi.object().keys({
  board_id: Joi.number().required(),
  role: Joi.string().valid('user', 'admin').optional(),
})

enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

interface BoardUserInput {
  board_id: number
  role: Role
}

class BoardUserController {
  /**
   * Add a new member to a board
   * @param {Context} ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const data = <BoardUserInput>ctx.request.body

      const [board] = await knex('boards').where({ id: data.board_id })

      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      if (board.user_id === ctx.state.user.id) {
        return response(ctx, 400, `This user is the board's owner`)
      }

      await knex('board_user').insert({
        board_id: board.id,
        user_id: ctx.state.user.id,
        role: data.role,
      })

      // send user added as response?

      response(ctx, 201, {
        data: ctx.state.user,
      })
    } catch (e) {
      console.log('E', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, 'This user is already a member of the board')
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }
}

export default BoardUserController
