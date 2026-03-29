// Shared helpers for all CaseFlow pages

function getToken() {
  return localStorage.getItem('CaseFlow_token');
}

function getUser() {
  const u = localStorage.getItem('CaseFlow_user');
  return u ? JSON.parse(u) : null;
}

function logout() {
  localStorage.removeItem('CaseFlow_token');
  localStorage.removeItem('CaseFlow_user');
  window.location.href = '/pages/login.html';
}

function requireAuth(role) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/pages/login.html';
    return false;
  }
  if (role && user.role !== role) {
    alert('Access denied: insufficient role.');
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() };
}

function statusBadge(status) {
  const map = { Open: 'warning', Active: 'primary', Closed: 'secondary' };
  return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
}
