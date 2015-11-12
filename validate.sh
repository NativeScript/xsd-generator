#! /bin/bash

file=./to-validate.xml

xmllint --schema tns.xsd $file
