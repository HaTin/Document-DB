
require('dotenv').config()

const mssqlConnection = {
    client: 'mssql',
    connection: process.env.MSSQL_CONNECTION_STRING
}
const postgresqlConnection = {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING
};

module.exports = {
    postgresqlConnection,
    mssqlConnection
}