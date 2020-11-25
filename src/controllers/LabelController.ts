import Joi, { ValidationError } from '@hapi/joi'
import { Context } from 'koa'
import { knex } from '../tests/setup'
import { can, response, validationError } from '../utils/utils'

const createSchema = Joi.object().keys({
  name: Joi.string().min(2).required(),
  color: Joi.string().pattern(new RegExp('^#([a-zA-Z0-9]{6})$')).required(),
  board_id: Joi.number().required(),
})

class LabelController {
  /**
   * Insert a new label for a board
   * @param ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { name, color, board_id } = ctx.request.body

      if (await can(ctx, board_id)) {
        const [label] = await knex('labels')
          .insert({ name, color, board_id })
          .returning('*')

        response(ctx, 201, {
          data: label,
        })
      } else {
        response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('Label store error', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          field: 'name',
          message: `You should have only one label with the same color and name for this board`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }
}

export default LabelController
