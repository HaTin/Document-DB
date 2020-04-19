const Knex = require('knex')
const getDatabaseSchemas = async (schema, dbConfig) => {
    const result = await Knex(dbConfig)('information_schema.tables').join('information_schema.columns',function(){
        this.on('information_schema.tables.table_schema', '=', 'information_schema.columns.table_schema')
        .andOn('information_schema.tables.table_name','=','information_schema.columns.table_name')
    }).
    select('information_schema.tables.table_type','information_schema.tables.table_name',
            'information_schema.columns.column_name', 'information_schema.columns.data_type',
            'information_schema.columns.is_nullable')
    .where({'information_schema.tables.table_schema': schema}) 
    .groupBy('information_schema.tables.table_type','information_schema.tables.table_name',
    'information_schema.columns.column_name', 'information_schema.columns.data_type',
    'information_schema.columns.is_nullable').
    orderBy('information_schema.tables.table_name')
    return result
}

module.exports = {
    getDatabaseSchemas
}


