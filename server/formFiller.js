const fs = require('fs');
const logger = require('./logger');

// Playwright launches a real Chromium — loaded lazily so the server boots fine
// even if the offer never needs the form-filling fallback.
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    const { chromium } = require('playwright');
    browserPromise = chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

const COOKIE_BUTTON_LABELS = ["Tout accepter", "Accepter", "J'accepte", 'Accept all', 'Accept'];
const APPLY_BUTTON_LABELS = ['Postuler', 'Je postule', 'Postuler à cette offre', 'Apply now', 'Apply', 'Apply for this job'];
const SUCCESS_TEXT = /merci|candidature (a été |bien )?(envoyée|reçue|transmise)|thank you|application (has been |was )?(received|submitted|sent)|success|confirmation/i;

const FIELD_PATTERNS = {
  email: /e-?mail|courriel/i,
  phone: /t[ée]l[ée]phone|\bphone\b|mobile|portable/i,
  firstName: /pr[ée]nom|first[\s-]?name|given[\s-]?name/i,
  lastName: /\bnom\b(?!\s*complet)|last[\s-]?name|surname|family[\s-]?name/i,
  fullName: /nom\s*(et\s*pr[ée]nom|complet)|full[\s-]?name|your[\s-]?name/i,
  coverLetter: /lettre\s*de\s*motivation|motivation|message|cover[\s-]?letter|pourquoi/i,
  cv: /\bcv\b|r[ée]sum[ée]|curriculum/i,
};

async function clickFirstMatch(page, role, labels, timeout = 1200) {
  for (const label of labels) {
    try {
      const el = page.getByRole(role, { name: new RegExp(label, 'i') }).first();
      if (await el.isVisible({ timeout })) {
        await el.click({ timeout: 3000 });
        return true;
      }
    } catch {}
  }
  return false;
}

async function labelTextFor(page, id) {
  if (!id || /["\\]/.test(id)) return '';
  try {
    const label = page.locator(`label[for="${id}"]`).first();
    if (await label.count() > 0) return (await label.innerText().catch(() => '')) || '';
  } catch {}
  return '';
}

/**
 * Best-effort generic form-filling fallback for job offers with no usable
 * contact email. Not every site is fillable — a failure here just means the
 * offer falls back to being skipped (same as before this feature existed).
 */
async function attemptFormApplication({ offerUrl, candidateName, candidateEmail, candidatePhone, coverLetterText, cvPath }) {
  if (!offerUrl) return { ok: false, reason: "Aucune URL d'offre disponible" };

  let context = null;
  let page = null;
  try {
    const browser = await getBrowser();
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; AutocandidatBot/1.0; +https://autocandidat.fr)',
    });
    page = await context.newPage();
    page.setDefaultTimeout(15000);

    await page.goto(offerUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    await clickFirstMatch(page, 'button', COOKIE_BUTTON_LABELS);

    // Many offer pages show the job description first and reveal the
    // application form behind a "Postuler" / "Apply" button.
    const hadFormAlready = (await page.locator('form').count()) > 0;
    if (!hadFormAlready) {
      const clicked = (await clickFirstMatch(page, 'link', APPLY_BUTTON_LABELS))
        || (await clickFirstMatch(page, 'button', APPLY_BUTTON_LABELS));
      if (clicked) await page.waitForTimeout(1500);
    }

    const form = page.locator('form').first();
    if ((await form.count()) === 0) {
      return { ok: false, reason: 'Aucun formulaire de candidature détecté sur la page' };
    }

    const fields = await form.locator('input, textarea').all();
    let filledSomething = false;
    let cvUploaded = false;

    for (const field of fields) {
      const tag = await field.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'input');
      const type = tag === 'textarea' ? 'textarea' : ((await field.getAttribute('type')) || 'text').toLowerCase();
      if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'image', 'reset'].includes(type)) continue;

      const name = (await field.getAttribute('name')) || '';
      const id = (await field.getAttribute('id')) || '';
      const placeholder = (await field.getAttribute('placeholder')) || '';
      const ariaLabel = (await field.getAttribute('aria-label')) || '';
      const labelText = await labelTextFor(page, id);
      const hay = `${name} ${id} ${placeholder} ${ariaLabel} ${labelText}`;

      try {
        if (type === 'file') {
          if (FIELD_PATTERNS.cv.test(hay) && cvPath && fs.existsSync(cvPath)) {
            await field.setInputFiles(cvPath);
            cvUploaded = true;
            filledSomething = true;
          }
          continue;
        }

        if (type === 'email' || FIELD_PATTERNS.email.test(hay)) {
          if (candidateEmail) { await field.fill(candidateEmail); filledSomething = true; }
        } else if ((type === 'tel' || FIELD_PATTERNS.phone.test(hay)) && candidatePhone) {
          await field.fill(candidatePhone); filledSomething = true;
        } else if (FIELD_PATTERNS.fullName.test(hay) && candidateName) {
          await field.fill(candidateName); filledSomething = true;
        } else if (FIELD_PATTERNS.firstName.test(hay) && candidateName) {
          await field.fill(candidateName.split(' ')[0] || candidateName); filledSomething = true;
        } else if (FIELD_PATTERNS.lastName.test(hay) && candidateName) {
          await field.fill(candidateName.split(' ').slice(1).join(' ') || candidateName); filledSomething = true;
        } else if (type === 'textarea' && coverLetterText && FIELD_PATTERNS.coverLetter.test(hay)) {
          await field.fill(coverLetterText); filledSomething = true;
        }
      } catch {
        // Ignore individual field failures — a partially filled form is still worth submitting.
      }
    }

    if (!filledSomething) {
      return { ok: false, reason: 'Aucun champ du formulaire reconnu (structure non supportée)' };
    }

    const submitBtn = form.locator('button[type="submit"], input[type="submit"]').first();
    if ((await submitBtn.count()) === 0) {
      return { ok: false, reason: "Bouton d'envoi introuvable" };
    }

    const urlBeforeSubmit = page.url();
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}),
      submitBtn.click({ timeout: 5000 }),
    ]);
    await page.waitForTimeout(1500);

    const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
    if (SUCCESS_TEXT.test(bodyText) || page.url() !== urlBeforeSubmit) {
      return { ok: true, cvUploaded };
    }

    return { ok: false, reason: "Confirmation d'envoi non détectée après la soumission" };
  } catch (err) {
    return { ok: false, reason: (err && err.message ? err.message : 'Erreur automatisation formulaire').slice(0, 200) };
  } finally {
    try { await page?.close(); } catch {}
    try { await context?.close(); } catch (err) { logger.warn('formFiller context close failed', { err: err.message }); }
  }
}

module.exports = { attemptFormApplication };
