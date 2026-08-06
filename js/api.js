/**
 * Thin wrapper around fetch() for talking to the Apps Script backend.
 *
 * IMPORTANT: requests are sent as POST with Content-Type: text/plain.
 * This is intentional — Apps Script Web Apps cannot respond to CORS
 * "preflight" (OPTIONS) requests, so a request must qualify as a
 * "simple request" to avoid the browser sending one. text/plain keeps
 * it simple; the body itself is still a JSON string, which Code.gs
 * parses on the other end.
 */

const Api = {
  async call(action, payload = {}) {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('PASTE_YOUR') !== -1) {
      throw new Error('ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ใน js/config.js');
    }
    const body = JSON.stringify({ action, ...payload });
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body
    });
    if (!res.ok) throw new Error('เครือข่ายมีปัญหา (' + res.status + ')');
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    return data;
  }
};
