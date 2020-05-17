'use strict';

const fs = require('fs');
const path = require('path');
const through = require('through2');

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

function PreBuild() {
    function ClearPrevBuild(cb) {
        if (!fs.existsSync('./build'))
            fs.mkdirSync('./build');

        if (fs.existsSync('./build/final'))
            fs.rmdirSync('./build/final', {
                recursive: true
            });

        fs.mkdirSync('./build/final');

        cb();
    }

    const CompileHTML = () => src(['./app/static/index.html'])
            .pipe(htmlTransform())
            .pipe(dest('./build/final'));

    const CopyStaticResources = () => src(['./app/static/*', '!./app/static/index.html'])
            .pipe(dest('./build/final'));

    return series(ClearPrevBuild, parallel(CompileHTML, CopyStaticResources));
}
function DevBuild() {
    const App = () => src('./build/app/src/index.js')
        .pipe(browserify())
        .pipe(dest('./build/final'));
    const Worker = () => src('./build/app/worker/worker.js')
        .pipe(browserify())
        .pipe(dest('./build/final'));

    return parallel(App, Worker);
}
function WebBuild() {
    const App = () => src('./build/app/src/index.js')
        .pipe(browserify())
        .pipe(terser())
        .pipe(dest('./build/final'));
    const Worker = () => src('./build/app/worker/worker.js')
        .pipe(browserify())
        .pipe(terser())
        .pipe(dest('./build/final'));

    return parallel(App, Worker);
}

exports.DevBuild = series(PreBuild(), DevBuild());
exports.WebBuild = series(PreBuild(), WebBuild());
// TODO: Electron Full Build
