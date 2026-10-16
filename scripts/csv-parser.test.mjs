import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseCSV,csvCell} from '../worker/crm-core.mjs';

test('CSV rejects text after a closing quote instead of silently joining it',()=>{
  assert.throws(()=>parseCSV('name,notes\n"Alex"trailing,review'),/CSV/);
  assert.throws(()=>parseCSV('name,notes\n"Alex,review'),/CSV/);
});
test('CSV preserves identifiers, formulas as text, Unicode and embedded line endings',()=>{
  const rows=parseCSV('\ufeffid,name,notes\r\n000123,张三,"first\r\nsecond ""quoted"""\r\n000124,李四,=1+1');
  assert.equal(rows[0].id,'000123');assert.equal(rows[0].name,'张三');assert.equal(rows[0].notes,'first\r\nsecond "quoted"');
  assert.equal(rows[1].notes,'=1+1');assert(csvCell(rows[1].notes).startsWith('"\''));
});
test('CSV rejects excess rows, duplicate/prototype headers and mismatched columns',()=>{
  assert.throws(()=>parseCSV('name\na\nb',{maxRows:1}),/Too many/);
  assert.throws(()=>parseCSV('name,name\na,b'),/headers/);
  assert.throws(()=>parseCSV('__proto__,name\na,b'),/headers/);
  assert.throws(()=>parseCSV('name,notes\na,b,c'),/mismatch/);
  assert.throws(()=>parseCSV('name\na',{maxRows:Infinity}),/limit/);
  assert.deepEqual(parseCSV(' \r\n\r\n'),[]);
});
test('built browser and Worker use the same parser without external runtime imports',()=>{
  const built=readFileSync(new URL('../dist/server/index.js',import.meta.url),'utf8'),page=JSON.parse(built.match(/^const PAGE=(.+);\n/)[1]);
  assert(!built.includes("from 'papaparse'"));assert(!page.includes("from './csv-parser.mjs'"));
  const code=page.match(/<script>\n'use strict';([\s\S]*?)<\/script>/)[1];
  const begin=code.indexOf('const csvParserRuntime='),end=code.indexOf('// Conversation, dashboard, voice and cloud workspace UI.');
  const sandbox={crypto:globalThis.crypto,structuredClone,Intl};vm.createContext(sandbox);vm.runInContext(code.slice(begin,end),sandbox);
  assert.equal(vm.runInContext('parseCSV(\'id,name\\n0001,测试\')[0].id',sandbox),'0001');
  assert.throws(()=>vm.runInContext('parseCSV(\'name,notes\\n"Alex"trailing,x\')',sandbox),/CSV/);
});
