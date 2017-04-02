import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as log4js from 'log4js';
import {join} from 'util.join';
import {timestamp} from 'util.timestamp';
import {failure, success} from 'util.toolbox';

const pkg = require('./package.json');

export interface IKeyMasterOpts {
	backup?: boolean;
	base?: string;
	certs?: boolean;
	directory?: string;
	env?: string;
	envs?: string[];
	help?: boolean;
	init?: boolean;
	keys?: boolean;
	pwhash?: boolean;
	user?: string;
}

const log = log4js.getLogger();

/* Creates an instance of the KeyMaster class */
export class KeyMaster {

	public static envTypes: string[] = pkg.keymaster.envTypes;

	private opts: IKeyMasterOpts = null;
	private backedUp: string[] = [];

	/*
	 * Creates an instance of the KeyMaster class.  It takes a list of options
	 * provided by the command line to determine what will be created within
	 * the class.
	 * @param opts {IKeyMasterOpts} the command line options that are set for
	 * this class.
	*/
	constructor(opts?: IKeyMasterOpts) {
		this.opts = Object.assign({
			backup: false,
			base: '',
			certs: false,
			directory: join('~/', '.keymaster'),
			env: 'all',
			envs: KeyMaster.envTypes,
			help: false,
			init: false,
			keys: false,
			pwhash: false,
			user: ''
		}, opts);

		if (this.env !== 'all') {
			this.opts.envs = [this.env];
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
		log.info('Running Keymaster');

		if (self.opts.init) {
			return this.initializeRepository();
		} else {
			if (this.opts.backup) {
				this.createBackup();
			}
		}

		log.info('Done');
		return success;
	}

	/*
	 * Creates a backup of the current repository directory.  It stores it in
	 * the backup directory of the repo using the timestamp of the operation as
	 * name of the directory within the backup.  Only the files at the ROOT of
	 * the repository are backed up.
	 * @param self {KeyMaster} a reference to the this pointer for the class
	 */
	private createBackup(self = this) {
		const backupDir = join(self.opts.directory, 'backup', timestamp());
		log.info(`Creating backup: ${backupDir}`);

		const files = fs.readdirSync(self.opts.directory)
						.filter(file => fs.statSync(join(self.opts.directory, file)).isFile());
		files.forEach((filename: string) => {
			const src = join(self.opts.directory, filename);
			const dst = join(backupDir, filename);
			fs.copySync(src, dst);
			self.backedUp.push(dst);
		});
	}

	/*
	 * Create a new empty repository for storing keys.  If the repository already
	 * exists, then a warning message is printed and failure is returned.
	 * @param self {KeyMaster} a reference to the this pointer for the class
	 * @returns {number} the status of the operation.  A 0 is success, 127 is
	 * failure.
	*/
	private initializeRepository(self = this) {
		if (fs.existsSync(self.opts.directory)) {
			log.warn(`Keymaster repository already exists (skipping): ${self.opts.directory}`);
			return failure;
		}

		log.info(`Initializing repository in ${self.opts.directory}`);
		const directories = [
			self.opts.directory,
			join(self.opts.directory, 'base'),
			join(self.opts.directory, 'backup')
		];
		directories.forEach((directory: string) => {
			fs.mkdirSync(directory);
		});

		return success;
	}

	get backup(): boolean {
		return this.opts.backup;
	}

	get backupFiles(): string[] {
		return _.cloneDeep(this.backedUp);
	}

	get base(): string {
		return this.opts.base;
	}

	get certs(): boolean {
		return this.opts.certs;
	}

	get directory(): string {
		return this.opts.directory;
	}

	get env(): string {
		return this.opts.env;
	}

	get envs(): string[] {
		return this.opts.envs;
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

	get pwhash(): boolean {
		return this.opts.pwhash;
	}

	get user(): string {
		return this.opts.user;
	}
}
