aws s3 sync images s3://officespacepowertools.com/images --acl public-read --profile Powertools
aws s3 sync css s3://officespacepowertools.com/css --acl public-read --profile Powertools
aws s3 sync js s3://officespacepowertools.com/js --acl public-read --profile Powertools
aws s3 sync . s3://officespacepowertools.com --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers --exclude "*" --include "home.html" --profile Powertools
aws s3 sync . s3://officespacepowertools.com --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers --exclude "*" --include "favicon.ico" --profile Powertools
aws s3 sync . s3://officespacepowertools.com --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers --exclude "*" --include "labels.html" --profile Powertools