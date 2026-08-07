/**
 * Registers the service worker and wires up the "ติดตั้งแอป" (Add to Home Screen)
 * button that appears in the sidebar once the browser says the app is installable.
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Offline shell just won't be available — the app still works online.
    });
  });
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('installAppBtn');
  if (btn) btn.classList.add('show');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById('installAppBtn');
  if (btn) btn.classList.remove('show');
  toast('ติดตั้งแอปเรียบร้อยแล้ว');
});

async function triggerInstallPrompt() {
  if (!deferredInstallPrompt) {
    toast('เบราว์เซอร์นี้ติดตั้งแอปผ่านเมนู "เพิ่มไปยังหน้าจอหลัก" ได้เลย');
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('installAppBtn')?.classList.remove('show');
}
