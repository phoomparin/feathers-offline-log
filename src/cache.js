
import { logAndThrow } from './utils';

import makeDebug from 'debug';
const debug = makeDebug('log-cache');

export default class Cache {
  constructor(storage, options = {}) {
    this._storage = storage;
    this._currChunkKey = -1;
    this._currChunk = '';
    this._chunkMaxLen = options.chunkMaxLen || 500000;
    this._sep = options.sep || ',';
  }
  
  config(options = {}) {
    debug('config started', options);
    
    return this._storage.config(options)
      .then(() => this._getChunkKeys())
      .then(keys => {
        if (keys.length) {
          this._currChunkKey = keys[keys.length - 1] + 1;
        } else {
          this._currChunkKey = 0;
        }
        
        debug('config ended. _currChunkKey=', this._currChunkKey);
      })
      .catch(logAndThrow('cache config'));
  }
  
  add(str, sep) {
    debug('add started', this._currChunkKey);
    sep = sep || this._sep;
  
    return new Promise(resolve => {
      if (this._currChunk.length + str.length <= this._chunkMaxLen) {
        return resolve();
      }
    
      const result = this._flushCurrChunk()
        .catch(logAndThrow('cache add-flush'))
        .then(() => {
          this._currChunkKey += 1;
          this._currChunk = '';
        });
    
      return resolve(result);
    })
      .then(() => {
        this._currChunk = `${this._currChunk}${this._currChunk.length ? sep : ''}${str}`;
        this._flushCurrChunk();
      })
      .then(() => debug('add ended'))
      .catch(logAndThrow('cache'));
  }
  
  addObj(obj) {
    return this.add(JSON.stringify(obj), ',');
  }

  getOldestChunk() {
    debug('getOldestChunk entered');
    
    return this._getChunkKeys()
      .then(keys => this._storage.getItem(this._makeChunkKey(keys[0])))
      .catch(logAndThrow('getOldestChunk'));
  }
  
  removeOldestChunk() {
    debug('removeOldestChunk entered');
    
    return this._getChunkKeys()
      .then(keys => this._storage.removeItem(this._makeChunkKey(keys[0])))
      .catch(logAndThrow('removeOldestChunk'));
  }
  
  clear() {
    debug('clear entered');
    return this._storage.clear();
  }
  
  _makeChunkKey(numb) {
    return `_${numb + ''}`;
  }
  
  _getChunkKeys() {
    debug('_getChunkKeys start');
    return this._storage.keys()
      .then(keys => {
        keys = keys.filter(key => key.charAt(0) === '_').map(key => parseInt(key.substr(1), 10)).sort();
        
        debug('_getChunkKeys end. keys', keys);
        return keys;
      })
  }
  
  _flushCurrChunk() {
    debug('_flushCurrChunk entered. key', this._currChunkKey);
    return this._storage.setItem(this._makeChunkKey(this._currChunkKey), this._currChunk);
  }
};
