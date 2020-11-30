import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { isAdmin, response, validationError } from '../utils/utils'
import { knex } from '../tests/setup'

const createSchema = Joi.object().keys({
  board_id: Joi.number().required(),
  role: Joi.string().valid('user', 'admin').optional(),
})

const deleteSchema = Joi.object().keys({
  board_id: Joi.number().required(),
  user_id: Joi.number().required(),
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

  /**
   * Delete a member from the board
   * @param ctx
   */
  static async delete(ctx: Context) {
    try {
      await deleteSchema.validateAsync(ctx.request.body)

      const { board_id, user_id } = ctx.request.body

      const [member] = await knex('board_user').where({ board_id, user_id })

      if (!member) {
        return response(ctx, 404, 'Not found')
      }

      if ((await isAdmin(ctx, board_id)) && ctx.state.user.id !== user_id) {
        await knex('board_user').where({ board_id, user_id }).delete()
        // Make sure we remove all the invitations from this user for this board
        await knex('invitations').where({ board_id, user_id }).delete()

        response(ctx, 204, {})
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('delete member error', e)
      ctx.throw(400, 'Bad request')
    }
  }
}

export default BoardUserController
