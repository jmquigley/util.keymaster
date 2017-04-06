'use strict';

import test from 'ava';
import * as fs from 'fs-extra';
import * as path from 'path';
import {Fixture} from 'util.fixture';
import {join} from 'util.join';
import {failure, success} from 'util.toolbox';
import * as uuid from 'uuid';
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
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);
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
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);
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
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

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
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

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
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

	t.is(keymaster.run(), success);

	keymaster.backupFiles.forEach((filename: string) => {
		t.true(fs.existsSync(filename));
	});
});

test('Test the creation of new repo using a base directory', t => {
	const fixture = new Fixture();
	const base = new Fixture('test-base');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--init',
		`--directory=${directory}`,
		`--base=${base.dir}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.false(keymaster.backup);
	t.is(keymaster.base, base.dir);
	t.false(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'all');
	t.deepEqual(keymaster.envs, KeyMaster.envTypes);
	t.false(keymaster.help);
	t.true(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

	t.is(keymaster.run(), success);

	t.true(fs.existsSync(join(directory, 'development.key')));
	t.true(fs.existsSync(join(directory, 'development.pem')));
	t.true(fs.existsSync(join(directory, 'testing.key')));
	t.true(fs.existsSync(join(directory, 'testing.pem')));
	t.true(fs.existsSync(join(directory, 'production.key')));
	t.true(fs.existsSync(join(directory, 'production.pem')));
	t.true(fs.existsSync(join(directory, 'id_rsa.centos')));
	t.true(fs.existsSync(join(directory, 'id_rsa.centos.pub')));
	t.true(fs.existsSync(join(directory, 'id_rsa.buildmaster')));
	t.true(fs.existsSync(join(directory, 'id_rsa.buildmaster.pub')));
	t.true(fs.existsSync(join(directory, 'pw.hash')));

	t.true(fs.existsSync(join(directory, 'base', 'development.key')));
	t.true(fs.existsSync(join(directory, 'base', 'development.pem')));
	t.true(fs.existsSync(join(directory, 'base', 'testing.key')));
	t.true(fs.existsSync(join(directory, 'base', 'testing.pem')));
	t.true(fs.existsSync(join(directory, 'base', 'production.key')));
	t.true(fs.existsSync(join(directory, 'base', 'production.pem')));
	t.true(fs.existsSync(join(directory, 'base', 'id_rsa.centos')));
	t.true(fs.existsSync(join(directory, 'base', 'id_rsa.centos.pub')));
	t.true(fs.existsSync(join(directory, 'base', 'id_rsa.buildmaster')));
	t.true(fs.existsSync(join(directory, 'base', 'id_rsa.buildmaster.pub')));
	t.true(fs.existsSync(join(directory, 'base', 'pw.hash')));
});

test('Test that backup is automatically requested when using --cert', t => {
	const fixture = new Fixture('test-empty');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--certs',
		'--hostname=example.com',
		'--company=blah',
		`--directory=${directory}`,
		'--users=a,b,c'
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
	t.is(keymaster.company, 'blah');
	t.is(keymaster.hostname, 'example.com');
	t.deepEqual(keymaster.users, ['a', 'b', 'c']);
});

test('Test that backup is automatically requested when using --keys', t => {
	const fixture = new Fixture('test-empty');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--keys',
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
	t.true(keymaster.keys);
	t.false(keymaster.pwhash);
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);
});

test('Test creation of --cert with invalid repo directory', t => {
	const directory = join(uuid.v4());
	const argv = require('yargs')([
		'--certs',
		'--env=development',
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.true(keymaster.backup);
	t.is(keymaster.base, '');
	t.true(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'development');
	t.deepEqual(keymaster.envs, ['development']);
	t.false(keymaster.help);
	t.false(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

	t.is(keymaster.run(), failure);
})

test('Test the creation of self-signed cert for development', t => {
	const fixture = new Fixture('test-empty');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--certs',
		'--env=development',
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	t.truthy(keymaster);
	t.true(keymaster.backup);
	t.is(keymaster.base, '');
	t.true(keymaster.certs);
	t.is(keymaster.directory, directory);
	t.is(keymaster.env, 'development');
	t.deepEqual(keymaster.envs, ['development']);
	t.false(keymaster.help);
	t.false(keymaster.init);
	t.false(keymaster.keys);
	t.false(keymaster.pwhash);
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

	t.is(keymaster.run(), success);

	keymaster.backupFiles.forEach((filename: string) => {
		t.true(fs.existsSync(filename));
	});

	t.true(fs.existsSync(join(directory, 'development.key')));
	t.true(fs.existsSync(join(directory, 'development.pem')));
});

test('Test the creation of self-signed cert for all environment types', t => {
	const fixture = new Fixture('test-existing');
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
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

	t.is(keymaster.run(), success);

	keymaster.backupFiles.forEach((filename: string) => {
		t.true(fs.existsSync(filename));
	});

	t.true(fs.existsSync(join(directory, 'development.key')));
	t.true(fs.existsSync(join(directory, 'development.pem')));
	t.true(fs.existsSync(join(directory, 'testing.key')));
	t.true(fs.existsSync(join(directory, 'testing.pem')));
	t.true(fs.existsSync(join(directory, 'production.key')));
	t.true(fs.existsSync(join(directory, 'production.pem')));
});

test('Test the creation of default SSH keys', t => {
	const fixture = new Fixture('test-empty');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--keys',
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
	t.true(keymaster.keys);
	t.false(keymaster.pwhash);
	t.deepEqual(keymaster.users, KeyMaster.sshKeys);

	t.is(keymaster.run(), success);

	t.true(fs.existsSync(join(directory, 'id_rsa.centos')));
	t.true(fs.existsSync(join(directory, 'id_rsa.centos.pub')));
	t.true(fs.existsSync(join(directory, 'id_rsa.buildmaster')));
	t.true(fs.existsSync(join(directory, 'id_rsa.buildmaster.pub')));
});

test('Test the creation of custom SSH keys', t => {
	const fixture = new Fixture('test-existing');
	const directory = join(fixture.dir, '.keymaster');
	const argv = require('yargs')([
		'--keys',
		'--users=a,b',
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
	t.true(keymaster.keys);
	t.false(keymaster.pwhash);
	t.deepEqual(keymaster.users, ['a', 'b']);

	t.is(keymaster.run(), success);

	t.true(fs.existsSync(join(directory, 'id_rsa.a')));
	t.true(fs.existsSync(join(directory, 'id_rsa.a.pub')));
	t.true(fs.existsSync(join(directory, 'id_rsa.b')));
	t.true(fs.existsSync(join(directory, 'id_rsa.b.pub')));
});
