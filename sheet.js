const database = require('./database')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const sheetId = '1hpZKlBfHz3iQBgGhZHtUwKTN0WMmpjdspUFzUaYVFcI'
const appendSchemasToSheet = async (schema) => {
  try {
    const sheetData = []
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(require('./credentials.json'));
    await doc.getInfo()
    const firstSheet = await doc.sheetsByIndex[0]    
    const queryData = await database.getDatabaseSchemas(schema)
    const row = await firstSheet.getCellsInRange(`A1:${firstSheet.lastColumnLetter}1`);
    if(row){
      const sheetRows = await firstSheet.getRows()
      for (let i = 0; i < sheetRows.length; i++) {
        sheetData.push({
          table_name: sheetRows[i]['Object Name'],
          table_type: sheetRows[i]['Object Name'],
          column_name: sheetRows[i]['Column Name'],
          data_type: sheetRows[i]['Data Type'],
          is_nullable: sheetRows[i]['Nullable'],
          description:sheetRows[i]['Description'],
          pic : sheetRows[i]['PIC']
        })
      }
    }
    const mergeResult = getMergeData(queryData, sheetData)
    await firstSheet.clear()
    await firstSheet.setHeaderRow(['Object Type', 'Object Name', 'Column Name', 'Data Type', 'Nullable', 'MiscInfo','Description','PIC'])
    let rows = []
    for(let i = 0; i < mergeResult.length; i++){
    rows.push([mergeResult[i].table_type || '',
              mergeResult[i].table_name || '',
              mergeResult[i].column_name || '',
              mergeResult[i].data_type|| '',
              mergeResult[i].is_nullable|| '',
              '', // Misc Info
              mergeResult[i].description || '',
              mergeResult[i].pic] || '')
    }
    await firstSheet.addRows(rows)
    console.log('Add data to sheet successfully')
  } catch (error) {
    console.log('Error adding data to sheet', error) 
  }
}


const getMergeData = (queryData, sheetData) => {
  if(!sheetData.length) return queryData
  const result = queryData.map(d => {
    const row = sheetData.find(e => e.column_name === d.column_name && e.table_name === d.table_name)
    if(row){
      d.description = row.description
      d.pic = row.pic
    }
    return d
  })
  return result
} 


module.exports = {
  appendSchemasToSheet
}