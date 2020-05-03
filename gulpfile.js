const fs = require('fs');

const {series, src, dest} = require('gulp');
// const sourcemaps = require('gulp-sourcemaps');

const browserify = require('gulp-browserify');

exports.default = series(async function prepareOutput() {
    if (!fs.existsSync('./build'))
        fs.mkdirSync('./build');

    if (fs.existsSync('./build/final'))
        fs.rmdirSync('./build/final', {
            recursive: true
        });

    fs.mkdirSync('./build/final');
}, series(async function Browserify() {
    src(['./build/app/src/index.js'])
        .pipe(browserify({ debug: true }))
        .pipe(dest('./build/final'));

    src(['./build/app/worker/worker.js'])
        .pipe(browserify({ debug: true }))
        .pipe(dest('./build/final'));
}, async function Copy() {
    src(['./app/index.html', './app/master.css'])
        .pipe(dest('./build/final'))
}));
