// Which environment the suite runs against. Every spec, helper and tool resolves its URLs
// from here, so switching environments is one variable rather than 40-odd edits.
//
//   npm run test:smoke                                    # staging (the default)
//   TC_BASE_URL=https://release.registertovote.london ...  # release
//   ./tools/run-tests.sh --smoke --release                 # same thing, spelled shorter
//
// Note the session cookie in `.env` (TC_ADMIN_SESSION) is issued by one specific
// environment and will not authenticate against another — switching environments means
// supplying that environment's own session.

const DEFAULT_BASE_URL = 'https://test.registertovote.london';

// Production is never a valid target for this suite: the specs create, edit and delete
// real content. Refuse loudly rather than discovering it from the damage afterwards.
const PRODUCTION_HOSTS = new Set(['registertovote.london', 'www.registertovote.london']);

const BASE_URL = (process.env.TC_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');

let host;
try {
  ({ host } = new URL(BASE_URL));
} catch (e) {
  throw new Error(`TC_BASE_URL is not a valid URL: "${BASE_URL}"`);
}

if (PRODUCTION_HOSTS.has(host)) {
  throw new Error(
    `Refusing to run against production (${host}). These tests create, edit and delete ` +
    'content. Point TC_BASE_URL at a test or release environment instead.'
  );
}

// Joins a path onto the base URL. `url('/user/login')` and `url('user/login')` both work.
function url(path = '/') {
  return `${BASE_URL}/${String(path).replace(/^\/+/, '')}`;
}

module.exports = { BASE_URL, DEFAULT_BASE_URL, url };
