import { ValidationError } from '@hapi/joi'
import knex from '../db/connection'
import { Context } from 'koa'
import jwt from 'jsonwebtoken'

export const response = (ctx: Context, status = 200, data) => {
  ctx.status = status
  ctx.body = data
}

export const generateToken = (user) => {
  if ('password' in user) {
    delete user.password
  }
  const token = jwt.sign(
    {
      data: user,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  )
  return token
}

export const can = async (ctx: Context, boardId: number) => {
  const [isOwner] = await knex('boards')
    .where({ id: boardId })
    .andWhere({ user_id: ctx.state.user.id })

  const [isMember] = await knex('board_user')
    .where({ board_id: boardId })
    .andWhere({
      user_id: ctx.state.user.id,
    })

  return isOwner || isMember
}

export const isAdmin = async (ctx: Context, boardId: number) => {
  const [isOwner] = await knex('boards').where({
    id: boardId,
    user_id: ctx.state.user.id,
  })

  const [isMember] = await knex('board_user').where({
    board_id: boardId,
    user_id: ctx.state.user.id,
    role: 'admin',
  })

  return isOwner || isMember
}

export const validationError = (e: ValidationError) => {
  return {
    field: e.details[0].path[0],
    message: e.details[0].message,
  }
}
