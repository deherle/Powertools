
var XLSX = require('xlsx');
var fs = require('fs');
var pdfDocument = require('pdfkit');
var AWS = require('aws-sdk');

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// These are global variables so be careful! They hang around in memory between successive calls to the Lambda function, and 
// need to be initialized properly.
let currentLabelPerMoveCount;
let currentSheetRow; // Current row in XLSX sheet, moves start at Row 6


exports.GenerateAveryPdf = function (averyTemplate, labelsPerMove, pdf, workbook) {

    let numLabelRows;
    let numLabelColumns;

    if(averyTemplate == '5160') {
        numLabelRows = 10;
        numLabelColumns = 3;
    } else {
        numLabelRows = 5;
        numLabelColumns = 2;
    }

    let columnHeaderRow = 4; // 0-based sheet row that holds all the column header values, we'll search through these

    let sheetNameColumn = getSheetColumn(workbook, columnHeaderRow, 'Employee');
    if(sheetNameColumn == -1) {
        return -1;
    }

    let sheetToSeatColumn = getSheetColumn(workbook, columnHeaderRow, 'To Seat');
    if(sheetToSeatColumn == -1) {
        return -1;
    }

    let sheetToFloorColumn = getSheetColumn(workbook, columnHeaderRow, 'To Floor');
    if(sheetToFloorColumn == -1) {
        return -1;
    }

    let sheetMoveTypeColumn = getSheetColumn(workbook, columnHeaderRow, 'Move Type');
    if(sheetMoveTypeColumn == -1) {
        return -1;
    }

    let finishedParsing = false;
    let labelsRendered = 0;
    currentSheetRow = 5;  // 0-based sheet row to start looking for moves, standard XLSX sheet has this in Row 6
    currentLabelPerMoveCount = labelsPerMove;

    pdf.x = 40;
    pdf.y = 55;

    do {

        for(let row = 0 ; row < numLabelRows ; row++) {

            for(let column = 0 ; column < numLabelColumns ; column++) {

                let labelEntry = getNextLabelEntry(workbook, sheetMoveTypeColumn, sheetNameColumn, sheetToSeatColumn, sheetToFloorColumn, labelsPerMove);

                console.log("Current sheet row we're pulling from: " + currentSheetRow);

                if(labelEntry == -1) {
                    console.log("Finished parsing!");
                    finishedParsing = true;
                    break;
                }
            
                pdf.text(labelEntry.name);
                pdf.text('Seat ' + labelEntry.toseat);
                pdf.text(labelEntry.tofloor);

                labelsRendered++;

                console.log("Name: " + labelEntry.name + " Seat: " + labelEntry.toseat + " Floor: " + labelEntry.tofloor);
                console.log("Labels rendered: " + labelsRendered);
                
                if(averyTemplate == '5160') {
                    pdf.x += 195;
                } else {
                    pdf.x += 290;
                }
                pdf.moveUp();
                pdf.moveUp();
                pdf.moveUp();
            
            }

            if(finishedParsing == true) {
                break;
            }

            pdf.x = 40;
            pdf.moveDown();
            pdf.moveDown();
            pdf.moveDown();
            pdf.moveDown();
            pdf.moveDown();
            
            if(averyTemplate == '94200') {
                pdf.moveDown(); 
            }


        }

        if(!finishedParsing) {
            
            // Add a new page 
            pdf.addPage();
            pdf.x = 40;
            pdf.y = 55;

            console.log("Adding a new page!");

        }

    } while(!finishedParsing);

    /*
    var date = workbook.Sheets['Raw Data']['D6'];
    var time = workbook.Sheets['Raw Data']['E6'];
    var name = workbook.Sheets['Raw Data']['F6'];
    var department = workbook.Sheets['Raw Data']['G6'];
    var fromSeat = workbook.Sheets['Raw Data']['I6'];
    var fromFloor = workbook.Sheets['Raw Data']['J6'];
    var toSeat = workbook.Sheets['Raw Data']['K6'];
    var toFloor = workbook.Sheets['Raw Data']['L6'];
    */

    console.log("Finished parsing worksheet, writing PDF.");

    pdf.end();

};

exports.generateUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

function getNextLabelEntry(workbook, sheetMoveTypeColumn, sheetNameColumn, sheetToSeatColumn, sheetToFloorColumn, labelsPerMove) {

    let labelEntry;

    if(currentLabelPerMoveCount == 0) {
        currentSheetRow++;
        currentLabelPerMoveCount = labelsPerMove - 1;
    } else {
        currentLabelPerMoveCount--;
    }

    getNextValidMoveRow(workbook, sheetMoveTypeColumn);
    if(currentSheetRow == -1) { 
        return -1;
    }

    let cellAddress = {c:sheetNameColumn, r:currentSheetRow};
    let cell_ref = XLSX.utils.encode_cell(cellAddress);
    let name = workbook.Sheets['Raw Data'][cell_ref];

    cellAddress = {c:sheetToSeatColumn, r:currentSheetRow};
    cell_ref = XLSX.utils.encode_cell(cellAddress);
    let toSeat = workbook.Sheets['Raw Data'][cell_ref];

    cellAddress = {c:sheetToFloorColumn, r:currentSheetRow};
    cell_ref = XLSX.utils.encode_cell(cellAddress);
    let toFloor = workbook.Sheets['Raw Data'][cell_ref];

    labelEntry = { "name" : name.v, "toseat" : toSeat.v, "tofloor" : toFloor.v};

    return labelEntry;

}

function getNextValidMoveRow(workbook, sheetMoveTypeColumn) {

    do {

        var cellAddress = {c:sheetMoveTypeColumn, r:currentSheetRow};
        var cell_ref = XLSX.utils.encode_cell(cellAddress);
        var moveType = workbook.Sheets['Raw Data'][cell_ref];
        
        if(moveType) {

            console.log("Move type: " + moveType.v);

            if(moveType.v == 'From - To') {

                console.log("Current move row: " + currentSheetRow);
                return;

            } else {
                
                currentSheetRow++;
                continue;
            
            }
        }
        else {
            currentSheetRow = -1;
            return;
        }
        
    } while(1)

}

function getSheetColumn(workbook, columnHeaderRow, columnNameToMatch) {

    var finishedParsing = false;
    var columnName, C = 0;

    do {

        var cellAddress = {c:C, r:columnHeaderRow};
        var cell_ref = XLSX.utils.encode_cell(cellAddress);
        columnName = workbook.Sheets['Raw Data'][cell_ref];

        if(columnName) {
            if(columnName.v == columnNameToMatch) {
                return C;
            } else {
                C++;
            }
        } else {
            return -1;
        }

    } while(!finishedParsing);


}