import * as fs from "fs-extra";
import * as _ from "lodash";
import * as log4js from "log4js";
import {join} from "util.join";
import {timestamp} from "util.timestamp";
import {encoding, failure, isWin, success} from "util.toolbox";
import {callSync} from "util.toolbox-node";

const empty = require("empty-dir");

const pkg = require("./package.json");

export interface KeyMasterOpts {
	backup?: boolean;
	base?: string;
	certs?: boolean;
	company?: string;
	directory?: string;
	env?: string;
	help?: boolean;
	init?: boolean;
	keys?: boolean;
	hostname?: string;
	pwhash?: boolean;
	users?: string;
}

const log = log4js.getLogger();

/* Creates an instance of the KeyMaster class */
export class KeyMaster {
	public static envTypes: string[] = pkg.keymaster.envTypes;
	public static sshKeys: string[] = pkg.keymaster.sshKeys;

	private opts: KeyMasterOpts = null;
	private _backedUp: string[] = [];
	private _envs: string[] = KeyMaster.envTypes;
	private _users: string[] = KeyMaster.sshKeys;

	/*
	 * Creates an instance of the KeyMaster class.  It takes a list of options
	 * provided by the command line to determine what will be created within
	 * the class.
	 * @param opts {KeyMasterOpts} the command line options that are set for
	 * this class.
	 */
	constructor(opts?: KeyMasterOpts) {
		this.opts = Object.assign(
			{
				backup: false,
				base: "",
				certs: false,
				company: "NA",
				directory: join("~/", ".keymaster"),
				env: "all",
				hostname: "localhost",
				help: false,
				init: false,
				keys: false,
				pwhash: false,
				users: ""
			},
			opts
		);

		if (this.opts.env !== "all") {
			this._envs = [this.opts.env];
		}

		if (this.opts.users !== "") {
			this._users = this.opts.users.split(",");
		}

		if (this.opts.certs || this.opts.keys || this.opts.pwhash) {
			this.opts.backup = true;
		}
	}

	/*
	 * The main entry point for creation of keys.  This is the only public
	 * method exposed by the class.  The class is constructed with options and
	 * then this method is called to perform the requested actions.
	 */
	public run(self = this) {
		log.info("Running Keymaster");

		if (self.opts.init) {
			return this.initializeRepository();
		} else {
			if (!fs.existsSync(self.opts.directory)) {
				log.error(`Repository doesn't exist @ ${self.opts.directory}`);
				return failure;
			}

			if (this.opts.backup) {
				if (this.createBackup() !== success) {
					return failure;
				}
			}

			if (this.opts.certs) {
				if (this.createCerts() !== success) {
					return failure;
				}
			}

			if (this.opts.keys) {
				if (this.createKeys() !== success) {
					return failure;
				}
			}

			if (this.opts.pwhash) {
				if (this.createPasswordHash() !== success) {
					return failure;
				}
			}
		}

		log.info("Done");
		return success;
	}

	/*
	 * Creates the self signed certs for the requested environment
	 * type.  It uses [openssl](https://www.openssl.org/docs/) to create them.
	 *
	 * It takes the results of the `--env` option to determine what certs to
	 * create.  The 'all' option is selected by default.  The list of types
	 * are in package.json -> keymaster.envTypes.  This resolves the list of
	 * keys for 'all'.
	 *
	 * These certs should not be used in a live production environment.  The
	 * production versions created here are only for INITIAL shakeout and
	 * development.  They are not part of any cert authority.
	 *
	 * @param self {KeyMaster} a reference to the this pointer for the class
	 */
	private createCerts(self = this): number {
		let rc: number = success;

		self.envs.forEach((env: string) => {
			log.info(`Creating certs for environment: ${env}`);

			const key = `${self.opts.directory}/${env}.key`;
			const cert = `${self.opts.directory}/${env}.pem`;
			const subj = `-subj '/CN=${self.opts.hostname}/O=${
				self.opts.company
			}/C=US'`;

			rc = callSync([
				"openssl",
				"req",
				"-nodes",
				"-newkey",
				"rsa:2048",
				"-x509",
				"-days",
				"9999",
				"-keyout",
				key,
				"-out",
				cert,
				subj
			]);

			if (!isWin) {
				fs.chmodSync(key, "700");
				fs.chmodSync(cert, "700");
			}
		});

		return rc;
	}

	/*
	 * Creates SSH keys for a list of users.  The default users are:
	 *
	 *   - centos (default AWS user for centos)
	 *   - buildmaster (development CI/CD build account)
	 *
	 * Each user will generate two files:
	 *
	 *   - id_rsa.{user}
	 *   - id_rsa.{user}.pub
	 */
	private createKeys(self = this): number {
		let rc: number = success;

		self.users.forEach((user: string) => {
			const prv = `${self.opts.directory}/id_rsa.${user}`;
			const pub = `${self.opts.directory}/id_rsa.${user}.pub`;

			if (fs.existsSync(prv)) {
				fs.removeSync(prv);
			}
			if (fs.existsSync(pub)) {
				fs.removeSync(pub);
			}

			rc = callSync([
				"ssh-keygen",
				"-t",
				"rsa",
				`-N ""`,
				"-b",
				"2048",
				"-f",
				prv
			]);

			if (!isWin) {
				fs.chmodSync(prv, "700");
				fs.chmodSync(pub, "700");
			}
		});

		return rc;
	}

	/*
	 * Creates a string of random characters.  The default size is set to
	 * 32 alpha-numeric characters.  This is defined in the package.json
	 * The bytes are saved in a file named `pw.hash`.
	 * @param self {KeyMaster} a reference to the this pointer for the class
	 */
	private createPasswordHash(self = this): number {
		try {
			const hashfile = join(self.opts.directory, "pw.hash");
			const key = [];
			const hash = pkg.keymaster.hash;

			log.info(`Create password hash file: ${hashfile}`);

			for (let i = 0; i < hash.size; i++) {
				key.push(
					hash.combo.charAt(
						Math.floor(Math.random() * hash.combo.length)
					)
				);
			}

			fs.writeFileSync(hashfile, key.join(""), encoding);

			if (!isWin) {
				fs.chmodSync(hashfile, "700");
			}
		} catch (err) {
			log.error(err.message);
			return failure;
		}

		return success;
	}

	/*
	 * Creates a backup of the current repository directory.  It stores it in
	 * the backup directory of the repo using the timestamp of the operation as
	 * name of the directory within the backup.  Only the files at the ROOT of
	 * the repository are backed up.
	 * @param self {KeyMaster} a reference to the this pointer for the class
	 */
	private createBackup(self = this): number {
		try {
			if (!empty.sync(self.opts.directory)) {
				const backupDir = join(
					self.opts.directory,
					"backup",
					timestamp()
				);
				log.info(`Creating backup: ${backupDir}`);

				const files = fs
					.readdirSync(self.opts.directory)
					.filter((file) =>
						fs.statSync(join(self.opts.directory, file)).isFile()
					);
				files.forEach((filename: string) => {
					const src = join(self.opts.directory, filename);
					const dst = join(backupDir, filename);
					fs.copySync(src, dst);
					self._backedUp.push(dst);
				});
			}
		} catch (err) {
			log.error(err.message);
			return failure;
		}

		return success;
	}

	/*
	 * Create a new empty repository for storing keys.  If the repository already
	 * exists, then a warning message is printed and failure is returned.
	 * @param self {KeyMaster} a reference to the this pointer for the class
	 * @returns {number} the status of the operation.  A 0 is success, 127 is
	 * failure.
	 */
	private initializeRepository(self = this): number {
		if (fs.existsSync(self.opts.directory)) {
			log.warn(
				`Keymaster repository already exists (skipping): ${
					self.opts.directory
				}`
			);
			return failure;
		}

		log.info(`Initializing repository in ${self.opts.directory}`);
		try {
			const directories = [
				self.opts.directory,
				join(self.opts.directory, "base"),
				join(self.opts.directory, "backup")
			];
			directories.forEach((directory: string) => {
				fs.mkdirSync(directory);
			});

			if (self.opts.base !== "") {
				fs.copySync(self.opts.base, self.opts.directory);
				fs.copySync(self.opts.base, join(self.opts.directory, "base"));
			}
		} catch (err) {
			log.error(err.message);
			return failure;
		}

		return success;
	}

	get backup(): boolean {
		return this.opts.backup;
	}

	get backupFiles(): string[] {
		return _.cloneDeep(this._backedUp);
	}

	get base(): string {
		return this.opts.base;
	}

	get certs(): boolean {
		return this.opts.certs;
	}

	get company(): string {
		return this.opts.company;
	}

	get directory(): string {
		return this.opts.directory;
	}

	get env(): string {
		return this.opts.env;
	}

	get envs(): string[] {
		return _.cloneDeep(this._envs);
	}

	get help(): boolean {
		return this.opts.help;
	}

	get init(): boolean {
		return this.opts.init;
	}

	get keys(): boolean {
		return this.opts.keys;
	}

	get hostname(): string {
		return this.opts.hostname;
	}

	get pwhash(): boolean {
		return this.opts.pwhash;
	}

	get users(): string[] {
		return _.cloneDeep(this._users);
	}
}
