const express = require('express');
const {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserPassword,
  createTokens,
  verifyRefreshToken,
  toPublicUser,
} = require('../authService');

const router = express.Router();

function buildValidationError(details) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details,
    },
  };
}

function setRefreshTokenCookie(res, refreshToken, rememberMe) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  if (rememberMe) {
    const days = Number(process.env.REFRESH_TOKEN_COOKIE_DAYS || 7);
    options.maxAge = days * 24 * 60 * 60 * 1000;
  }

  res.cookie('refreshToken', refreshToken, options);
}

router.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body || {};

  const details = {};
  if (!name) details.name = ['required'];
  if (!email) details.email = ['required'];
  if (!password) details.password = ['required'];
  if (password && password.length < 8) {
    details.password = [...(details.password || []), 'min_length_8'];
  }
  if (password && confirmPassword && password !== confirmPassword) {
    details.confirmPassword = ['mismatch'];
  }

  if (Object.keys(details).length > 0) {
    return res.status(400).json(buildValidationError(details));
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'email is already registered',
      },
    });
  }

  try {
    const user = await createUser({
      email,
      displayName: name,
      password,
    });

    const { accessToken, refreshToken } = createTokens(user);
    setRefreshTokenCookie(res, refreshToken, true);

    return res.status(201).json({
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Error in /api/auth/register', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user',
      },
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body || {};

  const details = {};
  if (!email) details.email = ['required'];
  if (!password) details.password = ['required'];

  if (Object.keys(details).length > 0) {
    return res.status(400).json(buildValidationError(details));
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }

  try {
    const isMatch = await verifyUserPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const { accessToken, refreshToken } = createTokens(user);
    setRefreshTokenCookie(res, refreshToken, Boolean(rememberMe));

    return res.json({
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Error in /api/auth/login', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login',
      },
    });
  }
});

router.post('/refresh', (req, res) => {
  const cookieToken = req.cookies && req.cookies.refreshToken;
  const bodyToken = req.body && req.body.refreshToken;
  const token = cookieToken || bodyToken;

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'refresh token is required',
      },
    });
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = findUserById(payload.userId);

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found for refresh token',
        },
      });
    }

    const { accessToken, refreshToken } = createTokens(user);
    setRefreshTokenCookie(res, refreshToken, true);

    return res.json({
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Error in /api/auth/refresh', err);
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      },
    });
  }
});

module.exports = router;
