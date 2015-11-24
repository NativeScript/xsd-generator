#!/bin/bash

set -e

rm -rf dist
mkdir dist

NODE=node
mochadebug=
if [ "$1" == '--debug' ] ; then
    NODE=node-debug
    mochadebug=--debug
fi

export NSREPO=${NSREPO:-../nativescript}
echo "NSREPO=$NSREPO"
NSPACKAGEBASE=tns-core-modules
PACKAGEDIR=node_modules/tns-core-modules

build() {
    (cd "$NSREPO" && \
        npm install && \
        grunt --runtslint=false --test-app-only)
}

if [ ! -z "$REBUILD" ] ; then
    build
fi

npm install "$NSREPO/bin/dist/"$NSPACKAGEBASE*.tgz

# Execute the compilation AFTER we have the source files copied so that
#   the package.json file exists!
gulp

node_modules/mocha/bin/mocha $mochadebug dist/tests/*.js

$NODE dist/bin/generate-xsd.js -r $PACKAGEDIR -o ./tns.xsd

./validate.sh
