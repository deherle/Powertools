aws s3 sync images s3://test.gorunway.co/images
aws s3 sync css s3://test.gorunway.co/css
aws s3 sync js s3://test.gorunway.co/js
aws s3 sync . s3://test.gorunway.co --exclude "*" --include "index.html"
aws s3 sync . s3://test.gorunway.co --exclude "*" --include "favicon.ico"
aws s3 sync . s3://test.gorunway.co --exclude "*" --include "signin.html"
aws s3 sync . s3://test.gorunway.co --exclude "*" --include "signup.html"