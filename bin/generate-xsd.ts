﻿import {writeFileSync} from "fs";
import {InputHandler, Input} from "../lib/input";
import * as ts from "typescript";
import {FileWalker} from "../lib/file-walker";
import {JsonXsdWriter} from "../lib/json-xsd-writer";
import {ViewExtendersFilter} from "../lib/view-extenders-filter";
import {ActionBarFilter} from "../lib/actionbar-filter";

//--------------------------------

function main() {
    var inputHandler = new InputHandler(process.argv);
    var input:Input = inputHandler.getInput();

    var fileWalker = new FileWalker(input.root, input.apiFiles);
    var theTree = fileWalker.buildTree([
        new ActionBarFilter(),
        new ViewExtendersFilter(),
    ]);

    var theWriter = new JsonXsdWriter(input.version);
    var rootProps = new Map<string, string>([["id", "tns"],
                             ["xmlns:xs", "http://www.w3.org/2001/XMLSchema"],
                             ["targetNamespace", "http://schemas.nativescript.org/tns.xsd"],
                             ["xmlns", "http://schemas.nativescript.org/tns.xsd"],
                             ["elementFormDefault", "qualified"],
                             ["attributeFormDefault", "unqualified"]]);
    var content = theWriter.parse("xs:schema", theTree, rootProps);
    writeFileSync(input.outFilePath, content);
}

main();

console.log("Done.");
