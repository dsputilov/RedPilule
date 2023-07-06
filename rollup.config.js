//import {uglify} from 'rollup-plugin-uglify';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
//import dotenv from "rollup-plugin-dotenv"

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const rootDir = dirname(__filename);

export default {
	input: rootDir + '/src/index.js',
	output: [
		{
			file: rootDir + '/dist/rp.es.js',
			format: 'es'
		}
	],

	plugins: [
		resolve({
			browser: true
		}),
		commonjs(),
		//dotenv(),
		//uglify()
	]
};
