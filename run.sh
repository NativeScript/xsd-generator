#! /bin/bash

rm -rf dist
mkdir dist
gulp

executable=node
mochadebug=
if [ "$1" == '--debug' ] ; then
    executable=node-debug
    mochadebug=--debug
fi

node_modules/mocha/bin/mocha $mochadebug dist/tests/*.js

nsrepodir=/Users/erjan/work/github/nativescript/nativescript
packagename=tns-definitions-1.2.0.tgz
localinputsdir=theinputs
#(cd $nsrepodir && grunt --runtslint=false)
cp $nsrepodir/bin/dist/$packagename .
tar -xzvf $packagename
rm $packagename
rm -rf $localinputsdir
mv package $localinputsdir

$executable dist/bin/generate-xsd.js -r ./theinputs -o ./schema.xsd

rm -rf $localinputsdir

