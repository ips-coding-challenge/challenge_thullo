import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('boards', (table) => {
    table.increments('id')
    table.string('name').notNullable()
    table.string('cover')
    table.text('description')
    table.integer('user_id').unsigned().notNullable()
    table.enu('visibility', ['private', 'public']).defaultTo('private')
    table.timestamps(false, true)

    table.unique(['name', 'user_id'])

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE boards CASCADE')
}
