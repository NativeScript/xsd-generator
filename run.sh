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

if [ -f "$NSREPO/"$NSPACKAGEBASE*.tgz ] ; then
    echo "Found tns-core-modules in root dir."
    npm install "$NSREPO/"$NSPACKAGEBASE*.tgz
else
    echo "Found tns-core-modules in bin/dist"
    npm install "$NSREPO/bin/dist/"$NSPACKAGEBASE*.tgz
fi

# Execute the compilation AFTER we have the source files copied so that
#   the package.json file exists!
gulp

node_modules/mocha/bin/mocha $mochadebug dist/tests/*.js

$NODE dist/bin/generate-xsd.js -r $PACKAGEDIR -o ./tns.xsd

./validate.sh
