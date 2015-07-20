import {writeFileSync} from "fs";
import {InputHandler, Input} from "../lib/input";
import * as ts from "typescript";
import {FileWalker} from "../lib/file-walker";
import {JsonXsdWriter} from "../lib/json-xsd-writer";
import {ViewExtendersFilter} from "../lib/view-extenders-filter";

//--------------------------------

function main() {
    var inputHandler = new InputHandler(process.argv);
    var input:Input = inputHandler.getInput();

    var fileWalker = new FileWalker(input.root, input.apiFiles);
    var theTree = fileWalker.buildTree([new ViewExtendersFilter()]);

    var theWriter = new JsonXsdWriter();
    var rootProps = new Map([["id", "tns"],
                             ["xmlns:xs", "http://www.w3.org/2001/XMLSchema"],
                             ["targetNamespace", "http://www.nativescript.org/tns.xsd"],
                             ["xmlns", "http://www.nativescript.org/tns.xsd"],
                             ["elementFormDefault", "qualified"],
                             ["attributeFormDefault", "unqualified"]]);
    var content = theWriter.parse("xs:schema", theTree, rootProps);
    writeFileSync(input.outFilePath, content);
}

main();

console.log("Done.");
