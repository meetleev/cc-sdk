import gulp from "gulp";
import {deleteAsync} from 'del';
import Concat from "gulp-concat";

import Babel from "gulp-babel";

import Wrap from "gulp-wrap";

import Replace from "gulp-replace";

import fs_extra from "fs-extra";

const {emptyDir, readJsonSync} = fs_extra;
import {dirname, resolve, join} from 'path';

import realFs from "fs";

import {rollup} from "rollup";

import commonjs from "@rollup/plugin-commonjs";

import {babel} from "@rollup/plugin-babel";

import babel_preset_env from "@babel/preset-env";

import babel_preset_typescript from "@babel/preset-typescript";

import {nodeResolve} from "@rollup/plugin-node-resolve";

import rollup_plugin_terser from "@rollup/plugin-terser";

import {generate} from 'gen-dts';

import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// cjs esm iife
const buildFormat = 'iife'

const json = readJsonSync('./package.json');
const SDK_NAME = json['sdkName'];
let dependenciesFiles = [
    'source/crypto-js/crypto-js-min.js',
];

function buildSDKCryptoDependencies() {
    return gulp.src(dependenciesFiles)
        .pipe(Concat('crypto-js.js'))
        .pipe(gulp.dest('bin/'))
}


let dependenciesConfigFiles = [
    './source/SDKConfig.js',
];

function buildSDKConfigDependencies() {
    return gulp.src(dependenciesConfigFiles)
        .pipe(Concat('SDKConfig.js'))
        .pipe(Babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(Wrap({src: 'source/template.txt'}, {variable: 'data'}))
        .pipe(Replace(/SDK_NAME/g, SDK_NAME))
        // .pipe(Uglify({
        //     mangle: {
        //         eval: true, toplevel: false, properties: {regex: /^_/},
        //     },
        //     compress: {
        //         unused: true,
        //         keep_fargs: false,
        //         unsafe: true
        //     },
        //     keep_classnames:true,
        //     output: {
        //         beautify: true,
        //     }
        //
        // }))
        .pipe(gulp.dest('bin/'))
}

async function buildSDKScriptsTask() {
    const engineRoot = resolve(__dirname);
    const realpath = typeof realFs.realpath.native === 'function' ? realFs.realpath.native : realFs.realpath;
    const realPath = (file) => new Promise((resolve, reject) => {
        realpath(file, (err, path) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            } else {
                resolve(err ? file : path);
            }
        });
    });
    let sources = ['./source/index.ts'];
    const bundle = await rollup({
        input: sources,
        external: ['cc'],
        plugins: [
            nodeResolve({
                extensions: ['.ts', '.js'],
                jail: await realPath(engineRoot),
                rootDir: engineRoot,
                modulesOnly: true,
            }),
            commonjs({/*extensions: ['.ts'], exclude: ["source/!**!/!*.js"]*/}),
            babel({
                extensions: ['.ts', '.js'],
                babelHelpers: 'bundled',
                comments: false,
                // exclude: ['node_modules/!**'],
                // include: [/*"exports/!**!/!*.ts"*/],
                plugins: [],
                presets: [
                    [babel_preset_env.default, {loose: true,}],
                    [babel_preset_typescript]/*['@cocos/babel-preset-cc']*/]
            }),
            rollup_plugin_terser({
                compress: {
                    reduce_funcs: false,
                    keep_fargs: false,
                    unsafe_Function: true,
                    unsafe_math: true,
                    unsafe_methods: true,
                    passes: 2, // first: remove deadcodes and const objects, second: drop variables
                },
                mangle: {
                    eval: true, toplevel: false,
                },
                keep_fnames: false,
                /*output: {
                    beautify: false,
                },*/
                toplevel: false,
            }),
        ]
    });
    await bundle.write({
        file: `./bin/${SDK_NAME}.${'esm' === buildFormat ? 'mjs' : 'js'}`,
        format: buildFormat,
        // esModule: false,
        sourcemap: false,
        name: SDK_NAME,
        globals: {cc: 'cc'},
    })
    await bundle.close();
    // const rollupOutput = await bundle.write();
    // console.log('rp', rollupOutput)
}

async function cleanTask() {
    await deleteAsync(['./bin/*']);
}

export const clean = gulp.series(cleanTask);

async function buildDTSTask() {
    const outDir = join('bin');
    await emptyDir(outDir);
    return generate({
        rootDir: __dirname,
        output: {
            outDir: outDir,
            rootModuleName: SDK_NAME,
            usePathForRootModuleName: 'esm' === buildFormat,
            nonExportedExternalLibs: ['cc'],
        }
    });
}

export const buildDTS = gulp.series(buildDTSTask);

export const buildSDKScripts = gulp.series(buildSDKScriptsTask);

export const build = gulp.series(cleanTask, /*buildSDKCryptoDependencies, buildSDKConfigDependencies,*/ buildDTSTask, buildSDKScriptsTask);

export default build;
