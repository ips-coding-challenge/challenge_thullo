import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('invitations', (table) => {
    table.increments('id')
    table.string('token').notNullable()
    table.integer('board_id').unsigned().notNullable()
    table.integer('user_id').unsigned().notNullable()
    table.timestamps(false, true)

    table.unique(['board_id', 'user_id'])

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table
      .foreign('board_id')
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE invitations CASCADE')
}
