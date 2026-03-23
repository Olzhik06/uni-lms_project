import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
};

if (process.env.TEST_DATABASE_URL) {
  env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['exec', 'prisma', 'migrate', 'deploy']);
run('pnpm', ['exec', 'jest', '--runInBand']);
