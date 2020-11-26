import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('label_task', (table) => {
    table.increments('id')
    table.integer('label_id').unsigned().notNullable()
    table.integer('task_id').unsigned().notNullable()

    table.unique(['label_id', 'task_id'])

    table
      .foreign('label_id')
      .references('id')
      .inTable('labels')
      .onDelete('CASCADE')
    table
      .foreign('task_id')
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE label_task CASCADE')
}
