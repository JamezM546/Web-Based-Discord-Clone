// Load test-specific env for host-side `npm test` (localhost DB).
// When tests run via `docker compose run backend npm test`, Compose already sets
// DATABASE_* / DATABASE_URL; dotenv does not override existing env vars.
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env.test'),
  override: false,
});

const { app, initAll } = require('../server');
const { pool } = require('../config/database');
const supertest = require('supertest');

const request = supertest(app);

let authToken = null;
let secondAuthToken = null;
let _initPromise = null;

const login = async (email = 'nafisa@example.com', password = 'password123') => {
  const res = await request.post('/api/auth/login').send({ email, password });
  return res.body.data?.token;
};

const ensureInit = () => {
  if (!_initPromise) {
    _initPromise = (async () => {
      await initAll();
      authToken = await login('nafisa@example.com', 'password123');
      secondAuthToken = await login('ashraf@example.com', 'password123');
    })();
  }
  return _initPromise;
};

const cleanup = () => pool.end();

module.exports = {
  request,
  getToken: () => authToken,
  getSecondToken: () => secondAuthToken,
  login,
  ensureInit,
  cleanup,
};
