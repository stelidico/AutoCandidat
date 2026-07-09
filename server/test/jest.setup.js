// Variables d'environnement de test — chargées avant tout require('../db') ou autre module applicatif.
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-jwt-secret-not-for-production';
process.env.FRONTEND_URL = 'http://localhost:5173';
