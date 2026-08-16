// ─────────────────────────────────────────────
//  CaseFlow Shared Utilities & Helpers
// ─────────────────────────────────────────────

/* ── Auth Helpers ── */
function getToken()  { return localStorage.getItem('CaseFlow_token'); }
function getUser()   { const u = localStorage.getItem('CaseFlow_user'); return u ? JSON.parse(u) : null; }

function logout() {
  localStorage.removeItem('CaseFlow_token');
  localStorage.removeItem('CaseFlow_user');
  window.location.href = '/pages/login.html';
}

function requireAuth(role) {
  const token = getToken(), user = getUser();
  if (!token || !user) { window.location.href = '/pages/login.html'; return false; }
  if (role && user.role !== role) {
    showToast('Access denied: insufficient role.', 'error');
    setTimeout(() => { window.location.href = '/pages/login.html'; }, 1500);
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

/* ── Toast Notification System ── */
function showToast(message, type = 'success') {
  let container = document.getElementById('cf-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'cf-toast-container';
    container.style.cssText = `
      position: fixed; top: 1.25rem; right: 1.25rem; z-index: 9999;
      display: flex; flex-direction: column; gap: .5rem; max-width: 360px;
    `;
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const colors = {
    success: 'linear-gradient(135deg,#11998e,#38ef7d)',
    error:   'linear-gradient(135deg,#c0392b,#e74c3c)',
    warning: 'linear-gradient(135deg,#f39c12,#f1c40f)',
    info:    'linear-gradient(135deg,#1e3c72,#2a5298)'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #fff; border-radius: 12px; padding: .85rem 1.1rem;
    box-shadow: 0 8px 30px rgba(0,0,0,.18); display: flex; align-items: flex-start; gap: .65rem;
    animation: cfSlideIn .25s ease; border-left: 4px solid transparent;
    border-image: ${colors[type]} 1;
    font-family: 'Inter', sans-serif; font-size: .875rem; line-height: 1.4;
    max-width: 100%; word-break: break-word;
  `;
  toast.innerHTML = `<span style="font-size:1.1rem;flex-shrink:0">${icons[type]}</span><span>${message}</span>`;

  if (!document.getElementById('cf-toast-styles')) {
    const s = document.createElement('style');
    s.id = 'cf-toast-styles';
    s.textContent = `
      @keyframes cfSlideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
      @keyframes cfSlideOut{ to{opacity:0;transform:translateX(30px)} }
    `;
    document.head.appendChild(s);
  }

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'cfSlideOut .25s ease forwards';
    setTimeout(() => toast.remove(), 270);
  }, type === 'error' ? 5000 : 3500);
}

/* ── Inline Zod Validation Error Display ── */
function showFieldErrors(errors) {
  // Clear any existing error messages
  document.querySelectorAll('.cf-field-error').forEach(el => el.remove());
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  if (!errors || !Array.isArray(errors)) return;
  errors.forEach(({ field, message }) => {
    const input = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
    if (!input) return;
    input.classList.add('is-invalid');
    const errDiv = document.createElement('div');
    errDiv.className = 'invalid-feedback cf-field-error';
    errDiv.textContent = message;
    input.parentNode.insertBefore(errDiv, input.nextSibling);
  });
}

function clearFieldErrors() {
  document.querySelectorAll('.cf-field-error').forEach(el => el.remove());
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

/* ── Loading Skeleton Helper ── */
function skeletonRow(cols) {
  const cells = Array(cols).fill('<td><div class="cf-skeleton" style="height:1rem;border-radius:6px;background:linear-gradient(90deg,#e8ecf0 25%,#d4dae2 50%,#e8ecf0 75%);background-size:400% 100%;animation:cfShimmer 1.4s ease infinite"></div></td>').join('');
  return `<tr>${cells}</tr>`;
}

function skeletonCard() {
  return `<div class="cf-skeleton" style="height:80px;border-radius:12px;background:linear-gradient(90deg,#e8ecf0 25%,#d4dae2 50%,#e8ecf0 75%);background-size:400% 100%;animation:cfShimmer 1.4s ease infinite;margin-bottom:1rem"></div>`;
}

if (!document.getElementById('cf-shimmer-style')) {
  const s = document.createElement('style');
  s.id = 'cf-shimmer-style';
  s.textContent = `@keyframes cfShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
  document.head.appendChild(s);
}

/* ── Pagination Helper ── */
function renderPagination(containerId, pagination, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!pagination || pagination.totalPages <= 1) { el.innerHTML = ''; return; }
  const { page, totalPages } = pagination;
  let html = '<nav><ul class="pagination justify-content-center mb-0">';
  html += `<li class="page-item ${page <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">‹</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">›</a></li>`;
  html += '</ul></nav>';
  el.innerHTML = html;
  el.querySelectorAll('[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const p = parseInt(a.dataset.page);
      if (p >= 1 && p <= totalPages) onPageChange(p);
    });
  });
}
