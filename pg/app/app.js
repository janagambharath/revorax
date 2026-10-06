/* REvorax PG — v4 (HostelMate-style): onboarding, dashboard, templates, send screen, bulk select */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cleanPhone(p) { return String(p || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
  function ym(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function fmtINR(n) { n = Number(n) || 0; return '₹' + n.toLocaleString('en-IN'); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var curYM = ym(new Date());
  function dueLabel(r) { return (r.dueDay || 1) + ' ' + MONTHS[new Date().getMonth()]; }
  function statusOf(r) {
    var due = parseInt(r.dueDay, 10) || 1;
    var dd = new Date(); dd.setDate(due); dd.setHours(23, 59, 59, 999);
    if (r.paidFor === curYM) return 'paid';
    if (new Date() > dd) return 'overdue';
    return 'unpaid';
  }
  function daysOverdue(r) {
    var due = parseInt(r.dueDay, 10) || 1;
    var now = new Date(); var dd = new Date(); dd.setDate(due); dd.setHours(23, 59, 59, 999);
    if (r.paidFor === curYM || now <= dd) return 0;
    return Math.floor((now - dd) / 86400000);
  }
  function daysToDue(r) {
    var due = parseInt(r.dueDay, 10) || 1;
    var now = new Date(); var dd = new Date(); dd.setDate(due); dd.setHours(23, 59, 59, 999);
    return Math.ceil((dd - now) / 86400000);
  }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }
  function avatarColor(name) {
    var h = 0, s = String(name || '?');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return 'background:hsla(' + h + ',65%,88%,.9);color:hsl(' + h + ',55%,32%)';
  }

  /* ---------- store ---------- */
  var LS = 'revorax-pg-v1';
  var DEFAULT_PAY = 'Hi {name}, your hostel rent of {amount} is due on {due_date}. Please pay at the earliest. Thank you! 🙏\n— {pg_name}';
  var DEFAULT_OVER = 'Hi {name}, your hostel rent of {amount} was due on {due_date}. Please pay immediately to avoid late fee.\nPay here: {upi_link}\n— {pg_name}';
  var DB;
  try { DB = JSON.parse(localStorage.getItem(LS)) || null; } catch (e) { DB = null; }
  if (!DB || !DB.residents) DB = { residents: [], seq: 1, pgName: 'My PG', upiId: '', tpl_pay: DEFAULT_PAY, tpl_over: DEFAULT_OVER, onboarded: false };
  if (!DB.tpl_pay) DB.tpl_pay = DEFAULT_PAY;
  if (!DB.tpl_over) DB.tpl_over = DEFAULT_OVER;
  function save() { try { localStorage.setItem(LS, JSON.stringify(DB)); } catch (e) {} }

  function upiLink(r) {
    if (!DB.upiId) return '';
    return 'upi://pay?pa=' + encodeURIComponent(DB.upiId) + '&pn=' + encodeURIComponent(DB.pgName || 'PG') + '&am=' + (Number(r.rent) || 0) + '&cu=INR&tn=' + encodeURIComponent('Rent ' + (r.room || ''));
  }
  function fillTpl(tpl, r) {
    return String(tpl)
      .split('{name}').join(r.name || '')
      .split('{amount}').join(fmtINR(r.rent))
      .split('{due_date}').join(dueLabel(r))
      .split('{pg_name}').join(DB.pgName || 'My PG')
      .split('{upi_link}').join(upiLink(r));
  }
  function msgFor(r) {
    var st = statusOf(r);
    return fillTpl(st === 'overdue' ? DB.tpl_over : DB.tpl_pay, r);
  }
  function waLink(r) { return 'https://wa.me/91' + cleanPhone(r.phone) + '?text=' + encodeURIComponent(msgFor(r)); }

  /* ---------- toast ---------- */
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast glass-strong'; t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 30);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  /* ---------- demo data ---------- */
  function prevYM() { var d = new Date(); d.setMonth(d.getMonth() - 1); return ym(d); }
  var DEMO = [
    { name: 'Srinivas Goud',    phone: '9812345670', room: '101', rent: '6500', dueDay: '5',  paid: true  },
    { name: 'Venkatesh Yadav',  phone: '9948123456', room: '102', rent: '6000', dueDay: '5',  paid: false },
    { name: 'Nagaraju Mudiraj',  phone: '9034567890', room: '103', rent: '5500', dueDay: '10', paid: false },
    { name: 'Ramesh Chary',      phone: '9849012345', room: '104', rent: '7000', dueDay: '5',  paid: true  },
    { name: 'Lakshmi Devi',      phone: '9701234567', room: '201', rent: '6500', dueDay: '5',  paid: false },
    { name: 'Priya Sharma',      phone: '9123456789', room: '202', rent: '7500', dueDay: '10', paid: false },
    { name: 'Anitha Reddy',     phone: '9989012345', room: '203', rent: '6000', dueDay: '5',  paid: true  },
    { name: 'Divya Sri',         phone: '9705678901', room: '204', rent: '6500', dueDay: '5',  paid: false },
    { name: 'Kavya Reddy',      phone: '9640123456', room: '301', rent: '7000', dueDay: '10', paid: false },
    { name: 'Santosh Kumar',    phone: '9866543210', room: '302', rent: '5500', dueDay: '5',  paid: true  },
    { name: 'Pradeep Singh',    phone: '9000123456', room: '303', rent: '6500', dueDay: '5',  paid: false },
    { name: 'Mahesh Babu',      phone: '9885543210', room: '304', rent: '6000', dueDay: '10', paid: false }
  ];
  function loadDemo() {
    DB.residents = DEMO.map(function (d) {
      var r = { id: 'r' + (DB.seq++), name: d.name, phone: d.phone, email: '', room: d.room, rent: d.rent, dueDay: d.dueDay, payments: [] };
      if (d.paid) {
        r.paidFor = curYM;
        r.payments.push({ ym: prevYM(), date: prevYM() + '-06', amount: Number(d.rent) });
        r.payments.push({ ym: curYM, date: curYM + '-04', amount: Number(d.rent) });
      } else {
        r.paidFor = '';
        r.payments.push({ ym: prevYM(), date: prevYM() + '-07', amount: Number(d.rent) });
      }
      return r;
    });
    DB.onboarded = true;
    save(); renderAll();
    $('onboard').classList.add('hidden');
    toast('Demo data loaded — 12 residents ✨');
  }
  document.addEventListener('click', function (e) { if (e.target.closest('.demo-btn')) loadDemo(); });

  /* ---------- tabs ---------- */
  function goTab(id) {
    document.querySelectorAll('.scr').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.scr === id); });
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { goTab(t.dataset.scr); });
  });

  /* ---------- onboarding ---------- */
  function showOnboard() { if (!DB.onboarded) $('onboard').classList.remove('hidden'); }
  function hideOnboard() { DB.onboarded = true; save(); $('onboard').classList.add('hidden'); }
  $('ob-scan').addEventListener('click', function () { hideOnboard(); openSheet(); });
  $('ob-manual').addEventListener('click', function () { hideOnboard(); openSheet(); });
  $('ob-view').addEventListener('click', function () { hideOnboard(); goTab('scr-residents'); });

  /* ---------- shared row ---------- */
  function pillHTML(st, r) {
    if (st === 'paid') return '<span class="pill paid">Paid</span>';
    if (st === 'overdue') { var d = daysOverdue(r); return '<span class="pill over">' + (d > 0 ? d + 'd over' : 'Overdue') + '</span>'; }
    return '<span class="pill unpaid">Unpaid</span>';
  }
  function resRow(r, st, showRemind) {
    var div = document.createElement('div');
    div.className = 'res-row glass';
    div.dataset.id = r.id;
    div.innerHTML =
      (selectMode ? '<span class="sel-box' + (selected[r.id] ? ' on' : '') + '">' + (selected[r.id] ? '✓' : '') + '</span>' : '') +
      '<div class="avatar" style="' + avatarColor(r.name) + '">' + esc(initials(r.name)) + '</div>' +
      '<div class="res-tx"><b>' + esc(r.name) + '</b><span class="muted small">Room ' + esc(r.room || '—') + ' · ' + fmtINR(r.rent) + ' · Due ' + esc(dueLabel(r)) + '</span></div>' +
      pillHTML(st, r) +
      (showRemind && st !== 'paid' ? '<button class="mini-wa" data-act="remind">💬</button>' : '');
    div.addEventListener('click', function (e) {
      if (selectMode) { toggleSelect(r.id); return; }
      if (e.target.closest('[data-act="remind"]')) { openSend(r.id); return; }
      openDetail(r.id);
    });
    return div;
  }

  /* ---------- home / dashboard ---------- */
  function renderHome() {
    $('pg-title').textContent = DB.pgName || 'My PG';
    var total = DB.residents.length, paid = 0, unpaid = 0, over = 0;
    DB.residents.forEach(function (r) { var st = statusOf(r); if (st === 'paid') paid++; else if (st === 'overdue') over++; else unpaid++; });
    $('st-total').textContent = total;
    $('st-paid').textContent = paid;
    $('st-unpaid').textContent = unpaid;
    $('st-over').textContent = over;
    $('st-unpaid-pct').textContent = total ? Math.round(unpaid / total * 100) + '%' : '0%';
    $('st-over-pct').textContent = total ? Math.round(over / total * 100) + '%' : '0%';
    // donut
    var C = 2 * Math.PI * 46;
    function seg(el, frac, startFrac) {
      var c = $(el);
      c.style.strokeDasharray = (frac * C) + ' ' + C;
      c.style.strokeDashoffset = (-startFrac * C);
    }
    var fp = total ? paid / total : 0, fu = total ? unpaid / total : 0, fo = total ? over / total : 0;
    seg('dg-paid', fp, 0); seg('dg-unpaid', fu, fp); seg('dg-over', fo, fp + fu);
    $('dg-total').textContent = total;
    $('lg-paid').textContent = paid; $('lg-unpaid').textContent = unpaid; $('lg-over').textContent = over;
    // upcoming dues (unpaid/overdue sorted: overdue first by days desc, then soonest due)
    var upcoming = DB.residents.map(function (r) { return { r: r, st: statusOf(r) }; })
      .filter(function (x) { return x.st !== 'paid'; })
      .sort(function (a, b) {
        if (a.st === 'overdue' && b.st !== 'overdue') return -1;
        if (b.st === 'overdue' && a.st !== 'overdue') return 1;
        if (a.st === 'overdue') return daysOverdue(b.r) - daysOverdue(a.r);
        return daysToDue(a.r) - daysToDue(b.r);
      });
    var ul = $('upcoming-list'); ul.innerHTML = '';
    var isEmpty = total === 0;
    $('upcoming-empty').classList.toggle('hidden', upcoming.length > 0 || isEmpty);
    upcoming.slice(0, 5).forEach(function (x) {
      var when = x.st === 'overdue' ? daysOverdue(x.r) + 'd overdue' : 'Due in ' + Math.max(daysToDue(x.r), 0) + 'd';
      var d = document.createElement('div');
      d.className = 'up-row glass'; d.dataset.id = x.r.id;
      d.innerHTML = '<div class="avatar sm" style="' + avatarColor(x.r.name) + '">' + esc(initials(x.r.name)) + '</div>' +
        '<div class="up-tx"><b>' + esc(x.r.name) + '</b><span class="muted small">Room ' + esc(x.r.room || '—') + ' · ' + esc(dueLabel(x.r)) + '</span></div>' +
        '<div class="up-amt">' + fmtINR(x.r.rent) + '</div>' + pillHTML(x.st, x.r);
      d.addEventListener('click', function () { openDetail(x.r.id); });
      ul.appendChild(d);
    });
    // attention
    var attn = DB.residents.map(function (r) { return { r: r, st: statusOf(r) }; })
      .filter(function (x) { return x.st !== 'paid'; })
      .sort(function (a, b) {
        if (a.st === 'overdue' && b.st !== 'overdue') return -1;
        if (b.st === 'overdue' && a.st !== 'overdue') return 1;
        return daysOverdue(b.r) - daysOverdue(a.r);
      });
    var list = $('attention-list'); list.innerHTML = '';
    $('demo-cta').classList.toggle('hidden', !isEmpty);
    $('attention-empty').classList.toggle('hidden', attn.length > 0 || isEmpty);
    attn.slice(0, 8).forEach(function (x) { list.appendChild(resRow(x.r, x.st, false)); });
  }

  /* ---------- residents + bulk select ---------- */
  var resFilter = 'all', resQuery = '';
  var selectMode = false, selected = {};
  function renderResidents() {
    var list = $('res-list'); list.innerHTML = '';
    var items = DB.residents.map(function (r) { return { r: r, st: statusOf(r) }; })
      .filter(function (x) { return resFilter === 'all' || x.st === resFilter; })
      .filter(function (x) {
        if (!resQuery) return true;
        var q = resQuery.toLowerCase();
        return (x.r.name || '').toLowerCase().includes(q) || (x.r.room || '').includes(q) || cleanPhone(x.r.phone).includes(q.replace(/\D/g, ''));
      });
    $('res-empty').classList.toggle('hidden', items.length > 0);
    items.forEach(function (x) { list.appendChild(resRow(x.r, x.st, false)); });
    renderBulkBar();
  }
  function toggleSelect(id) {
    if (selected[id]) delete selected[id]; else selected[id] = true;
    renderResidents();
  }
  function setSelectMode(on) {
    selectMode = on; selected = {};
    $('select-toggle').classList.toggle('active', on);
    $('select-toggle').textContent = on ? 'Done' : 'Select';
    renderResidents();
  }
  function renderBulkBar() {
    var n = Object.keys(selected).length;
    $('bulk-bar').classList.toggle('hidden', !selectMode);
    $('bulk-count').textContent = n + ' selected';
  }
  $('select-toggle').addEventListener('click', function () { setSelectMode(!selectMode); });
  $('bulk-cancel').addEventListener('click', function () { setSelectMode(false); });
  $('bulk-paid').addEventListener('click', function () {
    var n = 0;
    Object.keys(selected).forEach(function (id) {
      var r = DB.residents.find(function (x) { return x.id === id; });
      if (r && r.paidFor !== curYM) {
        r.paidFor = curYM;
        r.payments.push({ ym: curYM, date: curYM + '-' + ('0' + new Date().getDate()).slice(-2), amount: Number(r.rent) || 0 });
        n++;
      }
    });
    setSelectMode(false); save(); renderAll();
    toast(n + ' marked paid ✓');
  });
  $('bulk-del').addEventListener('click', function () {
    var n = Object.keys(selected).length;
    if (!n) return;
    if (!confirm('Delete ' + n + ' resident(s)?')) return;
    DB.residents = DB.residents.filter(function (r) { return !selected[r.id]; });
    setSelectMode(false); save(); renderAll();
    toast(n + ' deleted');
  });
  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active'); resFilter = c.dataset.f; renderResidents();
    });
  });
  $('res-search').addEventListener('input', function (e) { resQuery = e.target.value; renderResidents(); });
  $('fab').addEventListener('click', function () { openSheet(); });

  /* ---------- add / edit sheet ---------- */
  var sheetBd = $('sheet-backdrop'), editingId = null;
  function openSheet(id) {
    editingId = id || null;
    var r = id ? DB.residents.find(function (x) { return x.id === id; }) : null;
    $('sheet-title').textContent = r ? 'Edit resident' : 'Add resident';
    $('f-name').value = r ? r.name : '';
    $('f-phone').value = r ? r.phone : '';
    $('f-email').value = r ? (r.email || '') : '';
    $('f-room').value = r ? r.room : '';
    $('f-rent').value = r ? r.rent : '';
    $('f-dueday').value = r ? r.dueDay : '';
    sheetBd.classList.remove('hidden');
  }
  function closeSheet() { sheetBd.classList.add('hidden'); }
  sheetBd.addEventListener('click', function (e) { if (e.target === sheetBd) closeSheet(); });
  $('sheet-save').addEventListener('click', function () {
    var name = $('f-name').value.trim(), phone = cleanPhone($('f-phone').value);
    if (!name || phone.length < 10) { toast('Enter name + valid 10-digit phone'); return; }
    var data = {
      name: name, phone: phone, email: $('f-email').value.trim(),
      room: $('f-room').value.trim(), rent: $('f-rent').value.trim() || '0',
      dueDay: $('f-dueday').value.trim() || '1'
    };
    if (editingId) {
      var r = DB.residents.find(function (x) { return x.id === editingId; });
      if (r) Object.assign(r, data);
    } else {
      DB.residents.push(Object.assign({ id: 'r' + (DB.seq++), paidFor: '', payments: [] }, data));
    }
    closeSheet(); save(); renderAll();
    toast(editingId ? 'Resident updated ✓' : 'Resident added ✓');
  });
  $('sheet-scan').addEventListener('click', function () { $('scan-input').click(); });
  $('scan-input').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var text = prompt('Paste the names/numbers from the photo (one per line, e.g. "Srinivas 9812345670"):');
      if (!text) return;
      var added = 0;
      text.split('\n').forEach(function (line) {
        var nums = line.match(/\d{10}/g);
        var nm = line.replace(/[\d,.\-+()]/g, '').trim();
        if (nm && nums && nums[0]) {
          DB.residents.push({ id: 'r' + (DB.seq++), name: nm, phone: nums[0], email: '', room: '', rent: '0', dueDay: '1', paidFor: '', payments: [] });
          added++;
        }
      });
      save(); renderAll();
      toast(added ? added + ' residents added ✓' : 'Could not read any entries');
    };
    rd.readAsDataURL(f);
    e.target.value = '';
  });

  /* ---------- detail sheet ---------- */
  var detailBd = $('detail-backdrop'), detailId = null;
  function openDetail(id) {
    var r = DB.residents.find(function (x) { return x.id === id; });
    if (!r) return;
    detailId = id;
    var st = statusOf(r);
    $('d-avatar').textContent = initials(r.name);
    $('d-avatar').setAttribute('style', avatarColor(r.name));
    $('d-name').textContent = r.name;
    $('d-meta').textContent = 'Room ' + (r.room || '—') + ' · ' + fmtINR(r.rent) + '/mo';
    $('d-phone').textContent = '+91 ' + cleanPhone(r.phone);
    $('d-room').textContent = r.room || '—';
    $('d-rent').textContent = fmtINR(r.rent);
    $('d-due').textContent = 'Day ' + (r.dueDay || 1);
    var pill = $('d-pill');
    pill.className = 'pill' + (st === 'paid' ? ' paid' : st === 'overdue' ? ' over' : ' unpaid');
    var dOd = daysOverdue(r);
    pill.textContent = st === 'paid' ? 'Paid' : st === 'overdue' ? (dOd > 0 ? dOd + 'd overdue' : 'Overdue') : 'Unpaid';
    var h = $('d-history');
    if (r.payments && r.payments.length) {
      h.innerHTML = r.payments.slice().reverse().map(function (p) {
        return '<div class="hist-row"><span>' + esc(p.date || p.ym) + '</span><b>' + fmtINR(p.amount) + '</b><span class="pill paid">Paid</span></div>';
      }).join('');
    } else { h.innerHTML = '<div class="empty small">No payments recorded yet.</div>'; }
    $('d-paid').style.display = st === 'paid' ? 'none' : '';
    $('d-remind').href = waLink(r);
    $('d-call').href = 'tel:+91' + cleanPhone(r.phone);
    detailBd.classList.remove('hidden');
  }
  function closeDetail() { detailBd.classList.add('hidden'); }
  detailBd.addEventListener('click', function (e) { if (e.target === detailBd) closeDetail(); });
  $('d-paid').addEventListener('click', function () {
    var r = DB.residents.find(function (x) { return x.id === detailId; });
    if (r) {
      r.paidFor = curYM;
      r.payments.push({ ym: curYM, date: curYM + '-' + ('0' + new Date().getDate()).slice(-2), amount: Number(r.rent) || 0 });
      save(); closeDetail(); renderAll();
      toast(r.name + ' marked paid ✓');
    }
  });
  $('d-send').addEventListener('click', function () { closeDetail(); if (detailId) openSend(detailId); });
  $('d-edit').addEventListener('click', function () { closeDetail(); openSheet(detailId); });
  $('d-del').addEventListener('click', function () {
    if (!confirm('Delete this resident?')) return;
    DB.residents = DB.residents.filter(function (x) { return x.id !== detailId; });
    save(); closeDetail(); renderAll();
    toast('Resident deleted');
  });

  /* ---------- send reminder screen ---------- */
  var sendId = null, sendChan = 'wa';
  function openSend(id) {
    var r = DB.residents.find(function (x) { return x.id === id; });
    if (!r) return;
    sendId = id; sendChan = 'wa';
    var st = statusOf(r);
    $('send-avatar').textContent = initials(r.name);
    $('send-avatar').setAttribute('style', avatarColor(r.name));
    $('send-name').textContent = r.name;
    $('send-meta').textContent = '+91 ' + cleanPhone(r.phone) + ' · Room ' + (r.room || '—') + ' · ' + fmtINR(r.rent);
    var pill = $('send-pill');
    pill.className = 'pill' + (st === 'paid' ? ' paid' : st === 'overdue' ? ' over' : ' unpaid');
    pill.textContent = st === 'paid' ? 'Paid' : st === 'overdue' ? 'Overdue' : 'Unpaid';
    $('send-msg').value = msgFor(r);
    setChan('wa');
    goTab('scr-send');
  }
  function setChan(ch) {
    sendChan = ch;
    document.querySelectorAll('.chan').forEach(function (c) { c.classList.toggle('active', c.dataset.ch === ch); });
    $('send-go').textContent = ch === 'wa' ? '💬 Send via WhatsApp' : ch === 'sms' ? '✉️ Send via SMS' : '📧 Send via Email';
  }
  document.querySelectorAll('.chan').forEach(function (c) {
    c.addEventListener('click', function () { setChan(c.dataset.ch); });
  });
  $('send-back').addEventListener('click', function () { goTab('scr-remind'); });
  $('send-go').addEventListener('click', function () {
    var r = DB.residents.find(function (x) { return x.id === sendId; });
    if (!r) return;
    var msg = $('send-msg').value;
    var ph = cleanPhone(r.phone);
    if (sendChan === 'wa') {
      window.open('https://wa.me/91' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    } else if (sendChan === 'sms') {
      var sep = /iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?';
      window.location.href = 'sms:+91' + ph + sep + 'body=' + encodeURIComponent(msg);
    } else {
      if (!r.email) { toast('No email saved — add one in Edit'); openSheet(r.id); return; }
      window.location.href = 'mailto:' + encodeURIComponent(r.email) + '?subject=' + encodeURIComponent('Rent reminder — ' + (DB.pgName || 'PG')) + '&body=' + encodeURIComponent(msg);
    }
  });
  $('send-schedule').addEventListener('click', function () {
    toast('Auto-scheduling comes with the paid pilot — send manually for now');
  });
  $('send-templates').addEventListener('click', function () {
    $('set-tpl-pay').value = DB.tpl_pay;
    $('set-tpl-over').value = DB.tpl_over;
    $('settings-backdrop').classList.remove('hidden');
  });

  /* ---------- remind tab ---------- */
  function renderRemind() {
    var list = $('remind-list'); list.innerHTML = '';
    var items = DB.residents.map(function (r) { return { r: r, st: statusOf(r) }; })
      .filter(function (x) { return x.st !== 'paid'; })
      .sort(function (a, b) {
        if (a.st === 'overdue' && b.st !== 'overdue') return -1;
        if (b.st === 'overdue' && a.st !== 'overdue') return 1;
        return daysOverdue(b.r) - daysOverdue(a.r);
      });
    $('remind-count').textContent = items.length;
    $('remind-empty').classList.toggle('hidden', items.length > 0);
    items.forEach(function (x) { list.appendChild(resRow(x.r, x.st, true)); });
  }
  $('btn-remind-all').addEventListener('click', function () {
    var first = DB.residents.map(function (r) { return { r: r, st: statusOf(r) }; }).find(function (x) { return x.st !== 'paid'; });
    if (!first) { toast('Everyone has paid 🎉'); return; }
    openSend(first.r.id);
  });
  $('btn-copy-dues').addEventListener('click', function () {
    var lines = DB.residents.map(function (r) { return { r: r, st: statusOf(r) }; })
      .filter(function (x) { return x.st !== 'paid'; })
      .map(function (x) { return '• ' + x.r.name + ' (Room ' + (x.r.room || '—') + ') — ' + fmtINR(x.r.rent) + (x.st === 'overdue' ? ' — ' + daysOverdue(x.r) + 'd overdue' : ''); });
    if (!lines.length) { toast('No dues to copy'); return; }
    var txt = 'Dues — ' + (DB.pgName || 'My PG') + ' (' + dueLabel({ dueDay: 1 }).split(' ')[1] + '):\n' + lines.join('\n');
    copyText(txt);
  });
  function copyText(txt) {
    function done() { toast('Dues list copied 📋'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed'); }
      ta.remove();
    }
  }

  /* ---------- settings ---------- */
  var setBd = $('settings-backdrop');
  $('settings-btn').addEventListener('click', function () {
    $('set-pgname').value = DB.pgName || '';
    $('set-upi').value = DB.upiId || '';
    $('set-tpl-pay').value = DB.tpl_pay;
    $('set-tpl-over').value = DB.tpl_over;
    setBd.classList.remove('hidden');
  });
  setBd.addEventListener('click', function (e) { if (e.target === setBd) setBd.classList.add('hidden'); });
  $('set-save').addEventListener('click', function () {
    DB.pgName = $('set-pgname').value.trim() || 'My PG';
    DB.upiId = $('set-upi').value.trim();
    DB.tpl_pay = $('set-tpl-pay').value.trim() || DEFAULT_PAY;
    DB.tpl_over = $('set-tpl-over').value.trim() || DEFAULT_OVER;
    save(); setBd.classList.add('hidden'); renderAll();
    toast('Settings saved ✓');
  });
  $('set-erase').addEventListener('click', function () {
    if (!confirm('Erase ALL residents and data?')) return;
    DB.residents = []; DB.seq = 1;
    save(); setBd.classList.add('hidden'); renderAll();
    toast('All data erased');
  });

  /* ---------- install ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferredPrompt = e;
    $('install-banner').classList.remove('hidden');
  });
  $('install-btn').addEventListener('click', function () {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
    else toast('Use your browser menu → Add to Home Screen');
  });

  /* ---------- render all / init ---------- */
  function renderAll() { renderHome(); renderResidents(); renderRemind(); }
  renderAll();
  showOnboard();
})();
