//replace the variables in this block with real values as needed
var address = 'my.server.address:port';
var user = 'SQL_GATEWAY_USER';
var userPwd = 'SQL_GATEWAY_PASSWORD';
var db = 'CData MongoDB Sys';
 
var dbUrl = 'jdbc:mysql://' + address + '/' + db;
 
function onOpen() {
var spreadsheet = SpreadsheetApp.getActive();
var menuItems = [
{name: 'Write table data to a sheet', functionName: 'connectToMongoDBData'}
];
spreadsheet.addMenu('MongoDB Data', menuItems);
}
 
/*
* Finds the first empty row in a spreadsheet by scanning an array of columns
* @return The row number of the first empty row.
*/
function getFirstEmptyRowByColumnArray(spreadSheet, column) {
var column = spreadSheet.getRange(column + ":" + column);
var values = column.getValues(); // get all data in one call
var ct = 0;
while ( values[ct] && values[ct][0] != "" ) {
ct++;
}
return (ct+1);
}
 
/*
* Reads data from a specified 'table' and writes it to the specified sheet.
*    (If the specified sheet does not exist, it is created.)
*/
function connectToMongoDBData() {
var thisWorkbook = SpreadsheetApp.getActive();
 
//select a sheet and create it if it does not exist
var selectedSheet = Browser.inputBox('Which sheet would you like the data to post to?',Browser.Buttons.OK_CANCEL);
if (selectedSheet == 'cancel')
return;
 
if (thisWorkbook.getSheetByName(selectedSheet) == null)
thisWorkbook.insertSheet(selectedSheet);
var resultSheet = thisWorkbook.getSheetByName(selectedSheet);
var rowNum = 2;
 
//select a MongoDB 'table'
var table = Browser.inputBox('Which table would you like to pull data from?',Browser.Buttons.OK_CANCEL);
if (table == 'cancel')
return;
 
var conn = Jdbc.getConnection(dbUrl, user, userPwd);
 
//confirm that var table is a valid table/view
var dbMetaData = conn.getMetaData();
var tableSet = dbMetaData.getTables(null, null, table, null);
var validTable = false;
while (tableSet.next()) {
var tempTable = tableSet.getString(3);
if (table.toUpperCase() == tempTable.toUpperCase()){
table = tempTable;
validTable = true;
break;
}
}
tableSet.close();
if (!validTable) {
Browser.msgBox("Invalid table name: " + table, Browser.Buttons.OK);
return;
}
 
var stmt = conn.createStatement();
 
var results = stmt.executeQuery('SELECT * FROM ' + table);
var rsmd = results.getMetaData();
var numCols = rsmd.getColumnCount();
 
//if the sheet is empty, populate the first row with the headers
var firstEmptyRow = getFirstEmptyRowByColumnArray(resultSheet, "A");
if (firstEmptyRow == 1) {
//collect column names
var headers = new Array(new Array(numCols));
for (var col = 0; col < numCols; col++){
headers[0][col] = rsmd.getColumnName(col+1);
}
resultSheet.getRange(1, 1, headers.length, headers[0].length).setValues(headers);
} else {
rowNum = firstEmptyRow;
}
 
//write rows of MongoDB data to the sheet
var values = new Array(new Array(numCols));
while (results.next()) {
for (var col = 0; col < numCols; col++) {
values[0][col] = results.getString(col + 1);
}
resultSheet.getRange(rowNum, 1, 1, numCols).setValues(values);
rowNum++;
}
 
results.close();
stmt.close();
}