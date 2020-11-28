import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('attachment_task', (table) => {
    table.increments('id')
    table.string('name').notNullable()
    table.string('url').notNullable()
    table.string('format').notNullable()
    table.integer('task_id').unsigned().notNullable()
    table.integer('user_id').unsigned().notNullable()

    table.unique(['name', 'task_id'])

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
  return knex.raw('DROP TABLE attachment_task CASCADE')
}
