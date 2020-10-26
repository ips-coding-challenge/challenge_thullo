import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tasks', (table) => {
    table.increments('id')
    table.string('title').notNullable()
    table.text('description')
    table.float('position').notNullable()
    table.string('cover')
    table.integer('user_id').unsigned().notNullable()
    table.integer('board_id').unsigned().notNullable()
    table.integer('list_id').unsigned().notNullable()
    table.timestamps(false, true)

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
    table
      .foreign('list_id')
      .references('id')
      .inTable('lists')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tasks')
}
