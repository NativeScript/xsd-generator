import fs = require("fs");
import pathModule = require("path");
import parseArgs = require("minimist");
import parameterAdjuster = require("named-parameters");
import glob = require("glob");
import _ = require("underscore");

export interface Input {
    root: string;
    apiFiles: string[];
    outFilePath: string;
}

export class InputHandler {
    private _argsResolve: any;

    constructor(private rawArguments: string[]) {
    }

    private _help:string = "Invalid call!\n" +
        "XSD generator walks through all ts files in a folder and generates and XSD schema\n" +
        "\n" +
        "Usage:\n" +
        "generate-xsd -r ProgramRootDir [-i InputFilenamePatterns] [-o OutputXsdFileName] [-f OutputFilterPatterns]\n" +
        "IMPORTANT: InputFileNamePatterns must be TypeScript files only, i.e. filenames must end with .ts. An error will be thrown otherwise\n" +
        "\n" +
        "Examples:\n" +
        "Generates an XSD schema from all the .ts files under the SpaceMonitor folder and writes it to the schema.xml in the current folder:\n" +
        "generate-xsd -r /Users/jj/SpaceMonitor/ -o schema.xml" +
        "Generates an XSD schema from the explicitly pointed spaceMonitor TypeScript file and outputs it to the schema.xml\n" +
        "generate-xsd -r /Users/jj/SpaceMonitor/ -i spaceMonitor.ts -o schema.xml\n" +
        "Generates an XSD schema from the explicitly pointed spaceMonitor.ts, spaceLab.d.ts and all TypeScript files in the lib folder, but excludes the language elements, defined in the spaceLab.d.ts from the output. Writes the output to the api.xml file\n" +
        "extract-ts-api /Users/jj/SpaceMonitor/ -i spaceMonitor.d.ts -i spaceLab.d.ts -i lib/*.d.ts -f spaceLab.d.ts -o api.xml\n" +
        "Extracts the API from the explicitly pointed spaceMonitor.d.ts, spaceLab.d.ts and all TypeScript def files in the lib folder, but excludes the language elements, defined in the spaceLab.d.ts and the libs folder from the output. Writes the output to the api.xml file\n" +
        "extract-ts-api -r /Users/jj/SpaceMonitor/ -i spaceMonitor.d.ts -i spaceLab.d.ts -i lib/*.d.ts -f spaceLab.d.ts -f lib/**/*.* -o api.xml\n";

    getInput():Input {
        var typedArgs = this.argsResolve(this.rawArguments);

        var rootArg = typedArgs['r'];
        var outputFilePathArg = typedArgs['o'];

        if (!outputFilePathArg || !rootArg) {
            console.log(this._help);
            process.exit();
        }

        var root = this._unixifyPath(rootArg);
        var outputFilePath = this._unixifyPath(outputFilePathArg);

        var inputPatterns = typedArgs['i'] || [];
        if (inputPatterns.length == 0) {
            var allDtsFilesPattern = pathModule.join("**/*.d.ts");
            inputPatterns.push(allDtsFilesPattern);
        }

        var outputFilterPatterns = typedArgs['f'] || [];
        outputFilterPatterns.forEach(function(pattern, index) {
            outputFilterPatterns[index] = "!" + pattern;
        });

        var allInput = this._expandGlobs(root, inputPatterns);
        allInput = this._filterNonPublicAPIs(root, allInput);
        allInput = this._unixifyPaths(allInput);

        var apiFiles = this._expandGlobs(root, inputPatterns.concat(outputFilterPatterns));
        apiFiles = this._filterNonPublicAPIs(root, apiFiles);
        apiFiles = this._unixifyPaths(apiFiles);

        return <Input> {
            root: root,
            apiFiles: apiFiles,
            outFilePath: outputFilePath
        };
    }

    public get argsResolve() {
        if (this._argsResolve == null) {
            this._argsResolve = function(rawArguments) {
                var callArgsOnly:string[] = rawArguments.slice(2);
                var parsedArgs = parseArgs(callArgsOnly);
                var typedArgs = parameterAdjuster.parse(parsedArgs).coerce("i", "array").coerce("f", "array").coerce("r", "string").coerce("o", "string").values();
                return typedArgs;
            }
        }
        return this._argsResolve;
    }

    public set argsResolve(value) {
        this._argsResolve = value;
    }

    private _unixifyPaths(filePaths: string[]): string[] {
        return filePaths.map(f => this._unixifyPath(f));
    }

    private _unixifyPath(filePath: string): string {
        return filePath.replace("\\", "/");
    }

    private _filterNonPublicAPIs(root, filePaths: string[]): string[] {
        return filePaths.filter((fp) => {
            if (fp.length <= 5 || fp.substr(fp.length - 3) != ".ts") {
                console.log("Non-.ts file detected. XSD Generator only reads TypeScript files");
                process.exit(1);
            }

            var realFilePath = pathModule.join(root, fp);
            if (fs.readFileSync(realFilePath).toString().split("\n")[0].indexOf("@private") != -1) return false;
            return true;
        });
    }

    private _expandGlobs(root, patterns):string[] {
        var result = [];
        patterns.forEach(function(pattern) {
            var exclusion = pattern.indexOf('!') === 0;
            if (exclusion) {
                pattern = pattern.substring(1);
            }
            var matches = glob.sync(pattern, {root: root, cwd: root});
            if (exclusion) {
                result = _.difference(result, matches);
            } else {
                result = _.union(result, matches);
            }
        });
        return result;
    }
}
