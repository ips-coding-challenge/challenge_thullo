import { expect } from 'chai'
import { knex, server, chai } from './setup'
import {
  createBoard,
  createList,
  createUser,
  createTask,
  generateJwt,
  addMemberToTask,
  createMember,
} from './utils'

describe('Tasks', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should create a task for a list', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Task title',
        list_id: list.id,
        board_id: board.id,
        position: 65565,
      })

    res.status.should.equal(201)
    res.body.data.should.include.keys('title')
  })

  it('should not validate a task without title', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        list_id: list.id,
        board_id: board.id,
        position: 65565,
      })

    res.status.should.equal(422)
    res.text.should.equal(`"title" is required`)
  })

  it('should not validate a task without position', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Title',
        list_id: list.id,
        board_id: board.id,
      })

    res.status.should.equal(422)
    res.text.should.equal(`"position" is required`)
  })

  it('should not validate a task without board_id', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Title',
        list_id: list.id,
        position: 65565,
      })

    res.status.should.equal(422)
    res.text.should.equal(`"board_id" is required`)
  })

  it('should not validate a task without list_id', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Title',
        board_id: board.id,
        position: 65565,
      })

    res.status.should.equal(422)
    res.text.should.equal(`"list_id" is required`)
  })

  it('should not insert a task if the board does not exists', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Title',
        board_id: 3,
        list_id: list.id,
        position: 65565,
      })

    // 403 because we enter in the can function which should return false
    res.status.should.equal(403)
  })

  it('should not insert a task if the list does not exists', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Title',
        list_id: 50,
        board_id: board.id,
        position: 65565,
      })

    res.status.should.equal(400)
  })

  it('should not authorize a user who are not a member of the board to add a task', async () => {
    const admin = await createUser()
    const user = await createUser('user', 'user@test.fr')
    const board = await createBoard(admin, 'Board')
    const list = await createList('List', board)

    const res = await chai
      .request(server)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Task title',
        list_id: list.id,
        board_id: board.id,
        position: 65565,
      })

    res.status.should.equal(403)
  })

  it('should update a task for a list', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)
    const task = await createTask('Task 1', user, board, list)

    const res = await chai
      .request(server)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        title: 'Task 1 updated!',
        board_id: board.id,
        list_id: list.id,
        position: task.position,
      })

    res.status.should.equal(201)
    res.body.data.should.include.keys('title')
    res.body.data.title.should.equal('Task 1 updated!')
  })

  it('should fetch a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)
    const task = await createTask('Task 1', user, board, list)

    const res = await chai
      .request(server)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(200)
    res.body.data.should.include.keys('id', 'title', 'description')
  })

  it('should fetch a task if authorized', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)
    const task = await createTask('Task 1', user, board, list)

    const res = await chai
      .request(server)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
  })

  it('should delete a task', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)
    const task = await createTask('Task 1', user, board, list)

    const res = await chai
      .request(server)
      .delete(`/api/tasks`)
      .send({
        task_id: task.id,
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(204)

    const [taskDeleted] = await knex('tasks').where('id', task.id)
    expect(taskDeleted).to.be.undefined
  })

  it('should delete a task and the associated resources', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)
    const task = await createTask('Task 1', user, board, list)
    await addMemberToTask(user, task)

    const assignedMembers = await knex('assignment_task').where({
      user_id: user.id,
      task_id: task.id,
    })

    assignedMembers.length.should.equal(1)

    const res = await chai
      .request(server)
      .delete(`/api/tasks`)
      .send({
        task_id: task.id,
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(204)

    const assignedMembersAfterTaskDeletion = await knex(
      'assignment_task'
    ).where({
      user_id: user.id,
      task_id: task.id,
    })

    assignedMembersAfterTaskDeletion.length.should.equal(0)
  })

  it('should only allow the owner of the task or an admin to delete the task', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const memberAdmin = await createUser('memberAdmin', 'memberAdmin@test.fr')
    const board = await createBoard(user, 'Board')
    const list = await createList('List', board)
    const task = await createTask('Task 1', user, board, list)
    await createMember(another, board, 'user')
    await createMember(memberAdmin, board, 'admin')

    const res = await chai
      .request(server)
      .delete(`/api/tasks`)
      .send({
        task_id: task.id,
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')

    const res2 = await chai
      .request(server)
      .delete(`/api/tasks`)
      .send({
        task_id: task.id,
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(memberAdmin)))

    res2.status.should.equal(204)
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
