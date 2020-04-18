const knex = require('knex')({
    client: 'postgresql',
    connection: {
        user: 'postgres',
        password: '123456',
        server: 'localhost',
        database: 'TEST_DB',
                
    }
});
module.exports = knex