import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('comments', (table) => {
    table.increments('id')
    table.string('content').notNullable()
    table.integer('task_id').unsigned().notNullable()
    table.integer('user_id').unsigned().notNullable()
    table.timestamps(false, true)

    table
      .foreign('task_id')
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE')

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE comments CASCADE')
}
