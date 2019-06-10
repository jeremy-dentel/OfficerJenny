exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTable('Guild', table => {
            table.increments('id')
                .primary();

            table.string('snowflake', 30)
                .unique();
        }),

        knex.schema.createTable('FilteredWords', table => {
            table.increments('id')
                .primary();

            table.string('word')
                .unique()
                .collate('utf8mb4_general_ci');

            table.boolean('enabled')
                .defaultTo(true);
        }),

        knex.schema.createTable('Responses', table => {
            table.increments('id')
                .primary();

            table.string('response')
                .notNullable();
        })
    ])
};

exports.down = function (knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('FilteredWords'),
        knex.schema.dropTable('Guild'),
        knex.schema.dropTable('Responses')
    ])
};
