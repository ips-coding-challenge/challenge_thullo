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
    .returning(['id', 'username', 'email', 'password'])

  return user
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
