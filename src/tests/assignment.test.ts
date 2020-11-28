import { expect } from 'chai'
import { knex, server, chai } from './setup'
import {
  addMemberToTask,
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

  it('should delete a member from a task', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const list = await createList('First list', board)
    const task = await createTask('First task', admin, board, list)
    const assignedMember = await addMemberToTask(admin, task)

    const [addedMember] = await knex('assignment_task').where({
      task_id: task.id,
      user_id: admin.id,
    })

    expect(addedMember).not.undefined

    const res = await chai
      .request(server)
      .delete(`/api/assignments`)
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))
      .send({
        user_id: admin.id,
        task_id: task.id,
      })

    res.status.should.equal(204)

    const [deletedMember] = await knex('assignment_task').where({
      task_id: task.id,
      user_id: admin.id,
    })

    expect(deletedMember).to.be.undefined
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })
})
