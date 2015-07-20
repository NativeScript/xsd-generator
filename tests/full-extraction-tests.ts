import * as should from "should";
import {join as pathJoin} from "path";
import {existsSync as fsExists} from "fs";
import {Type, Class, Tree} from "../lib/lang-elements";
import {FileWalker} from "../lib/file-walker";
import {InputHandler,Input} from "../lib/input";
import {JsonXsdWriter} from "../lib/json-xsd-writer";
import {ViewExtendersFilter} from "../lib/view-extenders-filter";
import {parseString} from "xml2js";


// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("Walking and outputting", () => {
    var fileWalker: FileWalker;
    var allInput: Input = null;
    before(() => {
        var inputHandler = new InputHandler([]);
        inputHandler.argsResolve = (rawArguments) => {
            return {
                i: [],
                f: [],
                o: "schema.xsd",
                r: "tests/resources"
            };
        };
        allInput = inputHandler.getInput();
        fileWalker = new FileWalker(allInput.root, allInput.apiFiles);
    });

    var adjustPropertyTypeNames = function(classes: Class[]) {
        classes.forEach((_class) => {
            _class.properties.forEach((prop) => {
                if (prop.type.fullName === "color") {
                    prop.type._fullName = '"color".Color';
                }
                if (prop.type.fullName === "layoutModule") {
                    prop.type._fullName = '"ui/layouts/layout".Layout';
                }
                if (prop.type.fullName === "formattedString") {
                    prop.type._fullName = '"text/formatted-string".FormattedString';
                }
            });
        });
    }

    describe("all test files", () => {
        it("should declare BindingValidator", () => {
            var tree = fileWalker.buildTree([new ViewExtendersFilter()]);

            adjustPropertyTypeNames(tree.Classes);

            var writer = new JsonXsdWriter();
            var content = writer.parse("someRoot", tree);

            content.should.match(/.*<xs:simpleType name="BindingValidator">.*/);
        });
        it("should declare each Validator only once", (done) => {
            var tree = fileWalker.buildTree([new ViewExtendersFilter()]);

            adjustPropertyTypeNames(tree.Classes);

            var writer = new JsonXsdWriter();
            var content = writer.parse("someRoot", tree);

            parseString(content, (err, data) => {
                data.someRoot["xs:simpleType"].forEach((searchedValidator) => {
                    var searchedValidatorInstances = data.someRoot["xs:simpleType"].filter((validator) => {
                        if (validator["$"].name === searchedValidator["$"].name) {
                            return true;
                        }
                        return false;
                    });
                    searchedValidatorInstances.length.should.eql(1);
                });
                done();
            });
        });
        it("should render the attribute group tag inside the <xs:extension> tag", (done) => {
            var tree = fileWalker.buildTree([new ViewExtendersFilter()]);

            adjustPropertyTypeNames(tree.Classes);

            var writer = new JsonXsdWriter();
            var content = writer.parse("someRoot", tree);

            parseString(content, (err, data) => {
                var sliderTypeArray = data.someRoot["xs:complexType"].filter((complexType) => {
                    return complexType.$.name === "Slider";
                });
                var sliderType = sliderTypeArray[0];
                sliderTypeArray.length.should.eql(1);

                should(sliderType["xs:attributeGroup"]).eql(void 0);
                sliderType["xs:complexContent"][0]["xs:extension"][0]["xs:attributeGroup"][0].$.ref.should.eql("sliderAttributes");
                done();
            });
        });
        it("should render the View tag without a <xs:extension> tag", (done) => {
            var tree = fileWalker.buildTree([new ViewExtendersFilter()]);

            adjustPropertyTypeNames(tree.Classes);

            var writer = new JsonXsdWriter();
            var content = writer.parse("someRoot", tree);

            parseString(content, (err, data) => {
                var viewTypeArray = data.someRoot["xs:complexType"].filter((complexType) => {
                    return complexType.$.name === "View";
                });
                var viewType = viewTypeArray[0];
                viewTypeArray.length.should.eql(1);
                viewType["xs:attributeGroup"][0].$.ref.should.eql("viewAttributes");
                should(viewType["xs:complexContent"]).eql(void 0);
                done();
            });
        });
    });
});
