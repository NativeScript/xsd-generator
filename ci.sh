#!/usr/bin/env bash
set -e

npm install

nbin () {
    PATH="$PATH:node_modules/.bin" "$@"
}

NSPACKAGE_DIR=${1:-../nativescript/bin/dist}
DEFINITIONS_PACKAGE=$(find $NSPACKAGE_DIR -maxdepth 1 -iname 'tns-core-modules*.tgz')
echo $DEFINITIONS_PACKAGE
export DEFINITIONS_DIR="./theinputs"
resultfile=./tns.xsd

tar -xzvf "$DEFINITIONS_PACKAGE"
rm -rf $DEFINITIONS_DIR
mv package $DEFINITIONS_DIR

nbin tsd reinstall

rm -rf dist
mkdir dist

nbin gulp
nbin mocha dist/tests/*.js

node dist/bin/generate-xsd.js -r ./theinputs -o $resultfile

./validate.sh

npmpackagedir=NpmPackage
xsdpackagejson=./xsdpackage.json
rm -rf $npmpackagedir
mkdir $npmpackagedir
cp $xsdpackagejson $npmpackagedir/package.json
cp $resultfile $npmpackagedir
gulp update-target-package-json
(cd $npmpackagedir && npm pack)
cp $npmpackagedir/*.tgz .
rm -rf $npmpackagedir
