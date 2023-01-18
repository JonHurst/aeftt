#!/bin/bash

PROD_TARGET=s3://aeftt.hursts.org.uk
STAGING_TARGET=s3://aeftt-staging.hursts.org.uk
if [ "$1" == "--prod" ]
then
    TARGET="${PROD_TARGET}"
    echo "Deploying to production"
else
    TARGET="${STAGING_TARGET}"
    echo "Deploying to staging. Use --prod to deploy to production."
fi

s3cmd del -r --force "${TARGET}"
s3cmd put -r --add-header='Cache-Control:no-cache' \
      --no-mime-magic --guess-mime-type \
      aeftt.html \
      icon-180x180.png icon-192.png icon.svg \
      script.js scenarios.js sw.js modules \
      styles.css \
      aeftt.webmanifest \
      version.json \
      ${TARGET}
