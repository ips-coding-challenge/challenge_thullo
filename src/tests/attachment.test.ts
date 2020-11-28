import { expect } from 'chai'
import { knex, server, chai } from './setup'
import {
  addMemberToTask,
  createAttachment,
  createBoard,
  createList,
  createMember,
  createTask,
  createUser,
  generateJwt,
} from './utils'

describe('Attachments', () => {
  beforeEach(async () => {
    await knex.migrate.rollback({}, true)
    await knex.migrate.latest()
  })

  it('should add an attachment to a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('List', board)
    const task = await createTask('Title', user, board, list)

    const res = await chai
      .request(server)
      .post('/api/attachments')
      .send({
        name: 'file',
        format: 'jpg',
        public_id: 'lmakmlkzm',
        url: 'https://machin.truc',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)

    const attachments = await knex('attachment_task').where({
      task_id: task.id,
      user_id: user.id,
      name: 'file',
    })

    attachments.length.should.equal(1)
  })

  it('should not be able to insert invalid data when adding an attachment', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('List', board)
    const task = await createTask('Title', user, board, list)

    const res = await chai
      .request(server)
      .post('/api/attachments')
      .send({
        format: 'jpg',
        public_id: 'alzkjl',
        url: 'https://machin.truc',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(422)

    res.text.should.equal('"name" is required')

    const attachments = await knex('attachment_task').where({
      task_id: task.id,
      user_id: user.id,
      name: 'file',
    })

    attachments.length.should.equal(0)
  })

  it('should delete an attachment from a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('List', board)
    const task = await createTask('Title', user, board, list)
    const attachment = await createAttachment(user, task)

    const res = await chai
      .request(server)
      .delete('/api/attachments')
      .send({
        attachment_id: attachment.id,
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(204)

    const attachments = await knex('attachment_task').where('id', attachment.id)

    attachments.length.should.equal(0)
  })

  it('should not delete an attachment from a task if the attachment does not belong to that user', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'First board')
    const list = await createList('List', board)
    const task = await createTask('Title', user, board, list)
    await createMember(another, board)
    const attachment = await createAttachment(user, task)

    const res = await chai
      .request(server)
      .delete('/api/attachments')
      .send({
        attachment_id: attachment.id,
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')

    const attachments = await knex('attachment_task').where('id', attachment.id)

    attachments.length.should.equal(1)
  })

  it('should delete an attachment if the request is made by an admin', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'First board')
    const list = await createList('List', board)
    const task = await createTask('Title', user, board, list)
    await createMember(another, board, 'admin')
    const attachment = await createAttachment(user, task)

    const res = await chai
      .request(server)
      .delete('/api/attachments')
      .send({
        attachment_id: attachment.id,
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(204)

    const attachments = await knex('attachment_task').where('id', attachment.id)

    attachments.length.should.equal(0)
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })
})
