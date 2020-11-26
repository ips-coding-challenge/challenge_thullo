import { expect } from 'chai'
import { knex, server, chai } from './setup'
import {
  createBoard,
  createList,
  createUser,
  createTask,
  generateJwt,
  createLabel,
} from './utils'

describe('Label_Task', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should add a label to task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const label = await createLabel(board)
    const list = await createList('List', board)
    const task = await createTask('Cool task', user, board, list)

    const res = await chai
      .request(server)
      .post(`/api/tasks/${task.id}/labels`)
      .send({
        task_id: task.id,
        label_id: label.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)
    const addedLabel = await knex('label_task').where({
      task_id: task.id,
      label_id: label.id,
    })

    addedLabel.length.should.equal(1)
  })

  it('should remove a label from a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const label = await createLabel(board)
    const list = await createList('List', board)
    const task = await createTask('Cool task', user, board, list)

    // Add a label to a task
    const [addedLabel] = await knex('label_task')
      .insert({
        task_id: task.id,
        label_id: label.id,
      })
      .returning('*')

    expect(addedLabel).not.undefined

    const res = await chai
      .request(server)
      .delete(`/api/tasks/${task.id}/labels`)
      .send({
        task_id: task.id,
        label_id: label.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(204)

    const taskLabels = await knex('label_task').where({
      task_id: task.id,
      label_id: label.id,
    })
    taskLabels.length.should.equal(0)
  })

  it('should not authorize one who is not a member of the board to remove a label from a task', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'Board')
    const label = await createLabel(board)
    const list = await createList('List', board)
    const task = await createTask('Cool task', user, board, list)

    // Add a label to a task
    const [addedLabel] = await knex('label_task')
      .insert({
        task_id: task.id,
        label_id: label.id,
      })
      .returning('*')

    expect(addedLabel).not.undefined

    const res = await chai
      .request(server)
      .delete(`/api/tasks/${task.id}/labels`)
      .send({
        task_id: task.id,
        label_id: label.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)

    res.text.should.equal('Not allowed')

    const taskLabels = await knex('label_task').where({
      task_id: task.id,
      label_id: label.id,
    })
    taskLabels.length.should.equal(1)
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
