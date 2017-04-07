#!/usr/bin/env node

'use strict';

import {join} from 'util.join';
import {KeyMaster} from './index';

const yargs = require('yargs')
	.usage('Usage: $0 --init [--base={}] | --certs [options] | --keys [options]')
	.describe('init', 'Creates an initial repository.  This option is mutuall exclusive to the others.')
	.default('init', false)
	.describe('certs', 'Creates a set of self signed certs in the repository for the given environment')
	.default('certs', false)
	.describe('keys', 'Creates a new set of RSA keys in the repository')
	.default('keys', false)
	.describe('pwhash', 'Creates a random password hash file in the repository')
	.default('pwhash', false)
	.describe('backup', 'Creates a backup of the current repository')
	.default('backup', false)
	.default('base', '')
	.nargs('base', 1)
	.describe('base', 'A base directory whose contents will be copied into a new repository (with --init)')
	.default('company', 'NA')
	.describe('company', 'The name of the company creating the certs')
	.nargs('company', 1)
	.default('directory', join('~/', '.keymaster'))
	.nargs('directory', 1)
	.describe('directory', 'The repository directory location')
	.default('env', 'all')
	.describe('env', 'The environment type being created for these certs.')
	.choices('env', ['development', 'testing', 'production', 'all'])
	.default('hostname', 'localhost')
	.describe('hostname', 'The name of the host where the certs will reside')
	.nargs('hostname', 1)
	.default('users', '')
	.nargs('users', 1)
	.describe('users', 'A comma separated list of user names/ids associated with the RSA keys that will be created')
	.version()
	.help()
	.showHelpOnFail(false, 'Specify --help for available options');

if (process.argv.length <= 2) {
	yargs.showHelp();
} else {
	console.log(process.argv.length);
	new KeyMaster(yargs.argv).run();
}
