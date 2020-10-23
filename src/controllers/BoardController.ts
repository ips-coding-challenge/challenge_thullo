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
