const { encrypt, decrypt } = require('../crypto');

describe('crypto (chiffrement des identifiants SMTP/OAuth)', () => {
  test('round-trip: encrypt puis decrypt retourne le texte original', () => {
    const plain = 'super-secret-smtp-password';
    const encrypted = encrypt(plain);
    expect(encrypted).not.toBe(plain);
    expect(encrypted.startsWith('enc:')).toBe(true);
    expect(decrypt(encrypted)).toBe(plain);
  });

  test('est idempotent sur une valeur déjà chiffrée', () => {
    const encrypted = encrypt('hello');
    expect(encrypt(encrypted)).toBe(encrypted);
  });

  test('laisse passer une valeur legacy en clair au déchiffrement', () => {
    expect(decrypt('plain-legacy-value')).toBe('plain-legacy-value');
  });

  test('laisse passer les valeurs falsy sans modification', () => {
    expect(encrypt('')).toBe('');
    expect(encrypt(null)).toBe(null);
    expect(decrypt('')).toBe('');
    expect(decrypt(null)).toBe(null);
  });

  test('retourne le texte tel quel si le chiffré est corrompu', () => {
    const corrupted = 'enc:not:valid:hex';
    expect(decrypt(corrupted)).toBe(corrupted);
  });
});
