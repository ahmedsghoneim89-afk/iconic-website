#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const store = require('./db');
const auth = require('./auth');

const [cmd, ...args] = process.argv.slice(2);
const ask = (q, hidden) => new Promise((res) => {
  const rl = require('node:readline').createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) { rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); }; }
  rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); res(a); });
});
(async () => {
  try {
    if (cmd === 'create-admin') {
      const email = args[0] || await ask('Email: '), pw = process.env.ADMIN_PASSWORD || await ask('Password (10+ characters): ', true);
      auth.createUser(email, pw); console.log('Admin created: ' + email.toLowerCase());
    } else if (cmd === 'set-password') {
      const email = args[0] || await ask('Email: '), pw = process.env.ADMIN_PASSWORD || await ask('New password (10+ characters): ', true);
      auth.setPasswordFor(email, pw); console.log('Password changed. Every session for this user was signed out.');
    } else if (cmd === 'backup') {
      const dest = path.resolve(args[0] || path.join(cfg.dataDir, 'backups', 'iconic-' + new Date().toISOString().slice(0, 10) + '.db'));
      fs.mkdirSync(path.dirname(dest), { recursive: true }); if (fs.existsSync(dest)) fs.unlinkSync(dest);
      store.db.exec("VACUUM INTO '" + dest.replace(/'/g, "''") + "'");
      console.log('Database copy written to ' + dest + '\nImages live in ' + path.join(cfg.dataDir, 'uploads') + ' — copy that folder too.');
    } else if (cmd === 'users') {
      store.db.prepare('SELECT email, created_at FROM users').all().forEach((u) => console.log(u.email, new Date(u.created_at).toISOString()));
    } else {
      console.log('Usage: node server/cli.js <command>\n  create-admin [email]   create an admin account\n  set-password [email]   change a password (signs that user out everywhere)\n  backup [file]          write a consistent copy of the database\n  users                  list admin accounts');
    }
  } catch (e) { console.error('Error: ' + e.message); process.exitCode = 1; }
})();
