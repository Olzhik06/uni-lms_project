import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const rootDir = new URL('../../..', import.meta.url);
const workspaceDir = fileURLToPath(rootDir);
const frontendUrl = process.env.SMOKE_FRONTEND_URL || 'http://127.0.0.1:3000';
const backendUrl = process.env.SMOKE_BACKEND_URL || 'http://127.0.0.1:4000';
const testUser = {
  email: `smoke.${Date.now()}@example.com`,
  password: 'Smoke123!',
  fullName: 'Frontend Smoke User',
};
const childProcesses = [];

function log(step, message) {
  console.log(`[smoke:${step}] ${message}`);
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  apply(headers) {
    const cookieHeader = [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }
  }

  remember(response) {
    for (const cookie of getSetCookies(response.headers)) {
      const [nameValue] = cookie.split(';');
      const separator = nameValue.indexOf('=');
      if (separator === -1) continue;
      const name = nameValue.slice(0, separator).trim();
      const value = nameValue.slice(separator + 1).trim();
      if (!value) {
        this.cookies.delete(name);
        continue;
      }
      this.cookies.set(name, value);
    }
  }
}

function spawnServer(name, args) {
  const child = spawn('pnpm', args, {
    cwd: workspaceDir,
    env: { ...process.env, CI: '1' },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', chunk => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on('data', chunk => process.stderr.write(`[${name}] ${chunk}`));
  childProcesses.push(child);
  return child;
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForUrl(url, label, timeoutMs = 180_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) {
        return response;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1_000));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

async function ensureServer(name, url, args) {
  if (await isUrlReady(url)) {
    log('bootstrap', `using existing ${name} server at ${url}`);
    return;
  }

  spawnServer(name, args);
  await waitForUrl(url, name);
}

async function request(url, options = {}, jar) {
  const headers = new Headers(options.headers || {});
  if (jar) {
    jar.apply(headers);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    redirect: 'manual',
  });

  if (jar) {
    jar.remember(response);
  }

  return response;
}

async function readText(response) {
  return response.text();
}

async function expectStatus(response, expected, context) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  const body = await response.text();
  assert.ok(
    allowed.includes(response.status),
    `${context}: expected status ${allowed.join(' or ')}, got ${response.status}\n${body}`,
  );
  return body;
}

async function runChecks() {
  log('bootstrap', 'starting backend and frontend dev servers');
  await ensureServer('backend', `${backendUrl}/api/docs`, ['--filter', '@uni-lms/backend', 'dev']);
  await ensureServer('frontend', `${frontendUrl}/login`, ['--filter', '@uni-lms/frontend', 'dev']);

  log('public', 'checking auth entry pages');
  const loginHtml = await readText(await request(`${frontendUrl}/login`));
  assert.match(loginHtml, /Welcome to UniLMS/i, 'login page should render welcome copy');

  const registerHtml = await readText(await request(`${frontendUrl}/register`));
  assert.match(registerHtml, /Create Account/i, 'register page should render account creation copy');

  const jar = new CookieJar();

  log('auth', 'registering a fresh smoke user through frontend proxy');
  const registerResponse = await request(`${frontendUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(testUser),
  }, jar);
  const registerBodyText = await expectStatus(registerResponse, 201, 'register');
  const registerBody = JSON.parse(registerBodyText);
  assert.equal(registerBody.user.email, testUser.email, 'register should return the created user');
  assert.equal(registerBody.user.role, 'STUDENT', 'register should create a student user');

  log('auth', 'verifying session through the frontend API proxy');
  const meResponse = await request(`${frontendUrl}/api/auth/me`, {}, jar);
  const meBodyText = await expectStatus(meResponse, 200, 'auth me after register');
  const meBody = JSON.parse(meBodyText);
  assert.equal(meBody.email, testUser.email, 'auth me should return the registered user');

  log('routes', 'checking key authenticated app routes');
  for (const route of ['/dashboard', '/courses', '/profile', '/notifications']) {
    const response = await request(`${frontendUrl}${route}`, {}, jar);
    await expectStatus(response, 200, `page ${route}`);
  }

  const coursesResponse = await request(`${frontendUrl}/api/courses`, {}, jar);
  const coursesBodyText = await expectStatus(coursesResponse, 200, 'courses API');
  const coursesBody = JSON.parse(coursesBodyText);
  assert.ok(Array.isArray(coursesBody) || Array.isArray(coursesBody.items), 'courses API should return a list payload');

  log('auth', 'logging out and ensuring the cookie session is gone');
  const logoutResponse = await request(`${frontendUrl}/api/auth/logout`, {
    method: 'POST',
  }, jar);
  await expectStatus(logoutResponse, 200, 'logout');

  const afterLogout = await request(`${frontendUrl}/api/auth/me`, {}, jar);
  await expectStatus(afterLogout, 401, 'auth me after logout');

  log('auth', 'logging back in through the same frontend proxy');
  const loginResponse = await request(`${frontendUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  }, jar);
  const loginBodyText = await expectStatus(loginResponse, 200, 'login');
  const loginBody = JSON.parse(loginBodyText);
  assert.equal(loginBody.user.email, testUser.email, 'login should return the same user');

  const meAfterLogin = await request(`${frontendUrl}/api/auth/me`, {}, jar);
  await expectStatus(meAfterLogin, 200, 'auth me after login');

  log('done', 'frontend smoke checks passed');
}

async function cleanup() {
  await Promise.all(childProcesses.map(child => new Promise(resolve => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }

    child.once('exit', () => resolve());
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
    setTimeout(() => {
      if (child.exitCode === null) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }
    }, 5_000).unref();
  })));
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await cleanup();
    process.exit(1);
  });
}

try {
  await runChecks();
} finally {
  await cleanup();
  process.exit(process.exitCode ?? 0);
}
