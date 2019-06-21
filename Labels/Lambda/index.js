
var fs = require('fs');
var helpers = require('./helpers.js');
var AWS = require('aws-sdk');
var pdfDocument = require('pdfkit');
var XLSX = require('xlsx');

exports.handler =  function(event, context, callback) {

    let averyTemplate = event["queryStringParameters"]['avery'];
    let numLabelsPerMove = event["queryStringParameters"]['numLabels'];

    console.log("Avery: " + averyTemplate + " Labels: " + numLabelsPerMove);
    //console.log("Body: " + event.body);

    let uuid = helpers.generateUUID();

    var workbook = XLSX.read(event.body, {type:'base64'});

    const pdf = new pdfDocument({margins: {
        top: 36,
        bottom: 36,
        left: 14,
        right: 14
    }});

    if(averyTemplate == '94200') {
        pdf.fontSize(22);
    }

    fs.mkdirSync('/tmp/' + uuid);
    let fileStream = fs.createWriteStream('/tmp/' + uuid + '/avery.pdf');

    pdf.pipe(fileStream);
    
    let result = helpers.GenerateAveryPdf(averyTemplate, numLabelsPerMove, pdf, workbook);
    if(result == -1) {

        console.log("Moves XLSX is malformed");

        var obj = { "Status" : "Error", "Message" : "Malformed moves file, please review."};

        var jsonString = JSON.stringify(obj);

        const response = {
            'isBase64Encoded' : false,
            'statusCode' : 200,
            'body' : jsonString,
            'headers' : {'Access-Control-Allow-Origin' : '*' , 'Content-Type' : 'application/json'}
        };

        fs.unlinkSync('/tmp/' + uuid + '/avery.pdf');
        fs.rmdirSync('/tmp/' + uuid);

        callback(null, response);

    }

    fileStream.on('close', function() {

        let s3 = new AWS.S3();

        var params = {
            Bucket : 'storage.officespacepowertools.com',
            Key : uuid + '/' + averyTemplate + '-avery-labels.pdf',
            Body : fs.createReadStream('/tmp/' + uuid + '/avery.pdf'),
        };

        s3.putObject(params, function(err, data) {
            
            if (err) {

                console.log("Error writing to S3: " + err);

                const response = {
                    'isBase64Encoded' : false,
                    'statusCode' : 500,
                    'body' : err,
                    'headers' : {'Access-Control-Allow-Origin' : '*' , 'Content-Type' : 'application/json'}
                };

                fs.unlinkSync('/tmp/' + uuid + '/avery.pdf');
                fs.rmdirSync('/tmp/' + uuid);
                
                callback(err, response);

            } else {

                console.log("Success writing to S3: " + data);

                var url = 'https://s3.amazonaws.com/storage.officespacepowertools.com/' + uuid + '/' + averyTemplate + '-avery-labels.pdf'
                var obj = { "Status" : "Success", "Url" : url };
                var jsonString = JSON.stringify(obj);

                const response = {
                    'isBase64Encoded' : false,
                    'statusCode' : 200,
                    'body' : jsonString,
                    'headers' : {'Access-Control-Allow-Origin' : '*' , 'Content-Type' : 'application/json'}
                };

                fs.unlinkSync('/tmp/' + uuid + '/avery.pdf');
                fs.rmdirSync('/tmp/' + uuid);

                callback(null, response);
            
            }
        });

    });

    
};