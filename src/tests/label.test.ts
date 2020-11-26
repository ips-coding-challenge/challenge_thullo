import { knex, server, chai } from './setup'
import {
  createBoard,
  createList,
  createUser,
  createTask,
  generateJwt,
  createLabel,
} from './utils'

describe('Labels', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should create a label', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')

    const res = await chai
      .request(server)
      .post('/api/labels')
      .send({
        name: 'label',
        color: '#bababa',
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)
  })

  it('should throw a error for an invalid color when creating a label', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')

    const res = await chai
      .request(server)
      .post('/api/labels')
      .send({
        name: 'label',
        color: 'azb',
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(422)
    res.text.should.equal(
      '"color" with value "azb" fails to match the required pattern: /^#([a-zA-Z0-9]{6})$/'
    )
  })

  it('should throw a error if the name, color and board_id already exists', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'First board')
    const label = await createLabel(board, 'label', '#bababa')

    const res = await chai
      .request(server)
      .post('/api/labels')
      .send({
        name: 'label',
        color: '#bababa',
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(422)
    res.text.should.equal(
      'You should have only one label with the same color and name for this board'
    )
  })

  it('should not authorize a random user to add label for a board', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'First board')

    const res = await chai
      .request(server)
      .post('/api/labels')
      .send({
        name: 'label',
        color: '#bababa',
        board_id: board.id,
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')

    const label = await knex('labels').where('board_id', board.id)
    label.length.should.equal(0)
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
