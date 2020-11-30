import { expect } from 'chai'
import { knex, server, chai, should } from './setup'
import {
  createBoard,
  createInvitation,
  createMember,
  createUser,
  generateJwt,
} from './utils'

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

  it('should authorize an admin to remove a member', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const user = await createUser('user', 'user@test.fr')
    await createMember(user, board)

    const res = await chai
      .request(server)
      .delete(`/api/members`)
      .send({
        board_id: board.id,
        user_id: user.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    res.status.should.equal(204)

    const [members] = await knex('board_user').where({
      board_id: board.id,
      user_id: user.id,
    })

    expect(members).to.be.undefined
  })

  it('should not authorize simple member to remove another member', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const user = await createUser('user', 'user@test.fr')
    const third = await createUser('third', 'third@test.fr')
    await createMember(user, board)
    await createMember(third, board)

    const res = await chai
      .request(server)
      .delete(`/api/members`)
      .send({
        board_id: board.id,
        user_id: third.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')

    const [members] = await knex('board_user').where({
      board_id: board.id,
      user_id: user.id,
    })

    expect(members).to.exist
  })

  it('should also remove invitation when deleting a member from a board', async () => {
    const admin = await createUser()
    const board = await createBoard(admin, 'Board')
    const user = await createUser('user', 'user@test.fr')
    await createMember(user, board)
    await createInvitation(user, board)

    const res = await chai
      .request(server)
      .delete(`/api/members`)
      .send({
        board_id: board.id,
        user_id: user.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    res.status.should.equal(204)
    const [invitation] = await knex('invitations').where({
      board_id: board.id,
      user_id: user.id,
    })
    expect(invitation).to.be.undefined
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
