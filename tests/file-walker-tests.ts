import * as should from "should";
import {join as pathJoin} from "path";
import {existsSync as fsExists} from "fs";
import {Type, Class, Tree} from "../lib/lang-elements";
import {FileWalker} from "../lib/file-walker";
import {InputHandler,Input} from "../lib/input";
import {ViewExtendersFilter} from "../lib/view-extenders-filter";


// a dummy reference of the should variable so that is import gets included
// to the generated javascript:
var aDummyThing = should;

describe("InputHandler run", () => {
    describe("on all files", () => {
        it("should list only non-private files", () => {
            var inputHandler = new InputHandler([]);
            inputHandler.argsResolve = (rawArguments: string[]) => {
                return {
                    i: <string[]> [],
                    f: <string[]> [],
                    o: "schema.xsd",
                    r: "tests/resources"
                };
            };

            var privateFilePath = "tests/resources/http/http-request.d.ts";
            fsExists(privateFilePath).should.be.true;

            var input:Input = inputHandler.getInput();
            input.apiFiles.length.should.equal(13);

            var found = false;
            for(var i=0; i<input.apiFiles.length; i++) {
                var apiFilePath = pathJoin(inputHandler.argsResolve().r, input.apiFiles[i]);
                if (apiFilePath === privateFilePath) {
                    found = true;
                    break;
                }
            }
            found.should.eql(false);;
        });
    });
});

describe("FileWalker", () => {
    var fileWalker: FileWalker;
    var allInput: Input = null;
    before(() => {
        var inputHandler = new InputHandler([]);
        inputHandler.argsResolve = (rawArguments: string[]) => {
            return {
                i: <string[]> [],
                f: <string[]> [],
                o: "schema.xsd",
                r: "tests/resources"
            };
        };
        allInput = inputHandler.getInput();
        fileWalker = new FileWalker(allInput.root, allInput.apiFiles);
    });
    describe("run on all files", () => {
        it("should return all classes", () => {
            var tree = fileWalker.buildTree();
            tree.Classes.length.should.equal(18);
        });
        it("should contain View class", () => {
            var tree = fileWalker.buildTree();
            var searchedClass: Class = null;
            for (var i=0; i<tree.Classes.length; i++) {
                var _class = tree.Classes[i];
                if (_class.name === "View") {
                    searchedClass = _class;
                    break;
                }
            };
            should(searchedClass).not.be.eql(null);
        });
        it("should fill all full base class names", () => {
            var tree = fileWalker.buildTree();
            var labelClass: Class = null;
            for (var i=0; i<tree.Classes.length; i++) {
                var _class = tree.Classes[i];
                if (_class.name === "Label") {
                    labelClass = _class;
                    break;
                }
            };
            labelClass.baseClassNames[0].fullName.should.eql('"ui/text-base".TextBase');
            labelClass.baseClassNames[1].fullName.should.eql('"ui/core/view".View');
            labelClass.baseClassNames[2].fullName.should.eql('"ui/core/proxy".ProxyObject');
            labelClass.baseClassNames[3].fullName.should.eql('"ui/core/bindable".Bindable');
            labelClass.baseClassNames[4].fullName.should.eql('"ui/core/dependency-observable".DependencyObservable');
            should(labelClass.baseClassNames[6]).be.eql(void 0);
        });
        it("should fill class comments", () => {
            var tree = fileWalker.buildTree();
            var searchedClass: Class = null;
            for (var i=0; i<tree.Classes.length; i++) {
                var _class = tree.Classes[i];
                if (_class.name === "View") {
                    searchedClass = _class;
                    break;
                }
            };

            searchedClass.classComments.should.match(/.*This class is the base class for all UI components\..*/);
        });
        it("should retrieve the full class name", () => {
            var tree = fileWalker.buildTree();
            var searchedClass: Class = null;
            for (var i=0; i<tree.Classes.length; i++) {
                var _class = tree.Classes[i];
                if (_class.name === "View") {
                    searchedClass = _class;
                    break;
                }
            };
            searchedClass.fullName.should.eql('"ui/core/view".View');
        });
    });
    describe("Adding classes", () => {
        it("should throw an exception when a class with the same full class name already exists", () => {
            var tree = new Tree();

            var classToBeDuplicated = new Class("className", "fullClassName", "classComments", [new Type("baseClass1FullName")]);
            should(function(){tree.addClass(classToBeDuplicated);}).not.throw();
            var justANormalClass = new Class("className2", "fullClassName2", "classComments2", [new Type("baseClass2FullName")]);
            should(function(){tree.addClass(justANormalClass);}).not.throw();
            var duplicateClass = new Class("className3", "fullClassName", "classComments3", [new Type("baseClass3FullName")]);
            should(function(){tree.addClass(duplicateClass);}).throw(/.*a class.*already exists.*/i);
        });
    });
    describe("Property filling", () => {
        it("should have all fullNames of property types of type string", () => {
            var tree = fileWalker.buildTree();
            tree.Classes.forEach((_class) => {
                _class.properties.forEach((prop) => {
                    prop.type.fullName.should.be.type("string");
                });
            });
        });
        it("should have the parent, ios and android  properties filtered", () => {
            var tree = fileWalker.buildTree();
            var searchedClass = tree.Classes.filter((_class) => {
                if(_class.name === "View") {
                    return true;
                }
                return false;
            })[0];
            var searchedPropertyArr = searchedClass.properties.filter((prop) => {
                var checker = /^(parent)|(ios)|(android)$/i;
                if (checker.test(prop.name)) {
                    return true;
                }
                return false;
            });
            //should.have.lengthOf(0) makes the second subsequent test using it hang!!!
            searchedPropertyArr.length.should.eql(0);
        });
        it("should have properties, starting with underscore filtered", () => {
            var tree = fileWalker.buildTree();
            var searchedClass = tree.Classes.filter((_class) => {
                if(_class.name === "View") {
                    return true;
                }
                return false;
            })[0];
            var searchedPropertyArr = searchedClass.properties.filter((prop) => {
                var checker = /^_/;
                if (checker.test(prop.name)) {
                    return true;
                }
                return false;
            });
            searchedPropertyArr.length.should.eql(0);
        });
        it("should have their dependencyProperties filtered", () => {
            var tree = fileWalker.buildTree();
            var searchedClass = tree.Classes.filter((_class) => {
                if(_class.name === "View") {
                    return true;
                }
                return false;
            })[0];
            var searchedPropertyArr = searchedClass.properties.filter((prop) => {
                var checker = /Property$/;
                if (checker.test(prop.name)) {
                    return true;
                }
                return false;
            });
            searchedPropertyArr.length.should.eql(0);
        });
        it("should have their View-type properties filtered", () => {
            var tree = fileWalker.buildTree();
            tree.Classes.forEach((_class) => {
                _class.properties.forEach((prop) => {
                    prop.type.fullName.should.not.eql('"ui/core/view".View');
                });
            });
        });
        it("should have their properties of type any filtered", () => {
            var tree = fileWalker.buildTree();
            tree.Classes.forEach((_class) => {
                _class.properties.forEach((prop) => {
                    prop.type.fullName.should.not.eql('any');
                });
            });
        });
        it("should have View class properties filled", () => {
            var tree = fileWalker.buildTree();
            var searchedClass: Class = null;
            for (var i=0; i<tree.Classes.length; i++) {
                var _class = tree.Classes[i];
                if (_class.name === "View") {
                    searchedClass = _class;
                    break;
                }
            };

            var propNames: string[] = [];
            searchedClass.properties.forEach((prop) => {
                propNames.push(prop.name);
            });

            propNames.should.containEql('loaded');
            propNames.should.containEql('unloaded');
            propNames.should.containEql('borderRadius');
            propNames.should.containEql('borderWidth');
            propNames.should.containEql('borderColor');
            propNames.should.containEql('color');
            propNames.should.containEql('backgroundColor');
            propNames.should.containEql('backgroundImage');
            propNames.should.containEql('minWidth');
            propNames.should.containEql('minHeight');
            propNames.should.containEql('width');
            propNames.should.containEql('height');
            propNames.should.containEql('margin');
            propNames.should.containEql('marginLeft');
            propNames.should.containEql('marginTop');
            propNames.should.containEql('marginRight');
            propNames.should.containEql('marginBottom');
            propNames.should.containEql('padding');
            propNames.should.containEql('paddingLeft');
            propNames.should.containEql('paddingTop');
            propNames.should.containEql('paddingRight');
            propNames.should.containEql('paddingBottom');
            propNames.should.containEql('horizontalAlignment');
            propNames.should.containEql('verticalAlignment');
            propNames.should.containEql('visibility');
            propNames.should.containEql('opacity');
            propNames.should.containEql('isEnabled');
            propNames.should.containEql('isUserInteractionEnabled');
            propNames.should.containEql('id');
            propNames.should.containEql('cssClass');
            propNames.should.containEql('style');
            propNames.should.containEql('cssType');
            propNames.length.should.eql(32);
        });
    });

    describe("run with ViewExtendersFilter", () => {
        it("should filter classes that either do not inherit View or View itself", () => {
            var tree = fileWalker.buildTree([new ViewExtendersFilter()]);
            var searchedClass: Class = null;
            var nonViewInheritingClasses = tree.Classes.filter((_class) => {
                if (_class.fullName === '"ui/core/view".View') {
                    return false;
                }
                var viewContainingBaseClassNames = _class.baseClassNames.filter((baseClassName) => {
                    if (baseClassName.fullName === '"ui/core/view".View') {
                        return true;
                    }
                    return false;
                });
                return viewContainingBaseClassNames.length === 0;
            });
            nonViewInheritingClasses.length.should.eql(0);
        });
    });
});
