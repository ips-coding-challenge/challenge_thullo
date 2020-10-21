import knex from 'knex'
console.log('NODE_ENV', process.env.NODE_ENV)
const config = require('../../knexfile')[process.env.NODE_ENV || 'development']

export default knex(config)
