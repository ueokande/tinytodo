import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createItem, read, write, toggle} from '../src/store.js';
test('titles are trimmed and empty or oversized entries rejected',()=>{assert.equal(createItem(' 牛乳 ').title,'牛乳');assert.equal(createItem('  '),null);assert.equal(createItem('a'.repeat(201)),null);});
test('completion and undo persist across reloads',()=>{let value=null;const storage={getItem:()=>value,setItem:(k,v)=>value=v};const items=[createItem('牛乳'),createItem('パン')];write(storage,toggle(items,items[0].id));const loaded=read(storage);assert.equal(loaded[0].done,true);assert.equal(loaded[1].done,false);write(storage,toggle(loaded,items[0].id));assert.equal(read(storage)[0].done,false);});
test('corrupt data and failed writes surface errors',()=>{assert.throws(()=>read({getItem:()=>'{'}));assert.throws(()=>read({getItem:()=>'[{}]'}));assert.throws(()=>write({setItem:()=>{throw Error('quota');}},[]));});
