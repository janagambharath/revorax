/* Revorax PG app — glassmorphism UI, local-first PWA. */
(function () {
  'use strict';

  var LS_KEY = 'revorax_pg_v1';
  var DEF = { pgName: 'My PG', upiId: '', lang: 'en', residents: [], seq: 1 };

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(LS_KEY));
      if (d && typeof d === 'object') {
        d = Object.assign({}, DEF, d);
        d.residents.forEach(function (r) { if (!r.payments) r.payments = []; });
        return d;
      }
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
  function daysOverdue(r) {
    if (statusOf(r) !== 'overdue') return 0;
    return new Date().getDate() - (parseInt(r.dueDay, 10) || 5);
  }
  function cleanPhone(p) { return String(p || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
  function inr(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.add('hidden'); }, 2200);
  }

  /* ---------- message templates ---------- */
  function msgFor(r, lang) {
    var upi = DB.upiId
      ? '\nPay now: upi://pay?pa=' + DB.upiId + '&pn=' + encodeURIComponent(DB.pgName) + '&am=' + r.rent + '&cu=INR'
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

  function resRow(r, st, remindBtn) {
    var div = document.createElement('div');
    div.className = 'res-row';
    var extra = '';
    if (st === 'overdue') {
      var d = daysOverdue(r);
      extra = '<div class="overdue-tag">' + d + (d === 1 ? ' day' : ' days') + ' overdue</div>';
    }
    div.innerHTML =
      '<div class="avatar">' + esc(initials(r.name)) + '</div>' +
      '<div class="grow"><div class="nm">' + esc(r.name) + '</div>' +
      '<div class="sub">Room ' + esc(r.room) + ' · ' + inr(r.rent) + ' · due ' + esc(r.dueDay) + '</div>' + extra + '</div>' +
      (remindBtn
        ? '<a class="wa-mini" href="' + waLink(r) + '" target="_blank" rel="noopener">Remind</a>'
        : badge(st));
    if (!remindBtn) div.addEventListener('click', function () { openDetail(r.id); });
    return div;
  }

  function renderHome() {
    document.getElementById('pg-name-title').textContent = DB.pgName || 'My PG';
    var paid = 0, unpaid = 0, overdue = 0, collected = 0, pending = 0;
    var attn = [];
    DB.residents.forEach(function (r) {
      var st = statusOf(r);
      if (st === 'paid') { paid++; collected += Number(r.rent) || 0; }
      else {
        pending += Number(r.rent) || 0;
        if (st === 'unpaid') unpaid++; else overdue++;
        attn.push({ r: r, st: st });
      }
    });
    var total = DB.residents.length;
    var rate = total ? Math.round((paid / total) * 100) : 0;
    document.getElementById('h-paid').textContent = paid;
    document.getElementById('h-unpaid').textContent = unpaid;
    document.getElementById('h-overdue').textContent = overdue;
    document.getElementById('h-collected').textContent = inr(collected);
    document.getElementById('h-pending').textContent = inr(pending);
    document.getElementById('h-rate').textContent = rate + '%';
    document.getElementById('rate-num').textContent = rate + '%';
    document.getElementById('rate-ring').style.setProperty('--p', rate + '%');
    document.getElementById('rate-bar').style.width = rate + '%';
    document.getElementById('h-month-line').textContent =
      total ? monthName() + ' · ' + paid + ' of ' + total + ' residents paid' : 'Add residents to start tracking';
    attn.sort(function (a, b) {
      if (a.st !== b.st) return a.st === 'overdue' ? -1 : 1;
      return daysOverdue(b.r) - daysOverdue(a.r);
    });
    var list = document.getElementById('attention-list');
    list.innerHTML = '';
    document.getElementById('attention-empty').classList.toggle('hidden', attn.length > 0);
    attn.slice(0, 8).forEach(function (x) { list.appendChild(resRow(x.r, x.st, true)); });
  }

  var curFilter = 'all';
  function renderResidents() {
    var q = document.getElementById('search').value.trim().toLowerCase();
    var list = document.getElementById('res-list');
    list.innerHTML = '';
    var items = DB.residents.filter(function (r) {
      var okQ = !q || (r.name + ' ' + r.room + ' ' + r.phone).toLowerCase().indexOf(q) > -1;
      var okF = curFilter === 'all' || statusOf(r) === curFilter;
      return okQ && okF;
    });
    document.getElementById('res-empty').classList.toggle('hidden', DB.residents.length > 0);
    items.forEach(function (r) { list.appendChild(resRow(r, statusOf(r), false)); });
  }
  document.getElementById('search').addEventListener('input', renderResidents);
  document.querySelectorAll('#filter-chips button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#filter-chips button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      curFilter = b.dataset.f;
      renderResidents();
    });
  });

  function renderRemind() {
    var list = document.getElementById('remind-list');
    list.innerHTML = '';
    var items = DB.residents.filter(function (r) { return statusOf(r) !== 'paid'; });
    items.sort(function (a, b) {
      var sa = statusOf(a), sb = statusOf(b);
      if (sa !== sb) return sa === 'overdue' ? -1 : 1;
      return daysOverdue(b) - daysOverdue(a);
    });
    document.getElementById('remind-empty').classList.toggle('hidden', items.length > 0);
    document.getElementById('remind-count').textContent = items.length ? '(' + items.length + ')' : '';
    document.getElementById('bulk-count').textContent = items.length
      ? items.length + ' pending · ' + inr(items.reduce(function (s, r) { return s + (Number(r.rent) || 0); }, 0))
      : '0 pending';
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
  document.getElementById('copy-dues').addEventListener('click', function () {
    var items = DB.residents.filter(function (r) { return statusOf(r) !== 'paid'; });
    if (!items.length) { toast('Nobody pending 🎉'); return; }
    var lines = items.map(function (r) {
      return '• ' + r.name + ' (Room ' + r.room + ') — ' + inr(r.rent) +
        (statusOf(r) === 'overdue' ? ' — ' + daysOverdue(r) + 'd overdue' : ' — due ' + r.dueDay);
    });
    var txt = 'Dues — ' + DB.pgName + ' (' + monthName() + ')\n' + lines.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(function () { toast('Dues list copied 📋'); })
      .catch(function () { toast('Copy not supported here'); });
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
    save(); closeSheet(); renderAll(); toast('Resident deleted');
  });
  document.getElementById('sheet-save').addEventListener('click', function () {
    var name = document.getElementById('f-name').value.trim();
    var phone = cleanPhone(document.getElementById('f-phone').value);
    if (!name) { toast('Please enter the resident name'); return; }
    if (phone.length !== 10) { toast('Enter a valid 10-digit phone number'); return; }
    var data = {
      name: name, phone: phone,
      room: document.getElementById('f-room').value.trim(),
      rent: document.getElementById('f-rent').value.trim(),
      dueDay: document.getElementById('f-due').value.trim() || '5'
    };
    if (editingId) {
      Object.assign(DB.residents.find(function (x) { return x.id === editingId; }), data);
      toast('Saved ✓');
    } else {
      data.id = 'r' + (DB.seq++);
      data.paidFor = '';
      data.payments = [];
      DB.residents.push(data);
      toast('Resident added ✓');
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
      toast('Details extracted — verify & save');
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
    document.getElementById('d-avatar').textContent = initials(r.name);
    document.getElementById('d-name').textContent = r.name;
    document.getElementById('d-sub').textContent =
      'Room ' + r.room + ' · ' + r.phone + ' · ' + inr(r.rent) + '/mo · due ' + r.dueDay + ' ' + monthName();
    document.getElementById('d-status').innerHTML = badge(st) +
      (st === 'overdue' ? '<span class="overdue-tag">' + daysOverdue(r) + ' days overdue</span>' :
       r.paidFor ? '<span class="muted small">paid for ' + r.paidFor + '</span>' : '');
    document.getElementById('d-paid').style.display = st === 'paid' ? 'none' : '';
    var hist = document.getElementById('d-history');
    hist.innerHTML = '';
    var pays = (r.payments || []).slice().reverse();
    if (!pays.length) hist.innerHTML = '<p class="muted small">No payments recorded yet.</p>';
    pays.slice(0, 6).forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'hist-row';
      row.innerHTML = '<span>' + esc(p.ym) + '</span><b>' + inr(p.amount) + ' ✓</b>';
      hist.appendChild(row);
    });
    detailBd.classList.remove('hidden');
  }
  document.getElementById('d-close').addEventListener('click', function () { detailBd.classList.add('hidden'); });
  detailBd.addEventListener('click', function (e) { if (e.target === detailBd) detailBd.classList.add('hidden'); });
  document.getElementById('d-edit').addEventListener('click', function () {
    detailBd.classList.add('hidden'); openSheet(detailId);
  });
  document.getElementById('d-paid').addEventListener('click', function () {
    var r = DB.residents.find(function (x) { return x.id === detailId; });
    if (r) {
      r.paidFor = curYM();
      r.payments = r.payments || [];
      r.payments.push({ ym: curYM(), date: new Date().toISOString().slice(0, 10), amount: Number(r.rent) || 0 });
      save();
      toast(inr(r.rent) + ' marked paid ✓');
    }
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
    save(); setBd.classList.add('hidden'); renderAll(); toast('Settings saved ✓');
  });
  document.getElementById('wipe-btn').addEventListener('click', function () {
    if (confirm('Erase ALL residents and settings? This cannot be undone.')) {
      localStorage.removeItem(LS_KEY);
      DB = JSON.parse(JSON.stringify(DEF));
      save(); setBd.classList.add('hidden'); renderAll();
    }
  });

  /* ---------- install banner ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem('pg_install_dismissed')) {
      document.getElementById('install-banner').classList.remove('hidden');
    }
  });
  document.getElementById('install-btn').addEventListener('click', function () {
    document.getElementById('install-banner').classList.add('hidden');
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
    else { toast('Use browser menu → Add to Home Screen 📲'); }
  });
  document.getElementById('install-x').addEventListener('click', function () {
    document.getElementById('install-banner').classList.add('hidden');
    localStorage.setItem('pg_install_dismissed', '1');
  });

  /* ---------- PWA ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  renderAll();
})();
