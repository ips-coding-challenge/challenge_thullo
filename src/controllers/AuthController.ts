import { BaseContext, Context } from 'koa'
import bcrypt from 'bcryptjs'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import knex from '../db/connection'
import Joi, { valid, ValidationError } from '@hapi/joi'
import { generateToken, response, validationError } from '../utils/utils'

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
        .select('id', 'username', 'email', 'password', 'avatar')

      if (user) {
        const isValid = await bcrypt.compare(data.password, user.password)
        if (isValid) {
          delete user.password

          const token = generateToken(user)

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
        .returning(['id', 'username', 'email', 'avatar'])

      const token = generateToken(user)

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

  static async github(ctx: Context) {
    const { code } = ctx.query

    // Make a post request to get the user's infos
    // https://github.com/login/oauth/access_token
    try {
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      )
      // console.log('Res from oauth', tokenResponse.data)
      const { access_token } = tokenResponse.data

      // Get the user's informations
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })

      const emails = await axios.get(
        'https://api.github.com/user/emails?scope=user:email',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${access_token}`,
          },
        }
      )

      // Filter through all user emails and get the verified + primary
      const validEmail = emails.data.filter((email: any) => {
        return email.primary === true && email.verified === true
      })

      if (!validEmail) {
        return ctx.throw(400, 'You need a valid email in order to register')
      }

      const { id, login, avatar_url } = response.data

      const [githubUser] = await knex('users').where('github_id', id)
      let token
      if (!githubUser) {
        const [newUser] = await knex('users')
          .insert({
            github_id: id,
            avatar: avatar_url,
            username: login,
            email: validEmail[0].email,
          })
          .returning('*')
        token = generateToken(newUser)
      } else {
        token = generateToken(githubUser)
      }

      ctx.redirect(`${process.env.FRONTEND_URL}?access_token=${token}`)
    } catch (e) {
      console.log('Error Github Oauth', e)
      ctx.redirect(`${process.env.FRONTEND_URL}?error=${e.message}`)
    }
  }

  /**
   * Log out a user
   * @param {BaseContext} ctx
   */
  static async logout(ctx: BaseContext) {}
}

export default AuthController
