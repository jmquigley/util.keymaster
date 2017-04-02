#!/usr/bin/env node

'use strict';

import {join} from 'util.join';
import {KeyMaster} from './index';

const argv = require('yargs')
	.usage('Usage: $0 <command>')
	.command('init', 'Creates an initial repository.  This option is mutuall exclusive to the others.')
	.default('init', false)
	.command('certs', 'Creates a set of self signed certs in the repository for the given environment')
	.default('certs', false)
	.command('keys', 'Creates a new set of RSA keys in the repository')
	.default('keys', false)
	.command('pwhash', 'Creates a random password hash file in the repository')
	.default('pwhash', false)
	.command('backup', 'Creates a backup of the current repository')
	.default('backup', false)
	.default('directory', join('~/', '.keymaster'))
	.nargs('directory', 1)
	.describe('directory', 'The repository directory location')
	.default('env', 'all')
	.describe('env', 'The environment type being created for these certs.')
	.choices('env', ['development', 'testing', 'production', 'all'])
	.default('base', '')
	.nargs('bas', 1)
	.describe('base', 'A base directory whose contents will be copied into a new repository')
	.default('user', '')
	.nargs('user', 1)
	.describe('user', 'The user name/id associated with the RSA keys that will be created')
	.help()
	.argv;

new KeyMaster(argv).run();
