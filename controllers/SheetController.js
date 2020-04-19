const database = require('../database/database')
const keys = require('../credentials.json')
const {google} = require('googleapis')
const fs = require('fs')
const scopes = ['https://www.googleapis.com/auth/spreadsheets'] // write and read
const spreadsheetId = '1JoRTc_FyiGM51lO3xTaTyLOD1-TiEqlm91go8U7pp3A'
const protectedRangeIdsFile = 'protectedRangeIds.json'
const range = 'Sheet1'
const exportSchemaToGoogleSheet = async (schema, dbConfig) => {
  try {
  const client = await getAuthorizeClient(keys.client_email,keys.private_key, scopes)
  const sheets = google.sheets({version: 'v4', auth: client})
  const data = await getSheetData(sheets, {spreadsheetId, range})  
  const result = await database.getTables(schema, dbConfig)
  const queryData = result.map(r => Object.values(r))
  const mergeResult = mergeData(queryData, data)
  const headers = ['Object Type', 'Object Name', 'Column Name', 'Data Type', 'Nullable', 'MiscInfo','Description','PIC']
  const values = [headers, ...mergeResult]
  const resource = {values}
  await clearSheet(sheets, {spreadsheetId, range})
  await addSheet(sheets, {spreadsheetId, range, valueInputOption: 'USER_ENTERED', resource})
  const currentProtectedRangeIds = JSON.parse(await readJsonFromFile(protectedRangeIdsFile))
  if(currentProtectedRangeIds.length){
    const batchDeleteObjects = currentProtectedRangeIds.map(r => {
      const request = generateRemoveProtectedRangeRequest(r.protectedRangeId)
      return request
    })
    const batchDeleteRequest = {requests:batchDeleteObjects}
    await updateBatch(sheets, {spreadsheetId, resource: batchDeleteRequest})
  }  
  const headerProtectedRangeRequest = generateProtectedRangeRequest({
    sheetId: 0, 
    startRowIndex:0,
    endRowIndex: 1,
    startColumnIndex: 0,
    endColumnIndex: headers.length - 2,
    description: 'Protecting Headers',
    clientEmail: keys.client_email
  })
  const dataProtectedRangeRequest = generateProtectedRangeRequest({
    sheetId: 0, 
    startRowIndex:1,
    endRowIndex: mergeResult.length + 1,
    startColumnIndex: 0,
    endColumnIndex: 6,
    description: 'Protecting Uneditable Data',
    clientEmail: keys.client_email
  })
  const batchUpdateRequest = {requests:[{...headerProtectedRangeRequest}, {...dataProtectedRangeRequest}]}
  const batchUpdateResponse = await updateBatch(sheets, {spreadsheetId, resource: batchUpdateRequest})
  const protectedRangeIds = batchUpdateResponse.data.replies.map(reply => {
   const result = { protectedRangeId : reply.addProtectedRange.protectedRange.protectedRangeId}
   return result;
  })
  const saveFileResponse = await saveDataToJsonFile(protectedRangeIds, protectedRangeIdsFile)
  return saveFileResponse
  // return response
  } catch (error) {
    console.log(error)
  }
}

const getAuthorizeClient = (clientEmail, privateKey, scopes) => {  
  return new Promise((resolve, reject) => {
    const client = new google.auth.JWT(clientEmail,null,privateKey, scopes)
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

// merge sheet data to query data and keep user's manual input
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

const generateProtectedRangeRequest = ({sheetId, startRowIndex, endRowIndex, startColumnIndex, endColumnIndex, clientEmail, description}) => {
  const request = {
    addProtectedRange: {
      protectedRange: {
        range: {
          sheetId,
          startRowIndex,
          endRowIndex,
          startColumnIndex,
          endColumnIndex,
        },
        description:  description,
        warningOnly: false,
        editors: {
          users: [clientEmail]
        }
      }
    }
  }
  return request
}

const generateRemoveProtectedRangeRequest = (protectedRangeId) => {
  const request = {
    deleteProtectedRange : {
      protectedRangeId: protectedRangeId + ''
    }
  }
  return request
}

const updateBatch = async (sheets, {spreadsheetId, resource}) => {
  const response = await sheets.spreadsheets.batchUpdate({spreadsheetId, resource})
  return response
}

const saveDataToJsonFile = (data, fileName) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(data) , 'utf-8',(err, data) => {
      if(err) reject(err)
      resolve(data)
    })
  })
}

const readJsonFromFile = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf-8',(err, data) => {
      if(err) reject(err)
      if(!data) resolve('[]')
      resolve(data)      
    })
  })
}


// exportSchemaToGoogleSheet('dbo', config.mssqlConnection)
module.exports = {
  exportSchemaToGoogleSheet,
  readJsonFromFile,
  saveDataToJsonFile,
  updateBatch,
  generateProtectedRangeRequest,
  generateRemoveProtectedRangeRequest,
  mergeData,
  addSheet,
  getAuthorizeClient,
  getSheetData,
  clearSheet
}