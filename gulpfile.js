var path = require("path");
var gulp = require("gulp");
var ts = require("gulp-typescript");
var jsonEditor = require("gulp-json-editor");
var definitionsDir = process.env.NSREPO || "node_modules/tns-core-modules"

var tsSrc = [
    "bin/**/*.ts",
    "lib/**/*.ts",
    "tests/**/*.ts",
    "typings/**/*.ts",
    "customtypings/**/*.ts",
    "!tests/resources/**/*.*"
];
var outDir = "./dist";

gulp.task("compile", function() {
    var tsResult = gulp.src(tsSrc).pipe(
            ts({
                noEmitOnError: true,
                noImplicitAny: true,
                outDir: outDir,
                removeComments: true,
                noLib: false,
                target: "ES5",
                module: "commonjs",
                typescript: require("typescript"),
                outDir: outDir
            }));
    return tsResult.js.pipe(gulp.dest(outDir));
});

gulp.task("copy-package-json", function() {
    gulp.src(path.join(definitionsDir, "package.json"))
    // Perform minification tasks, etc here
    .pipe(gulp.dest(outDir + "/lib/"))
    .pipe(gulp.dest(outDir + "/tests/"));
});

gulp.task("update-target-package-json", function() {
    var sourcePackageJson = require("./" + path.join(definitionsDir, "package.json"));

    targetPackageJsonPath = path.join("NpmPackage", "package.json");
    gulp.src(targetPackageJsonPath)
        .pipe(jsonEditor(function(json) {
            json.version = sourcePackageJson.version;
            json.dependencies["tns-core-modules"] = sourcePackageJson.version;
            return json;
        }))
    .pipe(gulp.dest("./NpmPackage"))
});

gulp.task("default", ["compile", "copy-package-json"]);
