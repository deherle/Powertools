Lambda layers need to be created in order to add library code in node_modules to a Lambda function

---> The directory structure for the .zip is important, must be nodejs/node_modules/...



bestzip lambdaPkg.zip nodejs

aws lambda publish-layer-version --layer-name CreateLabelsLayer --description "Library containing XLSX read and PDF write libraries" --content S3Bucket=lambda.officespacepowertools.com,S3Key=layerPkg.zip --profile Powertools --region us-east-1

aws lambda update-function-configuration --function-name convertMovesXlsxToPDF --layers arn:aws:lambda:us-east-1:093587373966:layer:CreateLabelsLayer:2 --profile Powertools --region us-east-1



bestzip lambdaPkg.zip index.js helpers.js

aws lambda update-function-code --function-name convertMovesXlsxToPDF --zip-file fileb://lambdaPkg.zip --profile Powertools --region us-east-1
