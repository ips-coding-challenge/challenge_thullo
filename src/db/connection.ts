import knex from 'knex'
import * as Config from './knexfile'

console.log(Config[process.env.NODE_ENV])

export default knex(Config[process.env.NODE_ENV || 'development'])
