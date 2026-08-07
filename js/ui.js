/**
 * Shared UI chrome (sidebar) + small generic helpers used across pages.
 */

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];

function renderSidebar(activePage) {
  const user = Auth.getUser();
  if (!user) return;
  window._currentActivePage = activePage;

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
      <div class="user-chip" onclick="openProfileModal()" style="cursor:pointer;" title="แก้ไขโปรไฟล์">
        <div class="user-avatar">${user.username.slice(0,1).toUpperCase()}</div>
        <div>
          <div class="user-name">${escapeHtml(user.username)}</div>
          <div class="user-role">${user.role === 'admin' ? 'Admin' : 'Member'}</div>
        </div>
      </div>
      <button class="side-util-btn" id="notifyToggleBtn" onclick="Notify.requestPermission()">🔕 เปิดการแจ้งเตือน</button>
      <button class="side-util-btn" id="installAppBtn" onclick="triggerInstallPrompt()">⇩ ติดตั้งแอป</button>
      <button class="logout-btn" onclick="Auth.logout()">ออกจากระบบ</button>
    </div>
  `;

  if (window.Notify) Notify.refreshButton();
  renderMobileTopbar(activePage);
}

/** Compact top bar shown only on narrow screens; toggles the sidebar drawer open/closed. */
function renderMobileTopbar(activePage) {
  let bar = document.getElementById('mobileTopbar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'mobileTopbar';
    bar.className = 'mobile-topbar';
    document.body.prepend(bar);
  }
  bar.innerHTML = `
    <button class="hamburger-btn" id="hamburgerBtn" aria-label="เมนู">☰</button>
    <div class="mobile-brand">Note<span class="dot">.</span></div>
  `;

  let backdrop = document.getElementById('sidebarBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sidebarBackdrop';
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  const sidebar = document.getElementById('sidebar');
  const closeDrawer = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  const openDrawer = () => { sidebar.classList.add('open'); backdrop.classList.add('show'); };

  document.getElementById('hamburgerBtn').addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  backdrop.addEventListener('click', closeDrawer);
  sidebar.querySelectorAll('.nav-list a').forEach(a => a.addEventListener('click', closeDrawer));
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

/**
 * Wires up a "⟳ รีเฟรช" button that re-runs the page's own data-loading
 * function IN PLACE — no navigation, no losing your spot (selected date,
 * scroll position, open modal, etc.). Every page's own `load()` function
 * already re-fetches fresh data from the server, so this just re-calls it.
 */
function wireRefreshButton(btnId, loadFn) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.classList.add('spinning');
    btn.disabled = true;
    try {
      await loadFn();
      toast('รีเฟรชแล้ว');
    } catch (err) {
      toast(err.message || 'รีเฟรชไม่สำเร็จ');
    } finally {
      btn.classList.remove('spinning');
      btn.disabled = false;
    }
  });
}

/** Opens the "edit my profile" modal (change email / password) from the sidebar user chip. */
function openProfileModal() {
  const user = Auth.getUser();
  if (!user) return;
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>โปรไฟล์ของฉัน</h3><button class="modal-close" onclick="closeModal()">×</button></div>
      <div class="modal-body">
        <div class="field"><label>ชื่อผู้ใช้</label><input type="text" value="${escapeHtml(user.username)}" disabled></div>
        <div class="field"><label>อีเมล (ใช้รับสรุปงานประจำวัน)</label><input type="email" id="pfEmail" value="${escapeHtml(user.email || '')}"></div>
        <hr style="border:none;border-top:1px solid var(--line-strong); margin:18px 0;">
        <div class="field"><label>รหัสผ่านปัจจุบัน (กรอกเฉพาะตอนเปลี่ยนรหัสผ่าน)</label><input type="password" id="pfCurrentPw"></div>
        <div class="field"><label>รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)</label><input type="password" id="pfNewPw"></div>
      </div>
      <div class="modal-foot">
        <button class="btn-ghost" onclick="closeModal()">ยกเลิก</button>
        <button class="btn" id="pfSaveBtn">บันทึก</button>
      </div>
    </div>
  `);

  document.getElementById('pfSaveBtn').addEventListener('click', async (e) => {
    const email = document.getElementById('pfEmail').value.trim();
    const newPassword = document.getElementById('pfNewPw').value;
    const currentPassword = document.getElementById('pfCurrentPw').value;
    if (newPassword && !currentPassword) { toast('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน'); return; }
    setLoading(e.target, true);
    try {
      const data = await Api.call('updateProfile', { userId: user.id, email, newPassword, currentPassword });
      Auth.setUser(data.user);
      closeModal();
      toast('บันทึกโปรไฟล์แล้ว');
      renderSidebar(window._currentActivePage);
    } catch (err) {
      toast(err.message);
      setLoading(e.target, false);
    }
  });
}
