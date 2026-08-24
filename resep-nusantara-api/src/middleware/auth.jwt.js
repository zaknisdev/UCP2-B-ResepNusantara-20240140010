const jwt = require('jsonwebtoken');

function authJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('[DEBUG authJwt] method=%s url=%s headers=%o', req.method, req.originalUrl, req.headers);

  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
  }
}

module.exports = authJwt;
