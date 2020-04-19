
const express = require('express')
const cron = require('node-cron')
const sheetController = require('./controllers/SheetController')
const connection = require('./config/connection')
const port = 3000
const app = express()
const RUN_AT_12AM = '1 0 0 * * *'
const databaseSchema = 'dbo'
// sheetController.exportSchemaToGoogleSheet(databaseSchema, connection.postgresqlConnection)
cron.schedule(RUN_AT_12AM, function(){
  console.log('Running database documenting cronjob ')
  sheetController.exportSchemaToGoogleSheet(databaseSchema, connection.mssqlConnection)
  // sheet.exportSchemaToGoogleSheet(databaseSchema, connection.postgresqlConnection)
})

app.get('/', (req, res) => res.send('Document Cronjob Example'))

app.listen(port, () => console.log(`App is listening at http://localhost:${port}`))