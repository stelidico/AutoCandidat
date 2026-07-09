const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/auth');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireAuth middleware', () => {
  test('rejette les requêtes sans cookie token', () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejette un token invalide ou expiré', () => {
    const req = { cookies: { token: 'not-a-valid-jwt' } };
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired or invalid' });
    expect(next).not.toHaveBeenCalled();
  });

  test('accepte un token valide et attache req.user', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'a@b.com', isAdmin: true }, process.env.JWT_SECRET);
    const req = { cookies: { token } };
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user-1', email: 'a@b.com', isAdmin: true });
  });
});
