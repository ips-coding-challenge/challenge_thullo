import { expect } from 'chai'
import chaiHttp from 'chai-http'
import { knex, server, chai } from './setup'
import {
  addMemberToTask,
  createBoard,
  createComment,
  createList,
  createTask,
  createUser,
  generateJwt,
} from './utils'

describe('Comments', () => {
  beforeEach(async () => {
    await knex.migrate.rollback({}, true)
    await knex.migrate.latest()
  })

  it('should insert a comment for a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)

    const res = await chai
      .request(server)
      .post('/api/comments')
      .send({
        content: 'message',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)

    const comments = await knex('comments').where('task_id', task.id)
    comments.length.should.equal(1)
  })

  it('should not insert an empty comment for a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)

    const res = await chai
      .request(server)
      .post('/api/comments')
      .send({
        content: 'a',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(422)
    res.text.should.equal('"content" length must be at least 2 characters long')
    const comments = await knex('comments').where('task_id', task.id)
    comments.length.should.equal(0)
  })

  it('should only allow members of the board to write comments', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)

    const res = await chai
      .request(server)
      .post('/api/comments')
      .send({
        content: 'message',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')
    const comments = await knex('comments').where('task_id', task.id)
    comments.length.should.equal(0)
  })

  it('should update a comment', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)
    const comment = await createComment('message', user, task)

    const res = await chai
      .request(server)
      .put(`/api/comments/${comment.id}`)
      .send({
        content: 'new message',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(200)
    const [newComment] = await knex('comments').where('id', comment.id)

    newComment.content.should.equal('new message')
  })

  it('should only allow admin or comments owner to update a comment', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)
    const comment = await createComment('message', user, task)

    const res = await chai
      .request(server)
      .put(`/api/comments/${comment.id}`)
      .send({
        content: 'new message',
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
    const [newComment] = await knex('comments').where('id', comment.id)

    newComment.content.should.equal('message')
  })

  it('should delete a comment', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)
    const comment = await createComment('message', user, task)

    const res = await chai
      .request(server)
      .delete(`/api/comments`)
      .send({
        comment_id: comment.id,
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(204)
    const [newComment] = await knex('comments').where('id', comment.id)

    expect(newComment).to.be.undefined
  })

  it('should only allow admin or comments owner to delete a comment', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'First board')
    const list = await createList('First list', board)
    const task = await createTask('task', user, board, list)
    const comment = await createComment('message', user, task)

    const res = await chai
      .request(server)
      .delete(`/api/comments`)
      .send({
        comment_id: comment.id,
        task_id: task.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
    const [newComment] = await knex('comments').where('id', comment.id)

    expect(newComment).to.not.be.undefined
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })
})
