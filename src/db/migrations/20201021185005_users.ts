import { table } from 'console'
import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.increments('id')
    table.string('username', 255).notNullable().unique()
    table.string('email', 255).notNullable().unique()
    table.string('avatar')
    table.string('password').notNullable()
    table.timestamps(false, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users')
}
