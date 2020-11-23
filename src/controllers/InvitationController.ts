import knex from '../db/connection'
import { Context } from 'koa'
import Joi, { ValidationError } from '@hapi/joi'
import { isAdmin, response, validationError } from '../utils/utils'
import { nanoid } from 'nanoid'

const createSchema = Joi.object().keys({
  board_id: Joi.number().required(),
  username: Joi.string().required(),
})

class InvitationController {
  /**
   * Fetch the invitations for the connected user
   * @param ctx
   */
  static async index(ctx: Context) {
    try {
      const invitations = await knex('invitations')
        .innerJoin('boards', 'boards.id', '=', 'invitations.board_id')
        .innerJoin('users', 'users.id', '=', 'boards.user_id')
        .where({
          'invitations.user_id': ctx.state.user.id,
        })
        .andWhere(
          'invitations.created_at',
          '>',
          new Date(Date.now() - 60000 * 60 * 24).toISOString()
        )
        .select(
          'invitations.id',
          'invitations.token',
          'invitations.board_id',
          'invitations.user_id',
          'users.username as owner_name',
          'boards.cover as board_cover',
          'boards.name as board_name'
        )

      response(ctx, 200, {
        data: invitations,
      })
    } catch (e) {
      console.log('e', e)
    }
  }

  /**
   * Send an invitation
   * @param ctx
   */
  static async store(ctx: Context) {
    try {
      await createSchema.validateAsync(ctx.request.body)

      const { board_id, username } = ctx.request.body

      if (!(await isAdmin(ctx, board_id))) {
        return response(ctx, 403, 'Only an administrator can invite new member')
      }

      const [board] = await knex('boards').where('id', +board_id)
      if (!board) {
        return response(ctx, 404, 'Board not found')
      }

      const [userToInvite] = await knex('users').where('username', username)

      if (!userToInvite) {
        return response(ctx, 404, 'User not found')
      }

      if (userToInvite.id === ctx.state.user.id) {
        return response(ctx, 400, 'You cannot invite yourself')
      }

      // Check if the user is already a board member
      const [member] = await knex('board_user').where({
        board_id: board_id,
        user_id: userToInvite.id,
      })

      if (member) {
        return response(ctx, 400, 'This user is already a member')
      }

      // Check if an invitation already exists and if it has expired
      const [invitation] = await knex('invitations').where({
        board_id: board_id,
        user_id: userToInvite.id,
      })

      if (invitation) {
        console.log('isExpired', isExpired(invitation.created_at))
        if (isExpired(invitation.created_at)) {
          await knex('invitations').where('id', invitation.id).delete()
        } else {
          return response(ctx, 400, 'Invitation already sent')
        }
      }

      await knex('invitations').insert({
        user_id: userToInvite.id,
        board_id: board_id,
        token: nanoid(),
      })

      response(ctx, 204, {})
    } catch (e) {
      console.log('store invitation', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        ctx.throw(422, {
          message: `You already have a list with this name`,
        })
      } else {
        ctx.throw(400, 'Bad request')
      }
    }
  }

  /**
   * Valid the invitation
   * @param ctx
   */
  static async validToken(ctx: Context) {
    const { token } = ctx.params
    try {
      const [invitation] = await knex('invitations').where({
        token,
        user_id: ctx.state.user.id,
      })

      if (!invitation) {
        return response(ctx, 404, 'No invitation found')
      }

      if (isExpired(invitation.created_at)) {
        return response(ctx, 400, 'The invitation has expired')
      }

      await knex('board_user').insert({
        board_id: invitation.board_id,
        user_id: ctx.state.user.id,
      })

      await knex('invitations').where('id', invitation.id).delete()

      response(ctx, 200, {})
    } catch (e) {
      console.log('e', e)
      response(ctx, 400, 'Bad request')
    }
  }
}

const isExpired = (created_at) => {
  console.log('created_at', created_at)
  if (new Date(created_at).getTime() + 60000 * 60 * 24 < Date.now()) {
    return true
  }
  return false
}

export default InvitationController
