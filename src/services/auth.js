const crypto = require('crypto');
const cookie = require('cookie');
const config = require('../config');

function sign(value) {
  return crypto.createHmac('sha256', config.sessionSecret).update(value).digest('hex');
}

function createSession(username) {
  const payload = JSON.stringify({
    username,
    exp: Date.now() + config.sessionTtlMs
  });
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

function verifySession(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (sign(encoded) !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (_error) {
    return null;
  }
}

function parseCookies(header) {
  return cookie.parse(header || '');
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('atithy_admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: Math.floor(config.sessionTtlMs / 1000),
      path: '/'
    })
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('atithy_admin_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/'
    })
  );
}

function validateCredentials(username, password) {
  return Boolean(config.adminPassword && username === config.adminUsername && password === config.adminPassword);
}

function requireAdmin(req, res, next) {
  const session = verifySession(parseCookies(req.headers.cookie).atithy_admin_session);
  if (!session) {
    if (req.path.startsWith('/admin/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/admin/login');
  }
  req.admin = session;
  return next();
}

module.exports = {
  createSession,
  verifySession,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  validateCredentials,
  requireAdmin
};
