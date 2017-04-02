'use strict';

import test from 'ava';
import * as fs from 'fs-extra';
import * as path from 'path';
import {Fixture} from 'util.fixture';
import {join} from 'util.join';
import {failure, success} from 'util.toolbox';
import {cleanup} from './helpers';

import {KeyMaster} from '../index';

test.after.always.cb(t => {
	cleanup(path.basename(__filename), t);
});

test('Creates an empty KeyMaster class and verifies initial field settings', t => {
	const keymaster = new KeyMaster();

	t.truthy(keymaster);
	t.false(keymaster.backup);
	t.is(keymaster.base, '');
	t.false(keymaster.certs);
	t.is(keymaster.directory, join('~/', '.keymaster'));
	t.is(keymaster.env, 'all');
	t.deepEqual(keymaster.envs, KeyMaster.envTypes);
	t.false(keymaster.help);
	t.false(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.is(keymaster.user, '');
});

test('Creates an empty KeyMaster class with one environment type', t => {
	const argv = require('yargs')([
		'--env=development'
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.false(keymaster.backup);
	t.is(keymaster.base, '');
	t.false(keymaster.certs);
	t.is(keymaster.directory, join('~/', '.keymaster'));
	t.is(keymaster.env, 'development');
	t.deepEqual(keymaster.envs, ['development']);
	t.false(keymaster.help);
	t.false(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.is(keymaster.user, '');
});

test('Creates an initial empty repository', t => {
	const fixture = new Fixture();
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--init',
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.false(keymaster.backup);
	t.is(keymaster.base, '');
	t.false(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'all');
	t.deepEqual(keymaster.envs, KeyMaster.envTypes);
	t.false(keymaster.help);
	t.true(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.is(keymaster.user, '');

	t.is(keymaster.run(), success);

	t.true(fs.existsSync(directory));
	t.true(fs.existsSync(join(directory, 'base')));
	t.true(fs.existsSync(join(directory, 'backup')));
});

test('Try to create a new repo over existing repo', t => {
	const fixture = new Fixture('test-empty');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--init',
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.false(keymaster.backup);
	t.is(keymaster.base, '');
	t.false(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'all');
	t.deepEqual(keymaster.envs, KeyMaster.envTypes);
	t.false(keymaster.help);
	t.true(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.is(keymaster.user, '');

	t.is(keymaster.run(), failure);
});

test('Creates a backup of an existing repository', t => {
	const fixture = new Fixture('test-backup');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--backup',
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.true(keymaster.backup);
	t.is(keymaster.base, '');
	t.false(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'all');
	t.deepEqual(keymaster.envs, KeyMaster.envTypes);
	t.false(keymaster.help);
	t.false(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.is(keymaster.user, '');

	t.is(keymaster.run(), success);

	keymaster.backupFiles.forEach((filename: string) => {
		t.true(fs.existsSync(filename));
	});
});

test('Test that backup is automatically requested when using --cert', t => {
	const fixture = new Fixture('test-empty');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--certs',
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.true(keymaster.backup);
	t.is(keymaster.base, '');
	t.true(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'all');
	t.deepEqual(keymaster.envs, KeyMaster.envTypes);
	t.false(keymaster.help);
	t.false(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.is(keymaster.user, '');
});
