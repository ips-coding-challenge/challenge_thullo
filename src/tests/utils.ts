import knex from '../db/connection'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const createUser = async (
  username = 'admin',
  email = 'admin@test.fr',
  password = 'password'
) => {
  const hash = bcrypt.hashSync(password, 10)
  const [user] = await knex('users')
    .insert({
      username,
      email,
      password: hash,
    })
    .returning(['id', 'username', 'email', 'avatar'])

  return user
}

export const createBoard = async (
  user,
  name,
  visibility = 'private',
  cover = 'http://image.com',
  description = null
) => {
  const [board] = await knex('boards')
    .insert({
      name,
      visibility,
      cover,
      user_id: user.id,
      description,
    })
    .returning('*')
  return board
}

export const createMember = async (user, board, role = 'user') => {
  return await knex('board_user').insert({
    board_id: board.id,
    user_id: user.id,
    role,
  })
}

export const createList = async (name, board) => {
  const [list] = await knex('lists')
    .insert({
      name,
      board_id: board.id,
    })
    .returning('*')
  return list
}

export const createTask = async (
  title,
  user,
  board,
  list,
  position = 65565
) => {
  const [task] = await knex('tasks')
    .insert({
      title,
      user_id: user.id,
      board_id: board.id,
      list_id: list.id,
      position,
    })
    .returning('*')

  return task
}

export const generateJwt = async (user) => {
  return jwt.sign(
    {
      data: user,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  ) // 7 d)
}
