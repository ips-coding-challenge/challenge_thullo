import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('password').nullable().alter()
    table.string('github_id').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('password').notNullable().alter()
    table.dropColumn('github_id')
  })
}
