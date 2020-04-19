const chai = require('chai')
// const fs = require('fs')
var expect = require('chai').expect;
const chaiAsPromised = require('chai-as-promised');
const sheetControllers = require('../controllers/SheetController')
const {google} = require('googleapis')
const keys = require('../credentials.json')
const scopes = ['https://www.googleapis.com/auth/spreadsheets']
const spreadsheetId = '11gWz2NX-rHd3nQCxliNziBbumyMIDIXG5L00KKc_4gk'
const range = 'Sheet1'
chai.use(chaiAsPromised).should();

describe('Add tables to Google Sheet Test', function () {
    it('getAuthorizeClient', () => {        
           return sheetControllers.getAuthorizeClient(keys.client_email,keys.private_key, scopes).should.be.fulfilled
       });
    it('getSheetData', async () => {
         const client = await sheetControllers.getAuthorizeClient(keys.client_email,keys.private_key, scopes)
         const sheets = google.sheets({version: 'v4', auth: client})
         return sheetControllers.getSheetData(sheets, {spreadsheetId, range}).should.eventually.instanceOf(Array)
       });
    it('clearSheet', async () => {
        const client = await sheetControllers.getAuthorizeClient(keys.client_email,keys.private_key, scopes)
        const sheets = google.sheets({version: 'v4', auth: client})
        return sheetControllers.clearSheet(sheets, {spreadsheetId, range}).should.eventually.have.property('status').equal(200)
    });
    it('addSheet', async () => {
        const client = await sheetControllers.getAuthorizeClient(keys.client_email,keys.private_key, scopes)
        const sheets = google.sheets({version: 'v4', auth: client})
        const resource = {values : [['1','2','3','4']]}
        sheetControllers.addSheet(sheets, {spreadsheetId, range, valueInputOption: 'USER_ENTERED', resource})
        .should.eventually.have.have.property('status').equal(200)
    });
    it('mergeData', () => {
        const queryData = [
            [1,2,3,4,5,5],        
            [2,5,3,1,7,2],
            [6,4,5,4,2,1],
          ]
        const sheetData = [
            [1,2,3,4,5,5,7,7],
            [2,5,3,1,7,2],
            [6,6,3,4,2,6],
            [6,4,5,4,2,1,3,7],
        ]
        const result = sheetControllers.mergeData(queryData, sheetData)
        expect(result.length).is.equal(3)
        expect(result[2][6]).is.equal(3)
        expect(result[2][7]).is.equal(7)
        
    });
    it('generateProtectedRangeRequest',() => {
        const rangeParameters = {
            sheetId: 0, 
            startRowIndex:0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 4,            
          }
          const description = 'test description'
          const clientEmail = 'test@gmail.com'
        const requestObj = sheetControllers.generateProtectedRangeRequest({...rangeParameters,description,clientEmail})
        expect(JSON.stringify(requestObj.addProtectedRange.protectedRange.range)).is.equal(JSON.stringify(rangeParameters))
        expect(requestObj.addProtectedRange.protectedRange.description).is.equal(description)
        expect(JSON.stringify(requestObj.addProtectedRange.protectedRange.editors.users)).is.equal(JSON.stringify([clientEmail]))
    });
    it('generateRemoveProtectedRangeRequest', () => {
        const id = 11111
        const requestObj = sheetControllers.generateRemoveProtectedRangeRequest(id)
        expect(requestObj.deleteProtectedRange.protectedRangeId).equal(id.toString())
    });

    it('saveDataToJsonFile', async () => {
        const testFilePath = './test/test-write-file.json'
        const testData = [{name: 'James', age: '15'}, {name: 'Minh', age: '21'}]        
        return sheetControllers.saveDataToJsonFile(testData,testFilePath).should.eventually.fulfilled
        // fs.unlink(`./test/${testFile}`)
    });
    it('readJsonFromFile', async () => {
        const testFilePath = './test/test-read-file.json'
        return sheetControllers.readJsonFromFile(testFilePath).should.eventually.fulfilled
    });
    it('updateBatch', async () => {
        const requests = [{
            updateSpreadsheetProperties: {
                properties: {"title": "Update Batch Test Title"},
                fields: 'title'
            }
        }]
        const client = await sheetControllers.getAuthorizeClient(keys.client_email,keys.private_key, scopes)
        const sheets = google.sheets({version: 'v4', auth: client})
        sheetControllers.updateBatch(sheets, {spreadsheetId, resource: {requests}}).should.eventually.have.property('status').equal(200)
    });
});