import { expect } from 'chai'
import { knex, server, chai, should } from './setup'
import { createBoard, createMember, createUser, generateJwt } from './utils'

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

  it('should fetch all the boards for a user', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .get('/api/boards')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(200)
    res.body.data.length.should.equal(1)
    console.log('res body data', res.body.data)
    res.body.data[0].should.include.keys(
      'id',
      'name',
      'cover',
      'visibility',
      'user_id',
      'created_at',
      'updated_at',
      'members'
    )
  })

  it('should fetch the boards from a user and the boards where the user is a member', async () => {
    const user = await createUser()
    const anotherUser = await createUser('another', 'another@test.fr')
    const thirdUser = await createUser('third', 'third@test.fr')
    const board = await createBoard(user, 'Board')
    const boardByAnother = await createBoard(anotherUser, 'Board2')
    // Add the user to boardByAnother
    await createMember(user, boardByAnother)
    await createMember(thirdUser, boardByAnother)
    const res = await chai
      .request(server)
      .get('/api/boards')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(200)
    res.body.data.length.should.equal(2)
    console.log('res body data', res.body.data)
    res.body.data[0].should.include.keys(
      'id',
      'name',
      'cover',
      'visibility',
      'user_id',
      'created_at',
      'updated_at',
      'members'
    )
  })

  it('should authorize the boards owner to update a board', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .put(`/api/boards/${board.id}`)
      .send({
        visibility: 'public',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)
    res.body.data.visibility.should.equal('public')

    const [newBoard] = await knex('boards').where('id', board.id)
    newBoard.visibility.should.equal('public')
  })

  it('should not authorize to update a board with no data provided', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .put(`/api/boards/${board.id}`)
      .send({})
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(422)
  })

  it('should not authorize a simple member of the board to update a board', async () => {
    const user = await createUser()
    const member = await createUser('member', 'member@test.fr')
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .put(`/api/boards/${board.id}`)
      .send({
        visibility: 'public',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(member)))

    res.status.should.equal(403)

    const [newBoard] = await knex('boards').where('id', board.id)
    newBoard.visibility.should.equal('private')
  })

  it('should update the description of the board if the user is the owner', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .put(`/api/boards/${board.id}`)
      .send({
        description: 'description',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)
    res.body.data.description.should.equal('description')

    const [newBoard] = await knex('boards').where('id', board.id)
    newBoard.description.should.equal('description')
  })

  it('should update the description of the board if the user is an admin member', async () => {
    const user = await createUser()
    const member = await createUser('member', 'member@test.fr')
    const board = await createBoard(user, 'Board')
    await createMember(member, board, 'admin')

    const res = await chai
      .request(server)
      .put(`/api/boards/${board.id}`)
      .send({
        description: 'description',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(member)))

    res.status.should.equal(201)
    res.body.data.description.should.equal('description')

    const [newBoard] = await knex('boards').where('id', board.id)
    newBoard.description.should.equal('description')
  })

  it('should not update the description of the board for a member who is not an admin', async () => {
    const user = await createUser()
    const member = await createUser('member', 'member@test.fr')

    const board = await createBoard(user, 'Board')
    await createMember(member, board, 'user')

    const res = await chai
      .request(server)
      .put(`/api/boards/${board.id}`)
      .send({
        description: 'description',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(member)))

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')

    const [newBoard] = await knex('boards').where('id', board.id)
    expect(newBoard.description).to.be.null
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
