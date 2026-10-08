const authService = require('../services/authService');
const sendResponse = require('../utils/sendResponse');
const asyncHandler = require('../utils/asyncHandler');

const setCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, cookieOptions);
  }
};

const register = asyncHandler(async (req, res, next) => {
  const user = await authService.registerUser(req.body);
  user.password = undefined; // Do not return password
  sendResponse(res, 201, 'User registered successfully', { user });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

  setCookies(res, accessToken, refreshToken);
  user.password = undefined;
  user.refreshToken = undefined;

  sendResponse(res, 200, 'Login successful', { user, accessToken });
});

const refresh = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAuthToken(token);

  setCookies(res, accessToken, refreshToken);

  sendResponse(res, 200, 'Token refreshed successfully', { accessToken });
});

const logout = asyncHandler(async (req, res, next) => {
  await authService.logoutUser(req.user.id);
  
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  sendResponse(res, 200, 'Logout successful');
});

const getMe = asyncHandler(async (req, res, next) => {
  sendResponse(res, 200, 'Current user profile', { user: req.user });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
