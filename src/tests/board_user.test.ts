import { expect } from 'chai'
import { knex, server, chai, should } from './setup'
import { createBoard, createMember, createUser, generateJwt } from './utils'

describe('Board_User', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should add a new user to a board', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const user = await createUser('user', 'user@test.fr')

    const res = await chai
      .request(server)
      .post('/api/members')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({ board_id: board.id, role: 'user' })

    res.status.should.equal(201)
    res.body.data.should.include.keys('id', 'username', 'email', 'avatar')
  })

  it('should not allow the owner to add himself to a board', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')

    const res = await chai
      .request(server)
      .post('/api/members')
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))
      .send({ board_id: board.id, role: 'user' })

    res.status.should.equal(400)
    res.text.should.equal("This user is the board's owner")
  })

  it('should not authorize to add a member if this member is already in the boards member', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const user = await createUser('user', 'user@test.fr')
    await createMember(user, board)

    const res = await chai
      .request(server)
      .post('/api/members')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({ board_id: board.id, role: 'user' })

    res.status.should.equal(422)
    res.text.should.equal('This user is already a member of the board')
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
