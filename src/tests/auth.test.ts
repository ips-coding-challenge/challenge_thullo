import { knex, server, chai, should } from './setup'

describe('Authentication', () => {
  beforeEach(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()
  })

  it('should register a user', async () => {
    const res = await chai.request(server).post('/api/register').send({
      username: 'admin',
      email: 'admin@test.fr',
      password: 'password',
    })

    res.status.should.equal(201)
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
