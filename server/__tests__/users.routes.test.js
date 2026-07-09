const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const usersRouter = require('../routes/users');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/users', usersRouter);
  return app;
}

describe('routes /api/users (base SQLite en mémoire)', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
  });

  test('inscrit un nouvel utilisateur et pose un cookie de session', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'jean@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('jean@example.com');
    expect(res.body.password).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test("rejette un email invalide", async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(422);
  });

  test('rejette un mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'short@example.com', password: '123' });
    expect(res.status).toBe(422);
  });

  test('rejette un email déjà utilisé', async () => {
    await request(app).post('/api/users/register').send({ email: 'dup@example.com', password: 'password123' });
    const res = await request(app).post('/api/users/register').send({ email: 'dup@example.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('connexion : accepte les bons identifiants, rejette les mauvais', async () => {
    await request(app).post('/api/users/register').send({ email: 'login@example.com', password: 'password123' });

    const wrongPassword = await request(app)
      .post('/api/users/login')
      .send({ email: 'login@example.com', password: 'wrong-password' });
    expect(wrongPassword.status).toBe(401);

    const ok = await request(app)
      .post('/api/users/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.headers['set-cookie']).toBeDefined();
  });

  test('GET /me exige une authentification', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  test("GET /me retourne l'utilisateur courant une fois authentifié", async () => {
    const register = await request(app)
      .post('/api/users/register')
      .send({ email: 'me@example.com', password: 'password123' });
    const cookie = register.headers['set-cookie'];

    const res = await request(app).get('/api/users/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });
});
