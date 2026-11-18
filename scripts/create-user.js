// Admin-only account creation for this MVP: there is no self-serve sign-up
// and no automated password reset (no email-sending infrastructure is
// confirmed to exist yet — see README "What's not built yet"). Whoever runs
// the server creates accounts with this script, and resets a forgotten
// password by running it again with the same email.
//
// Usage: node scripts/create-user.js "name@littlestarmedia.com" "Full Name"
// It then prompts for a password on stdin (not echoed to the terminal).
const readline = require('readline');
const db = require('../server/db');
const { hashPassword } = require('../server/auth');

function promptPassword(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdin = process.openStdin();
    process.stdin.on('data', (char) => {
      const str = char.toString();
      if (str === '\n' || str === '\r' || str === '\u0004') return;
      readline.moveCursor(process.stdout, -1, 0);
      readline.clearLine(process.stdout, 1);
      process.stdout.write('*');
    });
    rl.question(question, (value) => {
      rl.history = rl.history.slice(1);
      rl.close();
      stdin.pause();
      process.stdout.write('\n');
      resolve(value);
    });
  });
}

async function main() {
  const [, , email, name] = process.argv;
  if (!email || !name) {
    console.error('Usage: node scripts/create-user.js "name@littlestarmedia.com" "Full Name"');
    process.exitCode = 1;
    return;
  }
  const password = await promptPassword('Password for this account: ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }
  const passwordHash = hashPassword(password);
  await db.query(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
    [email.toLowerCase(), name, passwordHash]
  );
  console.log(`Account ready for ${email}.`);
  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
