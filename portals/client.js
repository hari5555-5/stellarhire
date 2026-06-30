// Shared API Client for StellarHire Portals

const API_BASE = '/api';

// Get portal URL - all portals served from same origin with subpaths
function getPortalUrl(role, path = '') {
  const basePaths = { welcome: '/', seeker: '/jobseeker', recruiter: '/recruiter', admin: '/admin' };
  const base = basePaths[role] || '/';
  if (base === '/') return path ? path : '/';
  // path is like '/dashboard.html' → '/recruiter/dashboard.html'
  return path ? `${base}${path}` : base + '/';
}

// REST API Helpers
async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error(`API Get Error (${endpoint}):`, err);
    throw err;
  }
}

async function apiPost(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Post Error (${endpoint}):`, err);
    throw err;
  }
}

async function apiDelete(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Delete Error (${endpoint}):`, err);
    throw err;
  }
}

// Authentication Helpers
async function loginUser(email, password, role) {
  const result = await apiPost('/auth/login', { email, password, role });
  if (result.success) {
    sessionStorage.setItem('stellar_user', JSON.stringify(result));
    return result;
  }
  return null;
}

function checkUserAuth(requiredRole) {
  const userStr = sessionStorage.getItem('stellar_user');
  if (!userStr) {
    window.location.href = 'login.html';
    return null;
  }
  const user = JSON.parse(userStr);
  if (user.role !== requiredRole) {
    sessionStorage.removeItem('stellar_user');
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function logoutUser() {
  sessionStorage.removeItem('stellar_user');
  window.location.href = 'login.html';
}

// Global hook exposures
window.getPortalUrl = getPortalUrl;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiDelete = apiDelete;
window.loginUser = loginUser;
window.checkUserAuth = checkUserAuth;
window.logoutUser = logoutUser;
