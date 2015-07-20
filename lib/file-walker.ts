import * as lang from "./lang-elements";
import {IClassFilter} from "./i-class-filter";
import {join as pathJoin} from "path";
import {readFileSync,writeFileSync,existsSync} from "fs";
import * as ts from "typescript";
import * as clone from "clone";

export class FileWalker {
    private _files: string[];
    private _root: string;
    private _getFileContent: Func1<string, string>;
    private _typeChecker: ts.TypeChecker = null;
    private _program: ts.Program = null;

    private _language: ts.ScriptTarget = ts.ScriptTarget.ES5;
    private _setParentNodes: boolean = true;

    constructor(root: string, files: string[]) {
        this._root = root;
        this._files = files;
    }

    public get files(): string[] {
        return this._files;
    }

    public get root(): string {
        return this._root;
    }

    public get getFileContent(): Func1<string, string> {
        if (this._getFileContent == null) {
            this._getFileContent = (fp) => {
                return readFileSync(fp).toString();
            };
        }

        return this._getFileContent;
    }

    public set getFileContent(value: Func1<string, string>) {
        this._getFileContent = value;
    }

    private get typeChecker(): ts.TypeChecker {
        if (this._typeChecker === null) {
            this._typeChecker = this.program.getTypeChecker();
        }
        return this._typeChecker;
    }

    private get program(): ts.Program {
        if (this._program === null) {
            this._program = this._buildLanguageService(this.root, this.files).getProgram();
        }
        return this._program;
    }

    public buildTree(filters?: IClassFilter[]): lang.Tree {
        var allClasses = this._getAllClasses();

        var filteredClasses = allClasses;

        if (filters) {
            filters.forEach((filter) => {
                filteredClasses = filter.filter(filteredClasses);
            });
        }

        var tree = new lang.Tree();
        filteredClasses.forEach((_class) => {
            tree.addClass(_class);
        });

        return tree;
    }

    private _buildLanguageService(root: string, allFiles: string[]): ts.LanguageService {
        var fullPathFiles = allFiles.map((fp) => pathJoin(root, fp));
        var options: ts.CompilerOptions = { module: ts.ModuleKind.CommonJS };
        const serviceHost: ts.LanguageServiceHost = {
            getScriptFileNames: () => fullPathFiles,
            getScriptVersion: (fileName) => "1",
            getScriptSnapshot: (filePath) => {
                if (!existsSync(filePath)) {
                    return undefined;
                }
                var fileContent: string = readFileSync(filePath).toString();
                return ts.ScriptSnapshot.fromString(fileContent);
            },
            getCompilationSettings: () => options,
            getCurrentDirectory: () => root,
            getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options)
        }
        return ts.createLanguageService(serviceHost, ts.createDocumentRegistry());
    }

    private _getAllClasses(): lang.Class[] {
        var allClasses: lang.Class[] = [];

        this.program.getSourceFiles().forEach((tsSource) => {
            var fill = (node: ts.Node) => {
                if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                    var _class: ts.ClassDeclaration = <ts.ClassDeclaration>node;
                    var fullClassName: string = this._getFullClassName(_class);
                    var className: string = _class.name.text;
                    var classComments: string = this._getClassComments(_class);
                    var baseClassNames = this._fillBaseClassNames(_class);

                    var newClass = new lang.Class(className, fullClassName, classComments, baseClassNames);
                    this._fillProperties(newClass.properties, _class, tsSource.text);
                    allClasses.push(newClass);
                }
                ts.forEachChild(node, fill);
            }
            fill(tsSource);
        });

        return allClasses;
    }

    private _fillProperties(propertiesArray: lang.Property[], _class: ts.ClassDeclaration, sourceString: string) {
        _class.members.forEach((member) => {

            var memberType = ts.SyntaxKind[member.kind];
            if (member.kind === ts.SyntaxKind.PropertyDeclaration) {
                var propertyTypeString:string = null;

                var classDeclaration = this._getClassDeclaration(member.type);
                if (classDeclaration) {
                    propertyTypeString = this._getFullClassName(classDeclaration);
                } else if (member.type.kind === ts.SyntaxKind.StringKeyword) {
                    propertyTypeString = "string";
                } else if (member.type.kind === ts.SyntaxKind.NumberKeyword) {
                    propertyTypeString = "number";
                } else if (member.type.kind === ts.SyntaxKind.BooleanKeyword) {
                    propertyTypeString = "boolean";
                } else if (member.type.typeName && member.type.typeName.left) {
                    propertyTypeString = member.type.typeName.left.text;
                } else {
                    propertyTypeString = sourceString.substring(member.type.pos, member.type.end).trim();
                }
                var type = new lang.Type(propertyTypeString);

                var newProperty = new lang.Property(member.name.text, type);
                var adjustedProperty = this._adjustProperty(newProperty);
                if (adjustedProperty) {
                    propertiesArray.push(adjustedProperty);
                }
            }
        });
    }

    private _adjustProperty(prop: lang.Property): lang.Property {
        if (prop.name === "parent") {
            return null;
        }

        if (prop.name === "ios") {
            return null;
        }

        if (prop.name === "android") {
            return null;
        }

        //Not sure about the next three checks. Can these be implemented in another manner, no name comparison?
        if (prop.name === "isLayoutValid") {
            return null;
        }

        if (prop.name === "visualState") {
            return null;
        }

        if (prop.name === "isLoaded") {
            return null;
        }
        if (prop.name.indexOf("_") == 0) {
            return null;
        }

        var eventTester = /^(.*)Event$/;
        if (eventTester.test(prop.name)) {
            var newPropName = prop.name.replace(eventTester, "$1");
            return new lang.Property(newPropName, prop.type);
        }

        var filteredPropertyTypes = [
            '"ui/core/dependency-observable".Property',
            '"ui/core/view".View',
            "any",
            '"image-source".ImageSource',
            '"ui/frame".Frame'
        ];

        if (filteredPropertyTypes.indexOf(prop.type.fullName) >= 0) {
            return null;
        }

        return prop;
    }


    private _getClassComments(_class: ts.ClassDeclaration): string {
        var fullText = _class.getFullText();
        return fullText.substring(0, _class.getLeadingTriviaWidth()).trim();
    }

    private _getFullClassName(_class: ts.ClassDeclaration): string {
        return this.typeChecker.getFullyQualifiedName(_class.symbol);
    }

    private _fillBaseClassNames(_class: ts.ClassDeclaration, classNames?: lang.Type[]): lang.Type[] {
        if(!(classNames)) {
            classNames = [];
        }
        var baseClass = this._getBaseClass(_class);
        if (baseClass) {
            var baseClassName = this._getFullClassName(baseClass);
            classNames.push(new lang.Type(baseClassName));
            this._fillBaseClassNames(baseClass, classNames);
            return classNames;
        }
    }

    private _getClassDeclaration(type: ts.TypeNode): ts.ClassDeclaration {
        var resolvedType = this.typeChecker.getTypeAtLocation(type);
        if (!resolvedType) {
            return null;
        }
        var resolvedTypeSymbol = resolvedType.symbol;
        if (!resolvedTypeSymbol) {
            return null;
        }
        var declarations = resolvedTypeSymbol.getDeclarations();
        var meaningDeclarations = this._getClassOrInterfaceDeclarations(declarations);

        /// If for some reason there are two classes/interfaces with the same name, there is something strange!
        ///  re-check the code!
        if (meaningDeclarations.length > 1) {
            if (meaningDeclarations[0].name.text === "Date") {
                return meaningDeclarations[1];
            }
            throw new Error("A class has multiple declarations! Rework the code to handle this case!");
        }
        return <ts.ClassDeclaration>meaningDeclarations[0];
    }

    private _getClassOrInterfaceDeclarations(declarations: ts.Declaration[]): ts.Declaration[] {
        return declarations.filter((declaration) => {
            if (declaration.kind === ts.SyntaxKind.InterfaceDeclaration) {
                return true;
            }
            if (declaration.kind === ts.SyntaxKind.ClassDeclaration) {
                return true;
            }
            return false;
        });
    }

    private _getBaseClass(_class: ts.ClassDeclaration): ts.ClassDeclaration {
        if (!_class.heritageClauses) {
            return null;
        }

        for (var i=0; i<_class.heritageClauses.length; i++) {
            var hc = _class.heritageClauses[i];
            if (hc.token === ts.SyntaxKind.ExtendsKeyword) {
                //TODO: Ugly. What if another index holds the true type?
                var hcType = hc.types[0];
                return this._getClassDeclaration(hcType);
            }
            return null;
        }
        return null;
    }
}

