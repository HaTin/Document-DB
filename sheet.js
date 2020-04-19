const database = require('./database')
const keys = require('./credentials.json')
const {google} = require('googleapis')
// const config = require('./config/connection')
const scopes = ['https://www.googleapis.com/auth/spreadsheets'] // write and read
const spreadsheetId = '1hpZKlBfHz3iQBgGhZHtUwKTN0WMmpjdspUFzUaYVFcI'

const exportSchemaToGoogleSheet = async (schema, dbConfig) => {
  try {
  const range = 'Sheet1'
  const client = await getAuthorizeClient()
  const sheets = google.sheets({version: 'v4', auth: client})
  const data = await getSheetData(sheets, {spreadsheetId, range})  
  const result = await database.getDatabaseSchemas(schema, dbConfig)
  const queryData = result.map(r => Object.values(r))
  const mergeResult = mergeData(queryData, data)
  const headers = ['Object Type', 'Object Name', 'Column Name', 'Data Type', 'Nullable', 'MiscInfo','Description','PIC']
  const values = [headers, ...mergeResult]
  const resource = {values}
  await clearSheet(sheets, {spreadsheetId, range})
  const response = await addSheet(sheets, {spreadsheetId, range, valueInputOption: 'USER_ENTERED', resource})
  return response
  } catch (error) {
    console.log(error)
  }
}

const getAuthorizeClient = () => {  
  return new Promise((resolve, reject) => {
    const client = new google.auth.JWT(keys.client_email,null,keys.private_key, scopes)
    client.authorize((err, tokens) => {
      if(err) {
        console.log(err)
        reject(err)
      }
      resolve(client)
    })
  })
}

const getSheetData = async (sheets, {spreadsheetId, range}) => {
  const data = await sheets.spreadsheets.values.get({spreadsheetId, range})
  return data.data.values ? data.data.values : []
}

const clearSheet = async (sheets, {spreadsheetId, range}) => {
  const response = await sheets.spreadsheets.values.clear({spreadsheetId, range})
  return response
}

const addSheet = async (sheets, {spreadsheetId, range, valueInputOption, resource}) => {
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption,
    resource
  });
  return response
}

const mergeData = (queryData, sheetData) => {
  if(!sheetData.length) return queryData
  const result = queryData.map(d => {
    // compare object name and column name
    const row = sheetData.find(e => e[1] === d[1] && e[2] === d[2])
    if(row){
      d[6] = row[6] // description
      d[7] = row[7] // pic
    }
    return d
  })
  return result
}

module.exports = {
  exportSchemaToGoogleSheet
}