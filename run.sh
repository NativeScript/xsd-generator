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

export NSREPO=${NSREPO:-/Users/erjan/work/github/nativescript/nativescript}
echo "NSREPO=$NSREPO"
NSPACKAGE=tns-core-modules-1.5.0.tgz
PACKAGEDIR=node_modules/tns-core-modules

build() {
    (cd "$NSREPO" && \
        npm install && \
        grunt --runtslint=false --test-app-only)
}

if [ ! -z "$REBUILD" ] ; then
    build
fi

npm install "$NSREPO/bin/dist/$NSPACKAGE"

# Execute the compilation AFTER we have the source files copied so that
#   the package.json file exists!
gulp
node_modules/mocha/bin/mocha $mochadebug dist/tests/*.js

#$NODE dist/bin/generate-xsd.js -r $PACKAGEDIR -o ./tns.xsd

#./validate.sh
