import { expect } from 'chai'
import { knex, server, chai, should } from './setup'
import { createBoard, createUser, generateJwt } from './utils'

describe('Boards', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should create a board', async () => {
    const user = await createUser()

    const res = await chai
      .request(server)
      .post('/api/boards')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        name: 'Board',
        cover: 'http://image.url',
        visibility: 'private',
      })

    res.status.should.equal(201)
    res.body.data.should.include.keys(
      'name',
      'cover',
      'visibility',
      'created_at',
      'updated_at',
      'user_id'
    )
  })

  it('should not authorized anonymous user to create a board', async () => {
    const res = await chai.request(server).post('/api/boards').send({
      name: 'Board',
      cover: 'http://image.url',
      visibility: 'private',
    })

    res.status.should.equal(401)
  })

  it('should not be possible to have the same board name for a same user', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .post('/api/boards')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        name: 'Board',
        cover: 'http://image.url',
        visibility: 'private',
      })

    res.status.should.equal(422)
    res.text.should.equal('You already have a board with this name')
  })

  it('should throw validation error when creating a board', async () => {})

  it('should authorize only the boards owner to update a board', async () => {})

  it('should not authorize anonymous user to update a board', async () => {})

  it('should delete a board', async () => {})

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
