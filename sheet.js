const database = require('./database')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const sheetId = '1hpZKlBfHz3iQBgGhZHtUwKTN0WMmpjdspUFzUaYVFcI'
const appendSchemasToSheet = async (schema) => {
  try {
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(require('./credentials.json'));
    await doc.getInfo()
    const firstSheet = await doc.sheetsByIndex[0]
    await firstSheet.clear()  
    await firstSheet.setHeaderRow(['Object Type', 'Object Name', 'Column Name', 'Data Type', 'Nullable', 'MiscInfo','Description','PIC'])
    const results = await database.getDatabaseSchemas(schema)
    let rows = []
    for(let i = 0; i < results.length; i++){
    rows.push([results[i].table_name || '',
                results[i].table_type || '',
                results[i].column_name || '',
                results[i].data_type|| '',
                results[i].is_nullable|| ''])
    }
    await firstSheet.addRows(rows)
    console.log('Add data to sheet successfully')
  } catch (error) {
    console.log('Error adding data to sheet', error) 
  }
}

module.exports = {
  appendSchemasToSheet
}