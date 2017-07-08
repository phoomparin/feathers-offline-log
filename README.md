# feathers-offline-log

[![Build Status](https://travis-ci.org/feathersjs/feathers-offline-log.png?branch=master)](https://travis-ci.org/feathersjs/feathers-offline-log)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-offline-log/badges/gpa.svg)](https://codeclimate.com/github/feathersjs/feathers-offline-log)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-offline-log/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-offline-log/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-offline-log.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-offline-log)
[![Download Status](https://img.shields.io/npm/dm/feathers-offline-log.svg?style=flat-square)](https://www.npmjs.com/package/feathers-offline-log)

| Performant, persistent client-side transaction log.

Browser client logs are kept in (preferred order) IndexedDB, WebSQL or localStorage.
Log entries are added in an efficient manner, whether the log is small or very large.
JavaScript objects are also handled in an efficient manner.

> **ProTip:** Used for feathers-offline's optimistic mutation log,
which is needed while the client is disconnected.

The cache stringifies an added object just once,
eliminating the multiple stringifications of alternative designs.
The cache bundles logs into chunks, whose maximum size you determine (0.5 meg default).
This avoids both the persisting of large blobs and the inefficiencies of writing individual log items.

## Installation

```
npm install feathers-offline-log --save
```

## Documentation

**cache = new Cache(storageHandler, options)**
Configure a new cache.
    - `storageHandler` (required, module) - Module responsible for persistence.
        - `/storageBrowser` - Browser support. See example below.
    - `option` (optional) - Options for the cache.
        - `chunkMaxLen` (optional, number, default 0.5 megs) - Maximum chunk size in chars.
        - `sep` (optional, char, default ',') - Seperator char between logs.
        Objects are always seperated with ','.

**cache.config(options)**
Configure the storage handler for the cache.
The options depend on the storage handler.
    - `storageBrowser` - See options for
    [localforage](http://localforage.github.io/localForage/)
    
**cache.add(str)** - Add `str` to the logs.
**cache.addObj(obj)** - Add stringified `obj` to the logs.
**cache.getOldestChunk()** - Returns the oldest chunk of logs.
If it consists solely of added objects,
then `JSON.stringify('[' + chunk + ']')` will return an array of POJO.
**cache.removeOldestChunk()** - Remove the oldest chunk from the log.
**cache.clear()** - Remove all chunks.

## Complete Example

```js
const storageBrowser = require('feathers-offline-log/storage-browser');
const Cache = require('feathers-offline-log');

const cache = new Cache(storageBrowser, { chunkMaxLen: 500000 }); // logs stored in 0.5 meg chunks
cache.config()
  .then(() => cache.addObj(obj1))
  .then(() => cache.addObj(obj2))
  .then(() => cache.addObj(obj3))
  
  .then(() => cache.length()) 
  .then(chunkCount => console.log(`There are ${chunkCount} chunks.`))
    
  .then(() => cache.getOldestChunk()) 
  .then(chunk => JSON.parse(`[${chunk}]`)) 
  .then(chunkObj => console.log(chunkObj))
  .then(() => cache.removeOldestChunk()) 
```

The included browser storage abstraction for
[localforage](http://localforage.github.io/localForage/)
may be used standalone.

```js
const storageBrowser = require('feathers-offline-log/storage-browser');

storageBrowser.config({ name: 'myApp', instanceName: 'auth' })
  .then(() => storageBrowser.setItem('jwt', ' ... ')) // full key is myApp_auth/jwt
  .then(() => storageBrowser.getItem('jwt'))
  .then(str => storageBrowser.removeItem('jwt'))
  .then(() => storageBrowser.clear())
  .then(() => storageBrowser.length())
  .then(numb => storageBrowser.keys())
  .then(array => storageBrowser.iterate((value, key, iterationNumber) => { ... }));
````

## License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).
