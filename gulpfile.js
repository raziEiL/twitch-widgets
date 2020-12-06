const gulp = require("gulp");
const del = require("del"); // для удаления файлов/папок
let sass = require("gulp-sass");
sass.compiler = require("node-sass");
const browserSync = require("browser-sync").create();
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer"); // автоматически добавляет вендорные префиксы к CSS свойствам (req .browserslistrc)
const cssvariables = require("postcss-css-variables");
const calc = require("postcss-calc");
const sourcemaps = require("gulp-sourcemaps"); // указывает src файл js/css для инспектора браузров
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const uncss = require("gulp-uncss"); // убирает неиспользуемые css классы
// minify js/css
const uglify = require("gulp-uglify-es").default; // сжатие js es6 кода
const cleanCSS = require("gulp-clean-css"); // сжатие CSS кода
const imagemin = require("gulp-imagemin");
const htmlmin = require("gulp-htmlmin");
// Node module support
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const merge = require("merge-stream");
// Список css классов (используются для js), которые игнорируются uncss
const UNCSS_IGNORE = [".hidden"];

// Пути
const ROOT = "./";
const DIST = "dist/frontend/";
const SRC = "src/frontend/";
const JS_FILES = ["vote", "draw"];

const PATH = {
    // готовые файлы после сборки
    build: {
        css: ROOT + DIST + "css",
        js: ROOT + DIST + "js",
        img: ROOT + DIST + "img",
        font: ROOT + DIST + "font",
    },
    // пути исходных файлов
    src: {
        css: ROOT + SRC + "scss/**/*.scss",
        js: ROOT + SRC + "js/",
        img: ROOT + SRC + "img/*",
        font: ROOT + SRC + "font/*",
        html: ROOT + SRC + "*.html"
    }
};
// \ Пути

gulp.task("build-dev:sass", sassCallback);

gulp.task("build:sass", () => {
    return sassCallback(true);
});
/* 
gulp.task("build-dev:js", jsCallback);

gulp.task("build:js", () => {
    return jsCallback({production: true});
}); */

gulp.task("build:js", jsBrowserify);

gulp.task("build:img", () => {
    return gulp.src(PATH.src.img)
        .pipe(imagemin({
            verbose: true
        }))
        .pipe(gulp.dest(PATH.build.img));
});

gulp.task("build:font", () => {
    return gulp.src(PATH.src.font)
        .pipe(gulp.dest(PATH.build.font));
});

gulp.task("build:html", () => {
    return gulp.src(PATH.src.html)
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
        }))
        .pipe(gulp.dest(DIST));
});

gulp.task("clean", () => {
    return del([ROOT + DIST]);
});

gulp.task("build", gulp.series(["clean", "build:sass", "build:js", "build:img", "build:html", "build:font"]));
gulp.task("build-dev", gulp.series(["clean", "build-dev:sass", "build:js", "build:img", "build:html", "build:font"]));

gulp.task("browserSync", gulp.series((done) => {
    browserSync.init({
        watch: true,
        server: ROOT + DIST
        // notify: false
    });
    done();
}));

gulp.task("watch", gulp.series(["build", "browserSync"], () => {
    gulp.watch(PATH.src.css, gulp.series(["build:sass"]));
    gulp.watch(PATH.src.js, gulp.series(["build:js"]));
    gulp.watch(PATH.src.img, gulp.series(["build:img"]));
    gulp.watch(PATH.src.html, gulp.series(["build:html"]));
    gulp.watch(PATH.src.html, gulp.series(["build:font"]));
}));

gulp.task("watch-dev", gulp.series(["build-dev", "browserSync"], () => {
    gulp.watch(PATH.src.css, gulp.series(["build-dev:sass"]));
    gulp.watch(PATH.src.js, gulp.series(["build:js"]));
    gulp.watch(PATH.src.img, gulp.series(["build:img"]));
    gulp.watch(PATH.src.html, gulp.series(["build:html"]));
    gulp.watch(PATH.src.html, gulp.series(["build:font"]));
}));

function sassCallback(production = false) {
    if (production) {
        return gulp.src(PATH.src.css)
            .pipe(sass({}).on("error", sass.logError))
            .pipe(postcss([autoprefixer(), cssvariables({
                preserve: true
            }), calc()]))
            .pipe(concat("style.min.css"))
            .pipe(uncss({
                html: [PATH.src.html],
                ignore: UNCSS_IGNORE
            }))
            .pipe(cleanCSS())
            .pipe(gulp.dest(PATH.build.css));
    }
    return gulp.src(PATH.src.css)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: "expanded"
        }).on("error", sass.logError))
        .pipe(postcss([autoprefixer(), cssvariables({
            preserve: true
        }), calc()]))
        .pipe(concat("style.css"))
        .pipe(uncss({
            html: [PATH.src.html],
            ignore: UNCSS_IGNORE
        }))
        .pipe(gulp.dest(PATH.build.css))
        .pipe(rename(function (path) {
            path.basename += ".min";
        }))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(PATH.build.css));
}

/* function jsCallback(production) {
    if (production) {
        return gulp.src(PATH.src.js)
            .pipe(concat("scripts.min.js"))
            .pipe(uglify())
            .pipe(gulp.dest(PATH.build.js));
    }
    return gulp.src(PATH.src.js)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat("scripts.js"))
        .pipe(gulp.dest(PATH.build.js))
        .pipe(rename(function (path) {
            path.basename += ".min";
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(PATH.build.js)); 
}
 */
// https://stackoverflow.com/questions/41043032/browserify-parseerror-import-and-export-may-appear-only-with-sourcetype
function jsBrowserify() {
    return merge(JS_FILES.map(file => {
        return browserify({
            entries: [PATH.src.js + file + ".js"],
            debug: true
        }).bundle()
            .pipe(source(file + ".min.js"))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            // Add transformation tasks to the pipeline here.
            .pipe(uglify())
            .on("error", console.error)
            .pipe(sourcemaps.write("./"))
            .pipe(gulp.dest(PATH.build.js));
    }));
}