#!/usr/bin/env bash
set -e

npm install

nbin () {
    PATH="$PATH:node_modules/.bin" "$@"
}

nbin tsd reinstall

export NSREPO=${1:-../nativescript}
export REBUILD=true

./run.sh

# build the tns-core-modules-xsd-schema package
npmpackagedir=NpmPackage
xsdpackagejson=./xsdpackage.json
resultfile=./tns.xsd

rm -rf $npmpackagedir
mkdir $npmpackagedir
cp $xsdpackagejson $npmpackagedir/package.json
cp $resultfile $npmpackagedir

gulp update-target-package-json

(cd $npmpackagedir && npm pack)
cp $npmpackagedir/*.tgz .
rm -rf $npmpackagedir
