import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('lists', (table) => {
    table.increments('id')
    table.string('name').notNullable()
    table.integer('board_id').unsigned().notNullable()
    table.timestamps(false, true)

    table.unique(['name', 'board_id'])

    table
      .foreign('board_id')
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE lists CASCADE')
}
