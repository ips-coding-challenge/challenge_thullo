import Joi from '@hapi/joi'
import knex from '../db/connection'
import { Context } from 'koa'
import { response, userSelect, validationError } from '../utils/utils'

const updateSchema = Joi.object().keys({
  avatar: Joi.string().uri().required(),
})

class UserController {
  /** */

  static async update(ctx: Context) {
    try {
      await updateSchema.validateAsync(ctx.request.body)

      const { avatar } = <any>ctx.request.body

      const [user] = await knex('users').where('id', ctx.state.user.id)

      if (!user) {
        return response(ctx, 404, 'User not found')
      }

      const [updatedUser] = await knex('users')
        .update({
          avatar,
        })
        .where('id', ctx.state.user.id)
        .returning(userSelect())

      response(ctx, 201, {
        data: updatedUser,
      })
    } catch (e) {
      if (e instanceof Joi.ValidationError) {
        ctx.throw(422, validationError(e))
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }
}

export default UserController
