import { BaseContext, Context } from 'koa'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import knex from '../db/connection'
import Joi, { ValidationError } from '@hapi/joi'
import { response, validationError } from '../utils/utils'

const loginSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})
const registerSchema = loginSchema.keys({
  username: Joi.string().min(2).required(),
})

interface RegisterInput {
  username: string
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

class AuthController {
  /**
   * Log a user
   * @param {BaseContext} ctx
   */
  static async login(ctx: Context) {
    try {
      await loginSchema.validateAsync(ctx.request.body)

      const data = <LoginInput>ctx.request.body

      const [user] = await knex('users')
        .where({
          email: data.email,
        })
        .select('id', 'username', 'email', 'password')

      if (user) {
        const isValid = await bcrypt.compare(data.password, user.password)
        console.log('isValid', isValid)
        if (isValid) {
          const token = jwt.sign(
            {
              data: user,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // 7 days
          )

          delete user.password

          response(ctx, 200, {
            data: {
              user,
              token,
            },
          })
        } else {
          return response(ctx, 400, 'Invalid credentials')
        }
      } else {
        return response(ctx, 400, 'Invalid credentials')
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else {
        ctx.throw(400, 'Bad Request')
      }
    }
  }

  /**
   * Register a user
   * @param {BaseContext} ctx
   */
  static async register(ctx: Context) {
    try {
      await registerSchema.validateAsync(ctx.request.body)

      const data = <RegisterInput>ctx.request.body

      const hash = bcrypt.hashSync(data.password, 10)
      const [user] = await knex('users')
        .insert({
          username: data.username,
          email: data.email,
          password: hash,
        })
        .returning(['id', 'username', 'email'])

      const token = jwt.sign(
        {
          data: user,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // 7 days
      )

      response(ctx, 201, {
        data: {
          token,
          user,
        },
      })
    } catch (e) {
      console.log('e', e)
      if (e instanceof ValidationError) {
        ctx.throw(422, validationError(e))
      } else if (e.code === '23505') {
        const field = e.detail.includes('username') ? 'username' : 'email'
        ctx.throw(422, {
          field,
          message: `This ${field} is already taken`,
        })
      }
      ctx.throw(400, 'Bad Request')
    }
  }

  static async me(ctx: Context) {
    try {
      const [user] = await knex('users')
        .where({
          id: ctx.state.user.id,
        })
        .select('*')

      delete user.password

      response(ctx, 200, {
        data: user,
      })
    } catch (e) {
      ctx.throw(401, 'Unauthorized')
    }
  }

  /**
   * Log out a user
   * @param {BaseContext} ctx
   */
  static async logout(ctx: BaseContext) {}
}

export default AuthController
