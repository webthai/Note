/**
 * Renders a monthly calendar grid into `container`.
 *
 * entriesByDate: { 'yyyy-mm-dd': [{ type: 'task'|'note'|'holiday'|'reminder', title }] }
 * onSelectDay(dateStr): called when a cell is clicked
 */
function renderMonthCalendar(container, { year, month, entriesByDate, selectedDate, onSelectDay, onNavigate }) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  let cells = [];
  // Leading days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, other: true, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, other: false, date: new Date(year, month, d) });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextDay = cells.length - (startOffset + daysInMonth) + 1;
    cells.push({ day: nextDay, other: true, date: new Date(year, month + 1, nextDay) });
  }

  const dowRow = THAI_DOW.map(d => `<div class="cal-dow">${d}</div>`).join('');

  const cellsHtml = cells.map(c => {
    const dateStr = fmtDateInput(c.date);
    const entries = entriesByDate[dateStr] || [];
    const classes = ['cal-cell'];
    if (c.other) classes.push('other-month');
    if (isSameDay(c.date, today)) classes.push('today');
    if (selectedDate && dateStr === selectedDate) classes.push('selected');
    if (entries.some(e => e.type === 'holiday')) classes.push('has-holiday');

    const marks = entries.slice(0, 6).map(e => `<span class="mark ${e.type}" title="${escapeHtml(e.title)}"></span>`).join('');

    return `
      <div class="${classes.join(' ')}" data-date="${dateStr}">
        <div class="cal-daynum">${c.day}</div>
        <div class="cal-marks">${marks}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="flex-between" style="margin-bottom:14px;">
      <div class="cal-month-label mono">${THAI_MONTHS[month]} ${year + 543}</div>
      <div class="cal-nav">
        <button data-nav="-1">‹</button>
        <button data-nav="0">วันนี้</button>
        <button data-nav="1">›</button>
      </div>
    </div>
    <div class="cal-grid">
      ${dowRow}
      ${cellsHtml}
    </div>
    <div class="cal-legend">
      <div class="cal-legend-item"><span class="mark task"></span> งาน</div>
      <div class="cal-legend-item"><span class="mark note"></span> บันทึก</div>
      <div class="cal-legend-item"><span class="mark holiday"></span> วันหยุด</div>
      <div class="cal-legend-item"><span class="mark reminder"></span> เตือนความจำ</div>
    </div>
  `;

  container.querySelectorAll('.cal-cell').forEach(cell => {
    cell.addEventListener('click', () => onSelectDay && onSelectDay(cell.dataset.date));
  });

  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => onNavigate && onNavigate(btn.dataset.nav));
  });
}

/** Builds entriesByDate map from tasks/notes/events/holidays lists */
function buildEntriesByDate({ tasks = [], events = [], holidays = [] }) {
  const map = {};
  const push = (dateStr, entry) => {
    if (!dateStr) return;
    const key = dateStr.slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(entry);
  };

  tasks.forEach(t => { if (t.dueDate) push(t.dueDate, { type: 'task', title: t.title }); });
  events.forEach(e => push(e.date, { type: e.type === 'holiday' ? 'holiday' : (e.type === 'reminder' ? 'reminder' : 'note'), title: e.title }));
  holidays.forEach(h => push(h.date, { type: 'holiday', title: h.name }));

  return map;
}
