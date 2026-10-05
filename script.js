(function () {
  const $ = s => document.querySelector(s);
  const KEY = 'weekly_schedule_v1';
  const COLORS = ['#264a7f','#4a90d9','#a9c8f3','#2fa36b','#5fcfb0','#f0b43c','#ef7f8e','#9b7fe0','#e8634f','#7a8599'];
  const HEAD = ['#e8707a','#f3b63f','#3fa86f','#4a90d9','#9b6fe0','#2fa8a0','#ef8a5c'];
  const uid = () => 'b' + Math.random().toString(36).slice(2, 9);
  const DEF = () => ({
    title: 'جدول المواعيد الأسبوعي',
    sub: 'Plan · Study · Grow',
    days: ['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'],
    times: ['8 - 10','10 - 12','12 - 2','2 - 4','4 - 6','6 - 8','8 - 10','10 - 12'],
    cells: {},
    tray: [
      { id: uid(), text: 'DB', color: '#f0b43c', shape: 'round' },
      { id: uid(), text: 'DS', color: '#2fa36b', shape: 'round' },
      { id: uid(), text: 'Logic', color: '#5fcfb0', shape: 'round' },
      { id: uid(), text: 'سكشن PL2', color: '#9b7fe0', shape: 'round' },
      { id: uid(), text: 'ألحان', color: '#264a7f', shape: 'round' },
      { id: uid(), text: 'اجتماع', color: '#2b3a67', shape: 'round' }
    ]
  });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || DEF(); } catch (e) { S = DEF(); }
  let sel = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const textColor = hex => {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#2b3a67' : '#fff';
  };
  const find = id => S.tray.find(b => b.id === id) || Object.values(S.cells).find(b => b.id === id);

  function blockEl(b) {
    const d = document.createElement('div');
    d.className = 'block shape-' + b.shape + (b.id === sel ? ' sel' : '');
    d.dataset.id = b.id;
    d.textContent = b.text || '—';
    d.style.background = b.color;
    d.style.color = textColor(b.color);
    return d;
  }

  function render() {
    const t = $('#tbl');
    t.innerHTML = '';
    const hr = t.createTHead().insertRow();
    hr.insertAdjacentHTML('beforeend', '<th class="corner">🕒 اليوم</th>');
    S.times.forEach((x, i) => {
      const th = document.createElement('th');
      th.className = 'time'; th.contentEditable = true; th.textContent = x;
      th.oninput = () => { S.times[i] = th.textContent; save(); };
      hr.appendChild(th);
    });
    const tb = t.createTBody();
    S.days.forEach((d, r) => {
      const row = tb.insertRow();
      const th = document.createElement('th');
      th.contentEditable = true; th.textContent = d; th.style.background = HEAD[r % HEAD.length];
      th.oninput = () => { S.days[r] = th.textContent; save(); };
      row.appendChild(th);
      S.times.forEach((_, c) => {
        const k = r + '-' + c, td = row.insertCell();
        td.className = 'cell'; td.dataset.k = k;
        if (S.cells[k]) td.appendChild(blockEl(S.cells[k]));
      });
    });
    const tray = $('#tray');
    tray.innerHTML = '';
    S.tray.forEach(b => tray.appendChild(blockEl(b)));
    const seen = new Set(), lg = $('#legend');
    lg.innerHTML = '';
    S.tray.forEach(b => {
      const key = b.text + b.color;
      if (seen.has(key)) return; seen.add(key);
      const s = document.createElement('span');
      s.innerHTML = '<i></i>'; s.firstChild.style.background = b.color;
      s.append(b.text); lg.appendChild(s);
    });
    syncEditor();
  }

  /* ---------- editor ---------- */
  function syncEditor() {
    const b = sel && find(sel);
    if (sel && !b) sel = null;
    $('#edTitle').textContent = b ? 'تعديل البلوك المحدد' : 'بلوك جديد';
    $('#add').textContent = b ? 'إلغاء التحديد' : '+ إضافة بلوك';
    $('#del').hidden = !b;
    if (b) { $('#bt').value = b.text; $('#bc').value = b.color; $('#bs').value = b.shape; }
    document.querySelectorAll('#sw i').forEach(i => i.classList.toggle('on', i.dataset.c === $('#bc').value));
  }
  COLORS.forEach(c => {
    const i = document.createElement('i'); i.dataset.c = c; i.style.background = c;
    i.onclick = () => { $('#bc').value = c; live(); };
    $('#sw').appendChild(i);
  });
  function live() {
    const b = sel && find(sel);
    if (b) {
      b.text = $('#bt').value; b.color = $('#bc').value; b.shape = $('#bs').value;
      // keep linked copies in the table in sync only for the selected instance
      save(); render();
    } else document.querySelectorAll('#sw i').forEach(i => i.classList.toggle('on', i.dataset.c === $('#bc').value));
  }
  ['#bt', '#bc', '#bs'].forEach(s => $(s).addEventListener('input', live));
  $('#add').onclick = () => {
    if (sel) { sel = null; render(); return; }
    const text = $('#bt').value.trim();
    if (!text) { $('#bt').focus(); return; }
    const b = { id: uid(), text, color: $('#bc').value, shape: $('#bs').value };
    S.tray.push(b); sel = null; $('#bt').value = ''; save(); render();
  };
  $('#del').onclick = () => removeBlock(sel);
  function removeBlock(id) {
    S.tray = S.tray.filter(b => b.id !== id);
    for (const k in S.cells) if (S.cells[k].id === id) delete S.cells[k];
    if (sel === id) sel = null;
    save(); render();
  }

  /* ---------- title ---------- */
  $('#title').value = S.title; $('#sub').value = S.sub;
  $('#title').oninput = e => { S.title = e.target.value; document.title = S.title; save(); };
  $('#sub').oninput = e => { S.sub = e.target.value; save(); };
  document.title = S.title;

  $('#clear').onclick = () => { if (confirm('مسح كل البلوكات من الجدول؟')) { S.cells = {}; save(); render(); } };
  $('#print').onclick = () => window.print();

  /* ---------- drag & drop (mouse + touch) ---------- */
  let drag = null;
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.block');
    if (!el || e.button > 0) return;
    const cell = el.closest('.cell');
    drag = { id: el.dataset.id, from: cell ? cell.dataset.k : null, x: e.clientX, y: e.clientY, ghost: null, el };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.className += ' ghost'; drag.ghost.classList.remove('sel');
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    document.querySelectorAll('.over').forEach(n => n.classList.remove('over'));
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const z = t && (t.closest('.cell') || t.closest('#trash'));
    if (z) z.classList.add('over');
  });
  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    document.querySelectorAll('.over').forEach(n => n.classList.remove('over'));
    if (!d.ghost) { sel = sel === d.id ? null : d.id; render(); return; }
    d.ghost.remove();
    const t = document.elementFromPoint(e.clientX, e.clientY);
    if (!t) return;
    const cell = t.closest('.cell'), b = find(d.id);
    if (t.closest('#trash')) { if (d.from) { delete S.cells[d.from]; } else removeBlock(d.id); }
    else if (cell && b) {
      const k = cell.dataset.k;
      if (d.from) {
        if (k === d.from) return;
        const other = S.cells[k];
        S.cells[k] = b;
        if (other) S.cells[d.from] = other; else delete S.cells[d.from];
      } else S.cells[k] = { ...b, id: uid() };
    } else if (d.from && t.closest('#tray')) delete S.cells[d.from];
    save(); render();
  });
  document.addEventListener('dragstart', e => e.preventDefault());

  render();
})();
