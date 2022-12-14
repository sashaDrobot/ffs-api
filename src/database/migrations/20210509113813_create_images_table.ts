import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable('images', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('name', 255).notNullable();
    table.string('path', 255).notNullable();
    table.uuid('entity_id').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTableIfExists('images');
}
