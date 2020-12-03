import { knex, server, chai } from './setup'
import { createBoard, createList, createUser, generateJwt } from './utils'

describe('Users', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it("should update a user's avatar", async () => {
    const user = await createUser('admin', 'admin@test.fr')

    const res = await chai
      .request(server)
      .put(`/api/users`)
      .send({
        avatar: 'https://newAvatar.com',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(201)
    res.body.data.avatar.should.equal('https://newAvatar.com')
  })

  it("should not authorize to update a user's avatar if its not a valid url", async () => {
    const user = await createUser('admin', 'admin@test.fr')

    const res = await chai
      .request(server)
      .put(`/api/users`)
      .send({
        avatar: 'test',
      })
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(422)
    console.log(res.text)
    // res.body.data.avatar.should.equal('https://newAvatar.com')
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
