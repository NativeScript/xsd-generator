var gulp = require("gulp");
var ts = require("gulp-typescript");

var tsSrc = ["bin/**/*.ts", "lib/**/*.ts", "tests/**/*.ts", "typings/**/*.ts", "customtypings/**/*.ts"];
var outDir = "./dist";

gulp.task("default", function() {
    var tsResult = gulp.src(tsSrc).pipe(
            ts({
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
