import { expect } from 'chai'
import { createSecureContext } from 'tls'
import { knex, server, chai, should } from './setup'
import { createUser, generateJwt } from './utils'

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
    res.body.data.should.include.keys('user', 'token')
    const [user] = await knex('users').where({ email: 'admin@test.fr' })
    expect(user).to.exist
    user.username.should.equal('admin')
  })

  it('should throw invalid username', async () => {
    const res = await chai.request(server).post('/api/register').send({
      username: 'a',
      email: 'admin@test.fr',
      password: 'password',
    })

    res.status.should.equal(422)
    res.text.should.equal(
      '"username" length must be at least 2 characters long'
    )
  })

  it('should throw invalid password', async () => {
    const res = await chai.request(server).post('/api/register').send({
      username: 'admin',
      email: 'admin@test.fr',
      password: 'pass',
    })

    res.status.should.equal(422)
    res.text.should.equal(
      '"password" length must be at least 6 characters long'
    )
  })

  it('should throw invalid email', async () => {
    const res = await chai.request(server).post('/api/register').send({
      username: 'admin',
      email: 'admin',
      password: 'pass',
    })

    res.status.should.equal(422)
    res.text.should.equal('"email" must be a valid email')
  })

  it('should throw unique email error', async () => {
    await createUser('admin', 'admin@test.fr')

    const res = await chai.request(server).post('/api/register').send({
      username: 'admin1',
      email: 'admin@test.fr',
      password: 'password',
    })

    res.status.should.equal(422)
    res.text.should.equal('This email is already taken')
  })

  it('should throw unique username error', async () => {
    await createUser('admin', 'admin@test.fr')

    const res = await chai.request(server).post('/api/register').send({
      username: 'admin',
      email: 'admin1@test.fr',
      password: 'password',
    })

    res.status.should.equal(422)
    res.text.should.equal('This username is already taken')
  })

  // Login
  it('should login a user', async () => {
    const user = await createUser('admin', 'admin@test.fr')

    const res = await chai.request(server).post('/api/login').send({
      email: 'admin@test.fr',
      password: 'password',
    })

    res.status.should.equal(200)
    res.body.data.should.include.keys('user', 'token')
    res.body.data.user.email.should.equal(user.email)
  })

  it('should throw invalid credentials when login a user', async () => {
    const user = await createUser('admin', 'admin@test.fr')

    const res = await chai.request(server).post('/api/login').send({
      email: 'admin@test.fr',
      password: 'passwo',
    })

    res.status.should.equal(400)
    res.text.should.equal('Invalid credentials')
  })

  it('should throw invalid email when login a user', async () => {
    const res = await chai.request(server).post('/api/login').send({
      email: 'admin',
      password: 'password',
    })

    res.status.should.equal(422)
    res.text.should.equal('"email" must be a valid email')
  })

  it('should throw invalid password when login a user', async () => {
    const res = await chai.request(server).post('/api/login').send({
      email: 'admin@test.fr',
    })

    res.status.should.equal(422)
    res.text.should.equal('"password" is required')
  })

  it('should fetch the connected user', async () => {
    const user = await createUser('admin', 'admin@test.fr')

    const res = await chai
      .request(server)
      .get('/api/me')
      .set('Authorization', 'Bearer ' + (await generateJwt(user)))

    res.status.should.equal(200)
    res.body.data.should.include.keys(
      'id',
      'username',
      'email',
      'avatar',
      'created_at',
      'updated_at'
    )
    res.body.data.should.not.include.keys('password')
  })

  it('should not authorized anonymous user to fetch the connected user', async () => {
    const user = await createUser('admin', 'admin@test.fr')

    const res = await chai.request(server).get('/api/me')

    res.status.should.equal(401)
  })

  afterEach(() => {
    return knex.migrate.rollback()
  })
})
