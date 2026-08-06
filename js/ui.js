/**
 * Shared UI chrome (sidebar) + small generic helpers used across pages.
 */

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];

function renderSidebar(activePage) {
  const user = Auth.getUser();
  if (!user) return;

  const links = [
    { href: 'dashboard.html', label: 'แดชบอร์ด', icon: '⌂', key: 'dashboard' },
    { href: 'calendar.html', label: 'ปฏิทิน', icon: '▦', key: 'calendar' },
    { href: 'notes.html', label: 'บันทึก', icon: '✎', key: 'notes' },
    { href: 'tasks.html', label: 'งานที่ต้องทำ', icon: '☑', key: 'tasks' },
  ];
  if (user.role === 'admin') {
    links.push({ href: 'settings.html', label: 'ตั้งค่า (แอดมิน)', icon: '⚙', key: 'settings' });
  }

  const el = document.getElementById('sidebar');
  if (!el) return;

  el.innerHTML = `
    <div class="brand">Note<span class="dot">.</span></div>
    <div class="brand-sub">Journal &amp; Task Ledger</div>
    <ul class="nav-list">
      ${links.map(l => `
        <li><a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">
          <span class="nav-icon">${l.icon}</span> ${l.label}
        </a></li>
      `).join('')}
    </ul>
    <div class="sidebar-foot">
      <div class="user-chip">
        <div class="user-avatar">${user.username.slice(0,1).toUpperCase()}</div>
        <div>
          <div class="user-name">${escapeHtml(user.username)}</div>
          <div class="user-role">${user.role === 'admin' ? 'Admin' : 'Member'}</div>
        </div>
      </div>
      <button class="logout-btn" onclick="Auth.logout()">ออกจากระบบ</button>
    </div>
  `;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2,'0')} ${THAI_MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()+543}`;
}

function fmtDateInput(date) {
  // yyyy-mm-dd for <input type=date>
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate);
  return due < today;
}

function openModal(html) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'activeModal';
  backdrop.innerHTML = html;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.body.appendChild(backdrop);
}

function closeModal() {
  const el = document.getElementById('activeModal');
  if (el) el.remove();
}

function setLoading(btn, isLoading, labelWhenLoading = 'กำลังบันทึก...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalLabel = btn.textContent;
    btn.textContent = labelWhenLoading;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalLabel || btn.textContent;
    btn.disabled = false;
  }
}
