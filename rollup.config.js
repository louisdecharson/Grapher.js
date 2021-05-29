import { terser } from "rollup-plugin-terser";
import json from '@rollup/plugin-json';

const input = 'index.js';

export default [
    {
        input: input,
        output: {
            file: 'dist/grapher.js',
            format: 'cjs'
        },
        plugins: [json()]
    },
    {
        input: input,
        output: {
            file: 'dist/grapher.min.js',
            format: 'umd',
            name: 'g'
        },
        plugins: [json(), terser()]
    },
    {
        input: input,
        output: {
            file: 'dist/grapher.debug.js',
            format: 'umd',
            name: 'g'
        },
        plugins: [json()]
    }
];
