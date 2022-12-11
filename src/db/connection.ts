import knex from 'knex'
import * as Config from './knexfile'

export default knex(Config[process.env.NODE_ENV || 'development'])
