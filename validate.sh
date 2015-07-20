#! /bin/bash

file=./to-validate.xml

xmllint --schema schema.xsd $file
