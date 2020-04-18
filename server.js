
const express = require('express')
const cron = require('node-cron')
const sheet = require('./sheet')
const port = 3000
const app = express()
const RUN_AT_12AM = '1 0 0 * * *'
const databaseSchema = 'Demo'
cron.schedule(RUN_AT_12AM, function(){
  console.log('Running database documenting cronjob ')
  sheet.appendSchemasToSheet(databaseSchema)
})

app.get('/', (req, res) => res.send('Document Cronjob Example'))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))