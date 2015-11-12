#! /bin/bash

rm -rf dist
mkdir dist

executable=node
mochadebug=
if [ "$1" == '--debug' ] ; then
    executable=node-debug
    mochadebug=--debug
fi

nsrepodir=/Users/erjan/work/github/nativescript/nativescript
packagename=tns-core-modules-1.5.0.tgz
localinputsdir=theinputs

#(cd $nsrepodir && grunt --runtslint=false)
cp $nsrepodir/bin/dist/$packagename .
tar -xzvf $packagename
rm $packagename
rm -rf $localinputsdir
mv package $localinputsdir

# Execute the compilation AFTER we have the source files copied so that
#   the package.json file exists!
gulp
node_modules/mocha/bin/mocha $mochadebug dist/tests/*.js

$executable dist/bin/generate-xsd.js -r ./theinputs -o ./tns.xsd

rm -rf $localinputsdir

./validate.sh
