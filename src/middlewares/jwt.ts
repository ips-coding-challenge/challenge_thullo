import { Next } from 'koa'
import { Context } from 'koa'
import knex from '../db/connection'
import { response } from '../utils/utils'
import jsonwebtoken from 'jsonwebtoken'

interface TokenData {
  data: {
    id: string
    username: string
    email: string
  }
}

const middleware = async function jwt(ctx: Context, next: Next) {
  //Grab the token
  const token = extractJwtToken(ctx)
  if (!token) return
  try {
    const decoded = <any>jsonwebtoken.verify(token, process.env.JWT_SECRET)

    console.log('decoded', decoded)

    const [user] = await knex('users').where('id', decoded.data.id)

    if (!user) {
      return response(ctx, 401, 'This user does not exists')
    }
    //If it worked set the ctx.state.user parameter to the decoded token.
    ctx.state.user = decoded.data
  } catch (error) {
    //If it's an expiration error, let's report that specifically.
    if (error.name === 'TokenExpiredError') {
      ctx.throw(401, 'Token expired')
    } else {
      ctx.throw(401, 'Invalid token')
    }
  }

  return next()
}

const extractJwtToken = (ctx: Context) => {
  try {
    if (!ctx.header || !ctx.header.authorization) {
      return
    }

    const parts = ctx.header.authorization.split(' ')

    if (parts.length === 2) {
      const scheme = parts[0]
      const credentials = parts[1]

      if (/^Bearer$/i.test(scheme)) {
        return credentials
      } else {
        return response(ctx, 401, 'Unauthorized')
      }
    }
  } catch (e) {
    ctx.throw(401, 'Unauthorized')
  }
}

export default middleware
