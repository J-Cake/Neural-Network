'use strict';

const fs = require('fs');
const path = require('path');
const through = require('through2');
const {PassThrough} = require('stream');

const {series, parallel, src, dest} = require('gulp');

const browserify = require('gulp-browserify');
const terser = require('gulp-terser');

function htmlTransform(escape = false) {
    let bracketCount = 0;
    let isEscaped = false;
    let prevOut = [];
    let bracketContents = [];

    return through.obj(function (input, encoding, callback) {
        const stream = through();

        function transform(src) {
            let body = prevOut;

            for (const char of src) {
                if (char === '\\')
                    isEscaped = true;
                else {
                    if (isEscaped) {
                        stream.write(char);
                        isEscaped = false;
                    } else if (char === '{') {
                        bracketCount++;
                        bracketContents.push('{');
                    } else if (char === '}') {
                        bracketCount--;
                        bracketContents.push('}');

                        // console.log('Bracket Content', bracketContents.join(''));

                        if (bracketCount === 0) {
                            const fileName = path.resolve(input.history[0], '../', ((bracketContents.join('').match(/{.+}$/) || [])[0] || '').slice(1, -1));

                            if (fs.existsSync(fileName))
                                stream.write(fs.readFileSync(fileName, encoding));
                                // stream.write(escape ? fs.readFileSync(fileName, encoding).replace(/</g, '&lt;').replace(/>/g, '7gt;') : fs.readFileSync(fileName, encoding));
                            else
                                stream.write(`The File "${fileName}" doesn't exist`);
                            bracketContents = [];
                        } else if (bracketCount < 0) {
                            bracketCount = 0;
                            stream.write(bracketContents);
                            bracketContents = [];
                        }
                    } else if (bracketCount > 0)
                        bracketContents.push(char);
                    else { // Even if characters aren't escaped, they aren't used for anything, so they'll just get appended to the string.
                        stream.write(char);
                    }
                }
            }

            prevOut = body;
        }

        if (input.isStream()) {
            input.contents.on('data', function (data) {
                transform(data.toString());
            });
            input.contents.on('end', () => {
                stream.write(prevOut.join(''));
                stream.end();
                this.push(input);
                callback();
            });

            input.contents = stream;
        } else if (input.isBuffer()) {
            const output = [];

            stream.on('data', data => output.push(data));
            stream.on('end', () => {
                input.contents = Buffer.from(output.join(''), encoding);
                this.push(input);
                callback();
            });

            transform(input.contents.toString());
            stream.end();
        } else {
            throw new TypeError(`Unsupported File Type`);
        }

        return stream;
    });
}

async function prepareOutput() {
    if (!fs.existsSync('./build'))
        fs.mkdirSync('./build');

    if (fs.existsSync('./build/final'))
        fs.rmdirSync('./build/final', {
            recursive: true
        });

    fs.mkdirSync('./build/final');
}

async function Browserify() {
    if (fs.readdirSync('./build/app').length > 0) {
        src(['./build/app/src/index.js'])
            .pipe(browserify())
            .pipe(dest('./build/final'));

        src(['./build/app/worker/worker.js'])
            .pipe(browserify())
            .pipe(dest('./build/final'));
    } else
        throw new Error('No Typescript output');
}

async function Minify() {
    src(['./build/final/index.js', './build/final/worker.js'])
        .pipe(terser())
        .pipe(dest('./build/final'));
}

async function Copy() {
    src(['./app/static/*', '!./app/static/index.html'])
        .pipe(dest('./build/final'));

    src(['./app/static/index.html'])
        .pipe(htmlTransform())
        .pipe(dest('./build/final'));

exports.default = series(prepareOutput, parallel(Browserify, Copy));

exports.htmlify = Copy;

exports.fullBuild = series(prepareOutput, Copy, Browserify, Minify);
