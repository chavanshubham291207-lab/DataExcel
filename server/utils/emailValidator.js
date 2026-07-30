/**
 * emailValidator.js
 * Shared email validation utility used by auth routes.
 * Validates format, rejects disposable/temporary domains, and fake placeholder emails.
 */

// Minimal regex for RFC-compliant email format
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ─────────────────────────────────────────────────────────────
// Whitelisted demo/seed accounts stored in MongoDB.
// These bypass domain validation so existing users can log in.
// Add any seeded email addresses here.
// ─────────────────────────────────────────────────────────────
const WHITELISTED_EMAILS = new Set([
  'recruiter@example.com',
  'candidate@example.com',
  'recruiter_2@cloudscaletechnologies.com',
  'recruiter_5@datamindanalytics.com',
  'candidate_2_4710@example.com',
  'candidate_3_5820@example.com',
  'admin@example.com'
]);

// Disposable / temporary email domains to reject
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'trashmail.com', 'trashmail.net', 'trashmail.io', 'yopmail.com', 'yopmail.fr',
  'temp-mail.org', 'tempmail.com', 'dispostable.com', 'throwam.com', 'getairmail.com',
  'maildrop.cc', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
  'spam4.me', 'tempr.email', '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'minutemail.com', 'tempinbox.com', 'fakeinbox.com', 'spamgourmet.com', 'spamgourmet.org',
  'mailnull.com', 'spamcorpse.com', 'bumpymail.com', 'discard.email', 'throwaway.email',
  'spamevader.net', 'notmailinator.com', 'mailnew.com', 'spaml.com', 'maileater.com',
  'nwldx.com', 'spammotel.com', 'mailkutu.com', 'sogetthis.com', 'spamspot.com',
  'tempomail.fr', 'mailzilla.com', 'dontreg.com', 'spamfree24.org', 'safetymail.info',
  'spamfree.eu', 'e4ward.com', 'filzmail.com', 'spaml.de', 'spamthisplease.com',
  'trashdevil.com', 'trashdevil.de', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'discardmail.com', 'discardmail.de', 'spam.la', 'spam.su', 'spamify.com',
  'mohmal.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu',
  'gustr.com', 'jourrapide.com', 'rhyta.com', 'semHighlighter.com', 'superrito.com',
  'teleworm.us', 'tMailo.com', 'spambog.com', 'spambog.ru', 'spambog.de',
  'inboxkitten.com', 'getonemail.com', 'jetable.fr.nf', 'jetable.net', 'jetable.org',
  'anonymail.dk', 'despam.it', 'deadaddress.com', 'throwam.com', 'bugmenot.com',
  'tempail.com', 'getairmail.com', 'spamavert.com', 'another.com', 'binkmail.com',
  'bobmail.info', 'chammy.info', 'devnullmail.com', 'emailias.com', 'hatespam.org',
  'mailblocks.com', 'smellfear.com', 'turual.com', 'ygopro.net', 'zoemail.net',
  'fakemail.net', 'nowmymail.com', 'rklips.com', 'snakemail.com', 'spaml.com'
]);

// Explicitly fake / placeholder email local-parts to reject regardless of domain
const FAKE_LOCAL_PARTS = new Set([
  'test', 'demo', 'fake', 'example', 'placeholder', 'dummy', 'noreply', 'no-reply',
  'admin', 'anonymous', 'nobody', 'void', 'null', 'undefined', 'delete', 'invalid',
  'sample', 'guest', 'temp', 'temporary', 'throwaway', 'aaa', 'bbb', 'abc', 'xyz',
  'asdf', 'qwerty', 'zxcv', '1234', '12345', 'user', 'username', 'email'
]);

// Known fake test-only domains
const FAKE_TEST_DOMAINS = new Set([
  'example.com', 'example.net', 'example.org', 'test.com', 'test.net', 'test.org',
  'testing.com', 'local.com', 'localhost.com', 'invalid.com', 'fake.com', 'noemail.com',
  'nomail.com', 'mailtest.com'
]);

/**
 * Validates an email for use in registration/login.
 * Returns { valid: true } or { valid: false, message: "..." }.
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email address is required.' };
  }

  const clean = email.toLowerCase().trim();

  // 0. Whitelist bypass: allow known seeded demo/test accounts regardless of domain
  if (WHITELISTED_EMAILS.has(clean)) {
    return { valid: true };
  }

  // 1. Format check
  if (!EMAIL_REGEX.test(clean)) {
    return { valid: false, message: 'Please enter a valid email address format (e.g. name@company.com).' };
  }

  const [localPart, domain] = clean.split('@');

  // 2. Reject known fake test domains
  if (FAKE_TEST_DOMAINS.has(domain)) {
    return { valid: false, message: `"${domain}" is not a valid email domain. Please use your real work or personal email.` };
  }

  // 3. Reject disposable/temporary email services
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, message: 'Disposable or temporary email addresses are not allowed. Please use a real email.' };
  }

  // 4. Reject obviously fake local parts (only if combined with a suspicious domain)
  if (FAKE_LOCAL_PARTS.has(localPart)) {
    return { valid: false, message: `"${clean}" appears to be a placeholder email. Please use your real email address.` };
  }

  // 5. Local part length check
  if (localPart.length < 2) {
    return { valid: false, message: 'Email address is too short. Please enter a valid email.' };
  }

  return { valid: true };
};

module.exports = { validateEmail };
