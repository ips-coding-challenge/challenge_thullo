import { knex, server, chai } from './setup'
import {
  createBoard,
  createList,
  createTask,
  createUser,
  generateJwt,
} from './utils'

describe('Assignments', () => {
  beforeEach(async () => {
    await knex.migrate.rollback({}, true)
    await knex.migrate.latest()
  })

  it('should add a member to a task', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const list = await createList('First list', board)
    const task = await createTask('First task', admin, board, list)

    const res = await chai
      .request(server)
      .post('/api/assignments')
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))
      .send({
        user_id: admin.id,
        task_id: task.id,
      })

    res.status.should.equal(201)
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })
})
