/**
 * Local browser notifications (via the Service Worker Notification API).
 *
 * There is no push server in this stack (GitHub Pages + Apps Script can't run
 * a persistent push service), so these are "local" notifications: they fire
 * only while the browser can run the app's service worker — i.e. shortly
 * after opening the app, or automatically if it's installed as a PWA and the
 * OS keeps it running. For true "wake the phone up while the app is fully
 * closed" alerts, see the optional email-digest feature in the README
 * (Apps Script time-driven trigger).
 */

const Notify = {
  PERMISSION_KEY: 'note_notify_permission_asked',
  SEEN_KEY: 'note_notify_seen', // dedupe so we don't repeat the same alert every reload

  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  status() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  async requestPermission() {
    if (!this.isSupported()) { toast('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน'); return; }
    const result = await Notification.requestPermission();
    localStorage.setItem(this.PERMISSION_KEY, '1');
    this.refreshButton();
    if (result === 'granted') toast('เปิดการแจ้งเตือนแล้ว');
    else if (result === 'denied') toast('คุณปิดการแจ้งเตือนไว้ — เปลี่ยนได้ในการตั้งค่าเบราว์เซอร์');
    return result;
  },

  refreshButton() {
    const btn = document.getElementById('notifyToggleBtn');
    if (!btn) return;
    const s = this.status();
    if (s === 'unsupported') { btn.style.display = 'none'; return; }
    btn.textContent = s === 'granted' ? '🔔 การแจ้งเตือนเปิดอยู่' : '🔕 เปิดการแจ้งเตือน';
    btn.classList.toggle('is-on', s === 'granted');
  },

  _seenSet() {
    try { return new Set(JSON.parse(localStorage.getItem(this.SEEN_KEY) || '[]')); }
    catch (e) { return new Set(); }
  },

  _saveSeen(set) {
    // Keep only the last 300 to avoid unbounded growth
    localStorage.setItem(this.SEEN_KEY, JSON.stringify([...set].slice(-300)));
  },

  async fire(key, title, body) {
    if (this.status() !== 'granted') return;
    const seen = this._seenSet();
    if (seen.has(key)) return;
    seen.add(key);
    this._saveSeen(seen);

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: key,
        data: { url: './dashboard.html' }
      });
    } catch (e) {
      // Fallback for browsers without an active SW registration yet
      try { new Notification(title, { body, icon: 'icons/icon-192.png' }); } catch (e2) {}
    }
  },

  /** Call once after dashboard/task data loads. Checks due-today, overdue, and today's holidays. */
  async checkAndNotify({ tasks = [], holidays = [], events = [] }) {
    if (this.status() !== 'granted') return;

    const todayStr = fmtDateInput(new Date());

    tasks.forEach(t => {
      if (!t.dueDate || t.status === 'done') return;
      const due = (t.dueDate || '').slice(0, 10);
      if (due === todayStr) {
        this.fire('due-' + todayStr + '-' + t.id, 'งานครบกำหนดวันนี้', t.title);
      } else if (due < todayStr) {
        this.fire('overdue-' + todayStr + '-' + t.id, 'งานเลยกำหนดแล้ว', t.title);
      }
    });

    holidays.forEach(h => {
      if ((h.date || '').slice(0, 10) === todayStr) {
        this.fire('holiday-' + todayStr + '-' + h.date, 'วันนี้เป็นวันหยุด', h.name);
      }
    });

    events.forEach(e => {
      if ((e.date || '').slice(0, 10) === todayStr && e.type === 'reminder') {
        this.fire('reminder-' + todayStr + '-' + e.id, 'เตือนความจำวันนี้', e.title);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Notify.refreshButton());
