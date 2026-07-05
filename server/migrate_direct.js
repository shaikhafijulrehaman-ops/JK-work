const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('No .env file found in server directory');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));
let dbUrl = envConfig.DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

console.log('Original DATABASE_URL host/port:', dbUrl.match(/@([^/]+)/)?.[1]);

// Replace port 6543 with 5432 if it's Supabase pooler
if (dbUrl.includes(':6543')) {
  console.log('Detected Supabase pooler port 6543. Swapping to direct port 5432 for migration...');
  dbUrl = dbUrl.replace(':6543', ':5432');
  // Remove pgbouncer=true query param if present, as direct doesn't need it
  dbUrl = dbUrl.replace('?pgbouncer=true', '');
  dbUrl = dbUrl.replace('&pgbouncer=true', '');
}

console.log('Target DATABASE_URL host/port:', dbUrl.match(/@([^/]+)/)?.[1]);

const env = { ...process.env, DATABASE_URL: dbUrl };

// Run prisma db push --accept-data-loss --force-reset
console.log('Running npx prisma db push --accept-data-loss --force-reset...');
const child = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
  env,
  shell: true,
  stdio: 'inherit',
  cwd: __dirname
});

child.on('close', (code) => {
  console.log(`Prisma process exited with code ${code}`);
  process.exit(code);
});
