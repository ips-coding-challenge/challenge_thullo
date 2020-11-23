import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('assignment_task', (table) => {
    table.increments('id')
    table.integer('user_id').unsigned().notNullable()
    table.integer('task_id').unsigned().notNullable()

    table.unique(['user_id', 'task_id'])

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table
      .foreign('task_id')
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE assignment_task CASCADE')
}
