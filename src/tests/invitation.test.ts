import { knex, server, chai } from './setup'
import {
  createBoard,
  createInvitation,
  createList,
  createMember,
  createUser,
  generateJwt,
} from './utils'

describe('Invitations', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should add an invitation', async () => {
    const admin = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(admin, 'Board')

    const res = await chai
      .request(server)
      .post('/api/invitations')
      .send({
        board_id: board.id,
        username: another.username,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    res.status.should.equal(204)
  })

  it.only('should authorize only the admin of the board to send invitation', async () => {
    const admin = await createUser()
    const member = await createUser('member', 'member@test.fr')
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(admin, 'Board')
    await createMember(member, board, 'user')

    const res = await chai
      .request(server)
      .post('/api/invitations')
      .send({
        board_id: board.id,
        username: another.username,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(member)))

    res.status.should.equal(403)
    res.text.should.equal('Only an administrator can invite new member')

    const res2 = await chai
      .request(server)
      .post('/api/invitations')
      .send({
        board_id: board.id,
        username: another.username,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    res2.status.should.equal(204)
  })

  it('should not add an invitation if the invitation already exists and has not expired', async () => {
    const admin = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(admin, 'Board')
    const invitation = await createInvitation(another, board)

    const res = await chai
      .request(server)
      .post('/api/invitations')
      .send({
        board_id: board.id,
        username: another.username,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    res.status.should.equal(400)
  })

  it('should remove and readd an invitation if the invitation has expired', async () => {
    const admin = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(admin, 'Board')
    const expiredDate = Date.now() - 60000 * 60 * 30
    const invitation = await createInvitation(
      another,
      board,
      new Date(expiredDate).toISOString()
    )

    const res = await chai
      .request(server)
      .post('/api/invitations')
      .send({
        board_id: board.id,
        username: another.username,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    const oldInv = await knex('invitations').where('id', invitation.id)
    const newInv = await knex('invitations').where({
      user_id: another.id,
      board_id: board.id,
    })
    oldInv.length.should.equal(0)
    newInv.length.should.equal(1)
    res.status.should.equal(204)
  })

  it('should not invite a user who is alread a member of the board', async () => {
    const admin = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(admin, 'Board')
    await createMember(another, board)

    const res = await chai
      .request(server)
      .post('/api/invitations')
      .send({
        board_id: board.id,
        username: another.username,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(admin)))

    res.status.should.equal(400)
    res.text.should.equal('This user is already a member')
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
