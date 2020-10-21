import { BaseContext, Context } from 'koa'

class AuthController {
  /**
   * Log a user
   * @param {BaseContext} ctx
   */
  static async login(ctx: BaseContext) {
    ctx.body = {
      data: 'Salut',
    }
  }

  /**
   * Register a user
   * @param {BaseContext} ctx
   */
  static async register(ctx: BaseContext) {
    ctx.throw(401, 'Not valid')
  }

  /**
   * Log out a user
   * @param {BaseContext} ctx
   */
  static async logout(ctx: BaseContext) {}
}

export default AuthController
