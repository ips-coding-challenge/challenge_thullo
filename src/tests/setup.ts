import chai from 'chai'
import chaiHttp from 'chai-http'
import server from '../app'
import knex from '../db/connection'

chai.use(chaiHttp)

const should = chai.should()

export { chai, server, knex, should }
