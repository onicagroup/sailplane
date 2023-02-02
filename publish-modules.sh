#!/bin/sh

DIST=$1
if [[ ! -d $DIST ]]
then
    echo "Create module specific package.json files in distribution directory"
    echo "Usage: publish-modules.sh <dist-directory>"
    exit 1
fi

echo '{ "type": "commonjs" }' > $DIST/cjs/package.json
echo '{ "type": "module" }' > $DIST/esm/package.json

exit 0
