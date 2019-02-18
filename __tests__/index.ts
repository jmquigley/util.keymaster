"use strict";

import * as fs from "fs-extra";
import * as path from "path";
import {Fixture} from "util.fixture";
import {join} from "util.join";
import {failure, success} from "util.toolbox";
import * as uuid from "uuid";
import {cleanup} from "./helpers";

import {KeyMaster} from "../index";

afterAll((done) => {
	cleanup(path.basename(__filename), done);
});

test("Creates an empty KeyMaster class and verifies initial field settings", () => {
	const keymaster = new KeyMaster();

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(false);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(join("~/", ".keymaster"));
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);
});

test("Creates an empty KeyMaster class with one environment type", () => {
	const argv = require("yargs")(["--env=development"]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(false);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(join("~/", ".keymaster"));
	expect(keymaster.env).toBe("development");
	expect(keymaster.envs).toEqual(["development"]);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);
});

test("Creates an initial empty repository", () => {
	const fixture = new Fixture();
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--init", `--directory=${directory}`]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(false);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(true);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	expect(fs.existsSync(directory)).toBe(true);
	expect(fs.existsSync(join(directory, "base"))).toBe(true);
	expect(fs.existsSync(join(directory, "backup"))).toBe(true);
});

test("Try to create a new repo over existing repo", () => {
	const fixture = new Fixture("test-empty");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--init", `--directory=${directory}`]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(false);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(true);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(failure);
});

test("Creates a backup of an existing repository", () => {
	const fixture = new Fixture("test-backup");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--backup", `--directory=${directory}`])
		.argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	keymaster.backupFiles.forEach((filename: string) => {
		expect(fs.existsSync(filename)).toBe(true);
	});
});

test("Test the creation of new repo using a base directory", () => {
	const fixture = new Fixture();
	const base = new Fixture("test-base");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")([
		"--init",
		`--directory=${directory}`,
		`--base=${base.dir}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(false);
	expect(keymaster.base).toBe(base.dir);
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(true);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	expect(fs.existsSync(join(directory, "development.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "development.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "testing.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "testing.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "production.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "production.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.centos"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.centos.pub"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.buildmaster"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.buildmaster.pub"))).toBe(true);
	expect(fs.existsSync(join(directory, "pw.hash"))).toBe(true);

	expect(fs.existsSync(join(directory, "base", "development.key"))).toBe(
		true
	);
	expect(fs.existsSync(join(directory, "base", "development.pem"))).toBe(
		true
	);
	expect(fs.existsSync(join(directory, "base", "testing.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "base", "testing.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "base", "production.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "base", "production.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "base", "id_rsa.centos"))).toBe(true);
	expect(fs.existsSync(join(directory, "base", "id_rsa.centos.pub"))).toBe(
		true
	);
	expect(fs.existsSync(join(directory, "base", "id_rsa.buildmaster"))).toBe(
		true
	);
	expect(
		fs.existsSync(join(directory, "base", "id_rsa.buildmaster.pub"))
	).toBe(true);
	expect(fs.existsSync(join(directory, "base", "pw.hash"))).toBe(true);
});

test("Test that backup is automatically requested when using --cert", () => {
	const fixture = new Fixture("test-empty");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")([
		"--certs",
		"--hostname=example.com",
		"--company=blah",
		`--directory=${directory}`,
		"--users=a,b,c"
	]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(true);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.company).toBe("blah");
	expect(keymaster.hostname).toBe("example.com");
	expect(keymaster.users).toEqual(["a", "b", "c"]);
});

test("Test that backup is automatically requested when using --keys", () => {
	const fixture = new Fixture("test-empty");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--keys", `--directory=${directory}`]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(true);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);
});

test("Test creation of --cert with invalid repo directory", () => {
	const directory = join(uuid.v4());
	const argv = require("yargs")([
		"--certs",
		"--env=development",
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(true);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("development");
	expect(keymaster.envs).toEqual(["development"]);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(failure);
});

test("Test the creation of self-signed cert for development", () => {
	const fixture = new Fixture("test-empty");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")([
		"--certs",
		"--env=development",
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(true);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("development");
	expect(keymaster.envs).toEqual(["development"]);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	keymaster.backupFiles.forEach((filename: string) => {
		expect(fs.existsSync(filename)).toBe(true);
	});

	expect(fs.existsSync(join(directory, "development.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "development.pem"))).toBe(true);
});

test("Test the creation of self-signed cert for all environment types", () => {
	const fixture = new Fixture("test-existing");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--certs", `--directory=${directory}`]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(true);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	keymaster.backupFiles.forEach((filename: string) => {
		expect(fs.existsSync(filename)).toBe(true);
	});

	expect(fs.existsSync(join(directory, "development.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "development.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "testing.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "testing.pem"))).toBe(true);
	expect(fs.existsSync(join(directory, "production.key"))).toBe(true);
	expect(fs.existsSync(join(directory, "production.pem"))).toBe(true);
});

test("Test the creation of default SSH keys", () => {
	const fixture = new Fixture("test-empty");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--keys", `--directory=${directory}`]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(true);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	expect(fs.existsSync(join(directory, "id_rsa.centos"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.centos.pub"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.buildmaster"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.buildmaster.pub"))).toBe(true);
});

test("Test the creation of custom SSH keys", () => {
	const fixture = new Fixture("test-existing");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")([
		"--keys",
		"--users=a,b",
		`--directory=${directory}`
	]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(true);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(["a", "b"]);

	expect(keymaster.run()).toBe(success);

	expect(fs.existsSync(join(directory, "id_rsa.a"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.a.pub"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.b"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.b.pub"))).toBe(true);
});

test("Test creation of new keys against existing", () => {
	const fixture = new Fixture("test-existing");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--keys", `--directory=${directory}`]).argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(true);
	expect(keymaster.pwhash).toBe(false);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	expect(fs.existsSync(join(directory, "id_rsa.centos"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.centos.pub"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.buildmaster"))).toBe(true);
	expect(fs.existsSync(join(directory, "id_rsa.buildmaster.pub"))).toBe(true);

	keymaster.backupFiles.forEach((filename: string) => {
		expect(fs.existsSync(filename)).toBe(true);
		expect(fs.readFileSync(filename)).not.toBe(
			fs.readFileSync(join(directory, path.basename(filename)))
		);
	});
});

test("Test the creation of the random password hash file", () => {
	const fixture = new Fixture("test-existing");
	const directory = join(fixture.dir, ".keymaster");
	const argv = require("yargs")(["--pwhash", `--directory=${directory}`])
		.argv;

	const keymaster = new KeyMaster(argv);

	expect(keymaster).toBeDefined();
	expect(keymaster.backup).toBe(true);
	expect(keymaster.base).toBe("");
	expect(keymaster.certs).toBe(false);
	expect(keymaster.directory).toBe(directory);
	expect(keymaster.env).toBe("all");
	expect(keymaster.envs).toEqual(KeyMaster.envTypes);
	expect(keymaster.help).toBe(false);
	expect(keymaster.init).toBe(false);
	expect(keymaster.keys).toBe(false);
	expect(keymaster.pwhash).toBe(true);
	expect(keymaster.users).toEqual(KeyMaster.sshKeys);

	expect(keymaster.run()).toBe(success);

	expect(fs.existsSync(join(directory, "pw.hash"))).toBe(true);
	expect(fs.readFileSync(join(directory, "pw.hash")).length).toBe(32);
});
