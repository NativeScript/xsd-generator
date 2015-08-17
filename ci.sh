#!/usr/bin/env bash
set -e

npm install

nbin () {
    PATH="$PATH:node_modules/.bin" "$@"
}

nbin tsd reinstall

rm -rf dist
mkdir dist

nbin gulp
nbin mocha dist/tests/*.js

#build machine /tns-dist/tns-modules/Stable
NSPACKAGE_DIR=${1:-../nativescript/bin/dist}
echo "NSPACKAGE_DIR: $NSPACKAGE_DIR"
DEFINITIONS_PACKAGE=$(find $NSPACKAGE_DIR -maxdepth 1 -iname 'tns-definitions*.tgz')
echo $DEFINITIONS_PACKAGE
localinputsdir=theinputs

tar -xzvf "$DEFINITIONS_PACKAGE"
rm -rf $localinputsdir
mv package $localinputsdir

node dist/bin/generate-xsd.js -r ./theinputs -o ./schema.xsd

rm -rf $localinputsdir

./validate.sh
