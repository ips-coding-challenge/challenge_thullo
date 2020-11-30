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
        try {
          await knex.transaction(async (trx) => {
            // Make sure we remove all the data from that user in the board
            // Invitations / Assignments / Attachments / Comments
            await trx('board_user').where({ board_id, user_id }).delete()

            await trx('invitations').where({ board_id, user_id }).delete()

            const assignmentsToDelete = await getElementsIdsToDelete(
              trx,
              'assignment_task',
              user_id,
              board_id
            )

            const commentsToDelete = await getElementsIdsToDelete(
              trx,
              'comments',
              user_id,
              board_id
            )
            const attachmentsToDelete = await getElementsIdsToDelete(
              trx,
              'attachment_task',
              user_id,
              board_id
            )
            // console.log('assignmentToDeleteIds', assignmentsToDelete)
            // console.log('commentsToDelete', commentsToDelete)
            // console.log('attachmentsToDelete', attachmentsToDelete)

            await trx('assignment_task')
              .whereIn('id', assignmentsToDelete)
              .delete()

            await trx('attachment_task')
              .whereIn('id', attachmentsToDelete)
              .delete()

            await trx('comments').whereIn('id', commentsToDelete).delete()
          })

          response(ctx, 204, {})
        } catch (e) {
          console.log('Error deleting user from the board', e)
        }
      } else {
        return response(ctx, 403, 'Not allowed')
      }
    } catch (e) {
      console.log('delete member error', e)
      ctx.throw(400, 'Bad request')
    }
  }
}

const getElementsIdsToDelete = async (
  trx,
  table: string,
  user_id: number,
  board_id: number
): Promise<Array<number>> => {
  const elements = await trx(table)
    .innerJoin('tasks', 'tasks.id', '=', `${table}.task_id`)
    .where(`${table}.user_id`, user_id)
    .select(`${table}.id`, 'tasks.board_id as board_id')

  const elementsIds = elements
    .filter((el) => el.board_id === board_id)
    .map((el) => el.id)
  return elementsIds
}

export default BoardUserController
