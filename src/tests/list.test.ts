import { knex, server, chai } from './setup'
import { createBoard, createList, createUser, generateJwt } from './utils'

describe('Lists', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should insert a new list', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .post('/api/lists')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        board_id: board.id,
        name: 'First list',
      })

    res.status.should.equal(201)

    const lists = await knex('lists').where('board_id', board.id)
    lists.length.should.equal(1)
  })

  it('should fetch all the lists from a board', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('First list', board)

    const res = await chai
      .request(server)
      .get(`/api/lists?board_id=${board.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(200)
    res.body.data[0].should.include.keys(
      'id',
      'name',
      'board_id',
      'created_at',
      'updated_at'
    )
  })

  it('should not authorize a user which are not a member of the board to fetch lists', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'Board')
    const list = await createList('First list', board)

    const res = await chai
      .request(server)
      .get(`/api/lists?board_id=${board.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))

    res.status.should.equal(403)
  })

  it('should not authorize a user which are not a member of the board to create a list', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const board = await createBoard(user, 'Board')

    const res = await chai
      .request(server)
      .post(`/api/lists`)
      .set('Authorization', 'Bearer ' + (await generateJwt(another)))
      .send({
        name: 'New List',
        board_id: board.id,
      })

    res.status.should.equal(403)
    res.text.should.equal('Not allowed')
  })

  it('should not authorize to add a list if the name already exists in this board', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('First list', board)

    const res = await chai
      .request(server)
      .post('/api/lists')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        board_id: board.id,
        name: 'First list',
      })

    res.status.should.equal(422)

    res.text.should.equal('You already have a list with this name')
  })

  it('should update a list', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('First list', board)

    const res = await chai
      .request(server)
      .put(`/api/lists/${list.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        board_id: board.id,
        name: 'First list updated',
      })

    res.status.should.equal(200)
    const [updatedList] = await knex('lists').where({ id: list.id })
    updatedList.name.should.equal('First list updated')
  })

  it('should not allow to update a list with a name already taken', async () => {
    const user = await createUser()
    const board = await createBoard(user, 'Board')
    const list = await createList('First list', board)
    const list2 = await createList('Second list', board)

    const res = await chai
      .request(server)
      .put(`/api/lists/${list.id}`)
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))
      .send({
        board_id: board.id,
        name: 'Second list',
      })

    res.status.should.equal(422)
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
