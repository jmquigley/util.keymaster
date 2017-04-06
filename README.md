# util.keymaster [![Build Status](https://travis-ci.org/jmquigley/util.keymaster.svg?branch=master)](https://travis-ci.org/jmquigley/util.keymaster) [![tslint code style](https://img.shields.io/badge/code_style-TSlint-5ed9c7.svg)](https://palantir.github.io/tslint/) [![Test Runner](https://img.shields.io/badge/testing-ava-blue.svg)](https://github.com/avajs/ava) [![NPM](https://img.shields.io/npm/v/util.keymaster.svg)](https://www.npmjs.com/package/util.keymaster) [![Coverage Status](https://coveralls.io/repos/github/jmquigley/util.keymaster/badge.svg?branch=master)](https://coveralls.io/github/jmquigley/util.keymaster?branch=master)

> Command line for generating SSH keys and self signed certs for a project.

This module helps to organize keys and certs that are used in development and testing of an application.  It creates:

- Self-signed certs
- RSA keys for build accounts
- Generation of a random hash

It requires the following command line dependencies to generate the keys:

- [OpenSSL](https://www.openssl.org/docs/)
- [ssh-keygen](https://en.wikipedia.org/wiki/Ssh-keygen)


## Installation

To install as a global package and cli:
```
$ npm install --global util.keymaster
```

To install as a development dependency with cli:
```
$ npm install --save-dev util.keymaster
```

To build the app and run all tests:
```
$ npm run all
```


## Usage
A new cli command named ``keymaster`` is available once installed.

#### Create a new repository

```
keymaster --init
```

This will create a new repository located in ``~/.keymaster``.  This is an empty repo with two sub directories: ``backup`` and ``base``.  The backup directory contains a backup of the last set of keys before any operation that creates new keys/certs.  Initially this is empty.  The ``base`` directory is the first set of keys that were created in the repository.  This is only populated automatically when ``--base`` is used with ``--init``.

Note that if the default directory ``~/.keymaster`` exists, then this process will terminate with a warning.

#### Create a new repository with a base set of files

```
keymaster --init --base=~/some/directory/with/keys
```

This will create a new empty repository (like the first example).  It will copy the contents of the base directory into the new repo.  This is a way to use seed a new repository with a base set of files.

#### Create self-signed certs

```
keymaster --certs
```

The basic cert setup creates ``{env}.key`` and ``{env}.pem``.  There are three types of environment used: development, testing, and production.  These are the defaults set in package.json.  When the option above is executed it will create new keys:

```
development.key & development.pem
testing.key & testing.pem
production.key & production.pem
```

#### Create self-signed cert for development only

```
keymaster --certs --env=development
```

This would only create the keys ``development.key`` and ``development.pem`` in the repo.

#### Create ssh keys for default user list

```
keymaster --keys
```

This will generate SSH keys for users.  The default users are ``buildmaster`` and ``centos``.  The names of the keys are:

```
id_rsa.buildmaster & id_rsa.buildmaster.pub
id_rsa.centos & id_rsa.centos.pub
```

#### Create ssh keys for a user named 'foo'

```
keymaster --keys --users=foo
```

The names of the keys after this call would be:

```
id_rsa.foo & id_rsa.foo.pub
```

#### Backup the current repository

```
keymaster --backup
```

This facility it called automatically when new keys/certs are created.  If one wants to force a backup, then this option is used.
