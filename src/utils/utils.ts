import { ValidationError } from '@hapi/joi'
import { Context } from 'koa'

export const response = (ctx: Context, status = 200, data) => {
  ctx.status = status
  ctx.body = data
}

export const validationError = (e: ValidationError) => {
  return {
    field: e.details[0].path[0],
    message: e.details[0].message,
  }
}
