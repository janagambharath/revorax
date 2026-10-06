/* Revorax PG app — local-first PWA. Reminders open WhatsApp with prefilled text. */
(function () {
  'use strict';

  var LS_KEY = 'revorax_pg_v1';
  var DEF = { pgName: 'My PG', upiId: '', lang: 'en', residents: [], seq: 1 };

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(LS_KEY));
      if (d && typeof d === 'object') return Object.assign({}, DEF, d);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEF));
  }
  function save() { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
  var DB = load();

  function ym(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function curYM() { return ym(new Date()); }
  function monthName() { return new Date().toLocaleString('en-IN', { month: 'long' }); }

  function statusOf(r) {
    if (r.paidFor === curYM()) return 'paid';
    var today = new Date().getDate();
    var due = parseInt(r.dueDay, 10) || 5;
    return today > due ? 'overdue' : 'unpaid';
  }
  function cleanPhone(p) { return String(p || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
  function inr(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

  /* ---------- message templates ---------- */
  function msgFor(r, lang) {
    var upi = DB.upiId
      ? '\nPay now: upi://pay?pa=' + encodeURIComponent(DB.upiId) + '&pn=' + encodeURIComponent(DB.pgName) + '&am=' + r.rent + '&cu=INR'
      : '';
    if (lang === 'te') {
      return 'నమస్తే ' + r.name.split(' ')[0] + ' గారు 🙏\n' +
        'మీ రూమ్ అద్దె ' + inr(r.rent) + ' ' + r.dueDay + ' ' + monthName() + ' నాటికి చెల్లించాలి.' + upi +
        '\n— ' + DB.pgName;
    }
    return 'Namaste ' + r.name.split(' ')[0] + ' garu 🙏\n' +
      'Your room rent of ' + inr(r.rent) + ' was due on ' + r.dueDay + ' ' + monthName() + '.' + upi +
      '\n— ' + DB.pgName;
  }
  function waLink(r) {
    return 'https://wa.me/91' + cleanPhone(r.phone) + '?text=' + encodeURIComponent(msgFor(r, DB.lang));
  }

  /* ---------- tabs ---------- */
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
      document.getElementById(t.dataset.scr).classList.add('active');
      window.scrollTo(0, 0);
    });
  });

  /* ---------- renderers ---------- */
  function badge(st) { return '<span class="badge ' + st + '">' + st + '</span>'; }

  function renderHome() {
    document.getElementById('pg-name-title').textContent = DB.pgName || 'My PG';
    var paid = 0, unpaid = 0, overdue = 0, collected = 0, pending = 0;
    var attn = [];
    DB.residents.forEach(function (r) {
      var st = statusOf(r);
      if (st === 'paid') { paid++; collected += Number(r.rent) || 0; }
      else { pending += Number(r.rent) || 0; if (st === 'unpaid') unpaid++; else overdue++; attn.push({ r: r, st: st }); }
    });
    document.getElementById('h-paid').textContent = paid;
    document.getElementById('h-unpaid').textContent = unpaid;
    document.getElementById('h-overdue').textContent = overdue;
    document.getElementById('h-collected').textContent = inr(collected);
    document.getElementById('h-pending').textContent = inr(pending);
    attn.sort(function (a, b) { return a.st === 'overdue' ? -1 : 1; });
    var list = document.getElementById('attention-list');
    list.innerHTML = '';
    document.getElementById('attention-empty').classList.toggle('hidden', attn.length > 0);
    attn.slice(0, 8).forEach(function (x) {
      list.appendChild(resRow(x.r, x.st, true));
    });
  }

  function resRow(r, st, remindBtn) {
    var div = document.createElement('div');
    div.className = 'res-row';
    div.innerHTML =
      '<div><div class="nm">' + esc(r.name) + '</div>' +
      '<div class="sub">Room ' + esc(r.room) + ' · ' + inr(r.rent) + ' · due ' + esc(r.dueDay) + '</div></div>' +
      (remindBtn
        ? '<a class="wa-mini" href="' + waLink(r) + '" target="_blank" rel="noopener">Remind</a>'
        : badge(st));
    if (!remindBtn) div.addEventListener('click', function () { openDetail(r.id); });
    return div;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function renderResidents() {
    var q = document.getElementById('search').value.trim().toLowerCase();
    var list = document.getElementById('res-list');
    list.innerHTML = '';
    var items = DB.residents.filter(function (r) {
      return !q || (r.name + ' ' + r.room + ' ' + r.phone).toLowerCase().indexOf(q) > -1;
    });
    document.getElementById('res-empty').classList.toggle('hidden', DB.residents.length > 0);
    items.forEach(function (r) { list.appendChild(resRow(r, statusOf(r), false)); });
  }
  document.getElementById('search').addEventListener('input', renderResidents);

  function renderRemind() {
    var list = document.getElementById('remind-list');
    list.innerHTML = '';
    var items = DB.residents.filter(function (r) { return statusOf(r) !== 'paid'; });
    document.getElementById('remind-empty').classList.toggle('hidden', items.length > 0);
    document.getElementById('remind-count').textContent = items.length ? '(' + items.length + ')' : '';
    items.sort(function (a, b) {
      return statusOf(a) === 'overdue' ? -1 : 1;
    });
    items.forEach(function (r) { list.appendChild(resRow(r, statusOf(r), true)); });
    var sample = items[0] || { name: 'Ravi', rent: 6500, dueDay: '5' };
    document.getElementById('tpl-preview').textContent = msgFor(sample, DB.lang);
    document.querySelectorAll('#lang-seg button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.lang === DB.lang);
    });
  }
  document.querySelectorAll('#lang-seg button').forEach(function (b) {
    b.addEventListener('click', function () { DB.lang = b.dataset.lang; save(); renderRemind(); });
  });

  function renderAll() { renderHome(); renderResidents(); renderRemind(); }

  /* ---------- add / edit sheet ---------- */
  var sheetBd = document.getElementById('sheet-backdrop');
  var editingId = null;
  function openSheet(id) {
    editingId = id || null;
    var r = id ? DB.residents.find(function (x) { return x.id === id; }) : null;
    document.getElementById('sheet-title').textContent = r ? 'Edit resident' : 'Add resident';
    document.getElementById('f-name').value = r ? r.name : '';
    document.getElementById('f-phone').value = r ? r.phone : '';
    document.getElementById('f-room').value = r ? r.room : '';
    document.getElementById('f-rent').value = r ? r.rent : '';
    document.getElementById('f-due').value = r ? r.dueDay : '5';
    document.getElementById('del-btn').classList.toggle('hidden', !r);
    document.getElementById('scan-status').classList.add('hidden');
    sheetBd.classList.remove('hidden');
  }
  function closeSheet() { sheetBd.classList.add('hidden'); }
  document.getElementById('add-btn').addEventListener('click', function () { openSheet(null); });
  document.getElementById('sheet-cancel').addEventListener('click', closeSheet);
  sheetBd.addEventListener('click', function (e) { if (e.target === sheetBd) closeSheet(); });
  document.getElementById('del-btn').addEventListener('click', function () {
    DB.residents = DB.residents.filter(function (x) { return x.id !== editingId; });
    save(); closeSheet(); renderAll();
  });
  document.getElementById('sheet-save').addEventListener('click', function () {
    var name = document.getElementById('f-name').value.trim();
    var phone = cleanPhone(document.getElementById('f-phone').value);
    if (!name) { alert('Please enter the resident name.'); return; }
    if (phone.length !== 10) { alert('Please enter a valid 10-digit phone number.'); return; }
    var data = {
      name: name, phone: phone,
      room: document.getElementById('f-room').value.trim(),
      rent: document.getElementById('f-rent').value.trim(),
      dueDay: document.getElementById('f-due').value.trim() || '5'
    };
    if (editingId) {
      var r = DB.residents.find(function (x) { return x.id === editingId; });
      Object.assign(r, data);
    } else {
      data.id = 'r' + (DB.seq++);
      data.paidFor = '';
      DB.residents.push(data);
    }
    save(); closeSheet(); renderAll();
  });

  /* ---------- simulated scan ---------- */
  var SAMPLE = [
    { name: 'Ravi Kumar', phone: '9876543210', room: '101', rent: '6500', dueDay: '5' },
    { name: 'Suresh Reddy', phone: '9123456780', room: '102', rent: '6500', dueDay: '5' },
    { name: 'Anil Verma', phone: '9988776655', room: '103', rent: '7000', dueDay: '5' }
  ];
  document.getElementById('scan-btn').addEventListener('click', function () {
    document.getElementById('scan-input').click();
  });
  document.getElementById('scan-input').addEventListener('change', function () {
    var st = document.getElementById('scan-status');
    st.classList.remove('hidden');
    setTimeout(function () {
      st.classList.add('hidden');
      var s = SAMPLE[Math.floor(Math.random() * SAMPLE.length)];
      document.getElementById('f-name').value = s.name;
      document.getElementById('f-phone').value = s.phone;
      document.getElementById('f-room').value = s.room;
      document.getElementById('f-rent').value = s.rent;
      document.getElementById('f-due').value = s.dueDay;
    }, 1600);
  });

  /* ---------- detail sheet ---------- */
  var detailBd = document.getElementById('detail-backdrop');
  var detailId = null;
  function openDetail(id) {
    detailId = id;
    var r = DB.residents.find(function (x) { return x.id === id; });
    if (!r) return;
    var st = statusOf(r);
    document.getElementById('d-name').textContent = r.name;
    document.getElementById('d-sub').textContent =
      'Room ' + r.room + ' · ' + r.phone + ' · ' + inr(r.rent) + '/mo · due ' + r.dueDay + ' ' + monthName();
    document.getElementById('d-status').innerHTML = badge(st) +
      (r.paidFor ? ' <span class="muted small">· paid for ' + r.paidFor + '</span>' : '');
    document.getElementById('d-paid').style.display = st === 'paid' ? 'none' : '';
    detailBd.classList.remove('hidden');
  }
  document.getElementById('d-close').addEventListener('click', function () { detailBd.classList.add('hidden'); });
  detailBd.addEventListener('click', function (e) { if (e.target === detailBd) detailBd.classList.add('hidden'); });
  document.getElementById('d-edit').addEventListener('click', function () {
    detailBd.classList.add('hidden'); openSheet(detailId);
  });
  document.getElementById('d-paid').addEventListener('click', function () {
    var r = DB.residents.find(function (x) { return x.id === detailId; });
    if (r) { r.paidFor = curYM(); save(); }
    detailBd.classList.add('hidden'); renderAll();
  });
  document.getElementById('d-remind').addEventListener('click', function () {
    var r = DB.residents.find(function (x) { return x.id === detailId; });
    if (r) window.open(waLink(r), '_blank');
  });

  /* ---------- settings ---------- */
  var setBd = document.getElementById('settings-backdrop');
  document.getElementById('settings-btn').addEventListener('click', function () {
    document.getElementById('s-pgname').value = DB.pgName || '';
    document.getElementById('s-upi').value = DB.upiId || '';
    setBd.classList.remove('hidden');
  });
  document.getElementById('s-cancel').addEventListener('click', function () { setBd.classList.add('hidden'); });
  setBd.addEventListener('click', function (e) { if (e.target === setBd) setBd.classList.add('hidden'); });
  document.getElementById('s-save').addEventListener('click', function () {
    DB.pgName = document.getElementById('s-pgname').value.trim() || 'My PG';
    DB.upiId = document.getElementById('s-upi').value.trim();
    save(); setBd.classList.add('hidden'); renderAll();
  });
  document.getElementById('wipe-btn').addEventListener('click', function () {
    if (confirm('Erase ALL residents and settings? This cannot be undone.')) {
      localStorage.removeItem(LS_KEY);
      DB = JSON.parse(JSON.stringify(DEF));
      save(); setBd.classList.add('hidden'); renderAll();
    }
  });

  /* ---------- PWA ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  renderAll();
})();
