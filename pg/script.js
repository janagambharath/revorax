/* REVORAX PG — demo widget + reveal */

(function () {
  'use strict';

  /* ─── Reveal on scroll ─── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ─── Demo step tabs ─── */
  var stepBtns = Array.prototype.slice.call(document.querySelectorAll('.demo-step'));
  var panes = {
    1: document.getElementById('pane-1'),
    2: document.getElementById('pane-2'),
    3: document.getElementById('pane-3')
  };
  function goStep(n) {
    stepBtns.forEach(function (b) {
      var s = parseInt(b.dataset.step, 10);
      b.classList.toggle('active', s === n);
      b.classList.toggle('done', s < n);
    });
    Object.keys(panes).forEach(function (k) {
      panes[k].classList.toggle('active', parseInt(k, 10) === n);
    });
  }
  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () { goStep(parseInt(b.dataset.step, 10)); });
  });

  /* ─── Sample resident data (demo) ─── */
  var RESIDENTS = [
    { name: 'Ravi Kumar',   phone: '98765 43210', room: '101', rent: '6500', due: '5', status: 'overdue' },
    { name: 'Suresh Reddy', phone: '91234 56780', room: '102', rent: '6500', due: '5', status: 'paid' },
    { name: 'Anil Verma',   phone: '99887 76655', room: '103', rent: '7000', due: '5', status: 'unpaid' },
    { name: 'Prakash Rao',  phone: '90123 45678', room: '201', rent: '6000', due: '5', status: 'paid' },
    { name: 'Kiran Reddy',  phone: '88990 01122', room: '202', rent: '6500', due: '5', status: 'overdue' },
    { name: 'Manoj Tiwari', phone: '77665 54433', room: '203', rent: '7000', due: '5', status: 'unpaid' }
  ];
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var thisMonth = MONTHS[new Date().getMonth()];

  /* ─── Step 1: upload / sample → scan ─── */
  var zone = document.getElementById('upload-zone');
  var input = document.getElementById('photo-input');
  var inner = document.getElementById('upload-inner');
  var scanView = document.getElementById('scan-view');
  var scanImg = document.getElementById('scan-img');
  var scanText = document.getElementById('scan-text');
  var sampleBtn = document.getElementById('sample-btn');
  var scanning = false;

  function sampleRegisterHTML() {
    return '<div class="sample-register"><h4>Tenants — Oct register</h4>' +
      '1. Ravi Kumar — 9876543210<br>' +
      '2. Suresh Reddy — 9123456780<br>' +
      '3. Anil Verma — 9988776655<br>' +
      '4. Prakash Rao — 9012345678<br>' +
      '5. Kiran Reddy — 8899001122<br>' +
      '6. Manoj Tiwari — 7766554433</div>';
  }

  function startScan(imgHTML, isUpload) {
    if (scanning) return;
    scanning = true;
    inner.hidden = true;
    scanView.hidden = false;
    if (imgHTML) {
      scanImg.style.display = 'none';
      var holder = document.getElementById('scan-sample-holder');
      if (!holder) {
        holder = document.createElement('div');
        holder.id = 'scan-sample-holder';
        scanView.insertBefore(holder, scanView.firstChild);
      }
      holder.innerHTML = imgHTML;
      holder.style.display = 'block';
    } else {
      scanImg.style.display = 'block';
      var h = document.getElementById('scan-sample-holder');
      if (h) h.style.display = 'none';
    }
    var msgs = ['Reading names & phone numbers…', 'Matching rooms & rent…', 'Almost done…'];
    var i = 0;
    scanText.textContent = msgs[0];
    var tick = setInterval(function () {
      i++;
      if (i < msgs.length) scanText.textContent = msgs[i];
    }, 900);
    setTimeout(function () {
      clearInterval(tick);
      scanning = false;
      buildTable();
      goStep(2);
      // reset zone for next time
      setTimeout(function () {
        scanView.hidden = true;
        inner.hidden = false;
        input.value = '';
      }, 400);
    }, 2800);
  }

  zone.addEventListener('click', function (e) {
    if (e.target.closest('#sample-btn')) return;
    input.click();
  });
  input.addEventListener('change', function () {
    if (!input.files || !input.files[0]) return;
    var url = URL.createObjectURL(input.files[0]);
    scanImg.src = url;
    startScan(null, true);
  });
  sampleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    scanImg.removeAttribute('src');
    startScan(sampleRegisterHTML(), false);
  });

  /* ─── Step 2: editable verify table ─── */
  var table = document.getElementById('resident-table');
  function buildTable() {
    document.getElementById('extract-count').textContent = RESIDENTS.length;
    table.innerHTML = '';
    RESIDENTS.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'resident-row';
      row.innerHTML =
        '<div><span class="fld-label">Name</span><input value="' + r.name + '"></div>' +
        '<div><span class="fld-label">Phone</span><input value="' + r.phone + '"></div>' +
        '<div><span class="fld-label">Room</span><input value="' + r.room + '"></div>' +
        '<div><span class="fld-label">Rent ₹</span><input value="' + r.rent + '"></div>' +
        '<div><span class="fld-label">Due (date)</span><input value="' + r.due + ' ' + thisMonth + '"></div>';
      table.appendChild(row);
    });
  }

  document.getElementById('verify-btn').addEventListener('click', function () {
    // read back any edits into RESIDENTS
    var rows = table.querySelectorAll('.resident-row');
    rows.forEach(function (row, i) {
      var ins = row.querySelectorAll('input');
      if (RESIDENTS[i]) {
        RESIDENTS[i].name = ins[0].value;
        RESIDENTS[i].phone = ins[1].value;
        RESIDENTS[i].room = ins[2].value;
        RESIDENTS[i].rent = ins[3].value;
      }
    });
    buildDash();
    goStep(3);
  });

  /* ─── Step 3: dashboard + WhatsApp preview ─── */
  var dashList = document.getElementById('dash-list');
  function buildDash() {
    var paid = 0, unpaid = 0, overdue = 0;
    dashList.innerHTML = '';
    RESIDENTS.forEach(function (r, i) {
      if (r.status === 'paid') paid++;
      else if (r.status === 'unpaid') unpaid++;
      else overdue++;
      var row = document.createElement('div');
      row.className = 'dash-row';
      row.innerHTML = '<div><strong>' + r.name + '</strong><br><span class="muted">Room ' + r.room +
        ' · ₹' + Number(r.rent).toLocaleString('en-IN') + '</span></div>' +
        '<span class="badge ' + r.status + '">' + r.status + '</span>';
      row.style.cursor = 'pointer';
      row.addEventListener('click', function () { setWaPreview(i); });
      dashList.appendChild(row);
    });
    document.getElementById('st-paid').textContent = paid;
    document.getElementById('st-unpaid').textContent = unpaid;
    document.getElementById('st-overdue').textContent = overdue;
    setWaPreview(0);
  }

  function setWaPreview(i) {
    var r = RESIDENTS[i] || RESIDENTS[0];
    document.getElementById('wa-name').textContent = r.name.split(' ')[0];
    document.getElementById('wa-amt').textContent = '₹' + Number(r.rent).toLocaleString('en-IN');
    document.getElementById('wa-date').textContent = r.due + ' ' + thisMonth;
  }

  /* recurring toggle copy */
  var recurToggle = document.getElementById('recur-toggle');
  var recurDesc = document.getElementById('recur-desc');
  recurToggle.addEventListener('change', function () {
    recurDesc.textContent = recurToggle.checked
      ? '2 days before due date · on due date · 3 & 7 days overdue'
      : 'Reminders paused — turn back on anytime.';
  });
})();
