/**
 * Revorax Voice Workflows — Interaction Scripts
 * Audio player, waveform visualiser, transcript switcher, scroll reveals
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ─── Elements ─── */
  const audio     = document.getElementById('demo-audio');
  const playBtn   = document.getElementById('play-btn');
  const iconPlay  = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const waveform  = document.getElementById('waveform');
  const scrubber  = document.getElementById('scrubber');
  const scrubFill = document.getElementById('scrubber-fill');
  const timeTxt   = document.getElementById('time-display');
  const langPills = document.querySelectorAll('.lang-pill');
  const dlList    = document.getElementById('dialogue-list');

  /* ─── Waveform bars ─── */
  const BAR_COUNT = 50;
  waveform.innerHTML = '';
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.sin((i / BAR_COUNT) * Math.PI) * 32 + 8}px`;
    waveform.appendChild(bar);
  }
  const bars = waveform.querySelectorAll('.bar');

  /* ─── Dialogue Data ─── */
  const DATA = {
    te: {
      hasAudio: true,
      src: 'assets/telugu-demo.mp3',
      title: 'Inbound Buyer Follow-Up (Telugu)',
      desc: 'Telugu Native Speech · 650ms Latency',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent', text: 'నమస్తే అండి, నేను సినర్జీ రియల్టీ నుండి మాట్లాడుతున్నాను. మీరు జూబ్లీహిల్స్ విల్లా ప్రాజెక్ట్ గురించి ఎంక్వైరీ చేశారు కదా, వివరాలు తెలుసుకోవడానికి మాట్లాడొచ్చా?', t: 0 },
        { who: 'prospect', name: 'Prospect',        text: 'అవునండి, నేను ఫేస్‌బుక్‌లో యాడ్ చూశాను. 3BHK విల్లా ప్రైసింగ్ మరియు పొజిషన్ డీటెయిల్స్ ఎలా ఉన్నాయి?', t: 6 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'కచ్చితంగా అండి. 3BHK విల్లాస్ 3200 sq.ft నుండి ప్రారంభమవుతాయి, ప్రైస్ 1.2 కోట్ల నుండి ఉంది. వచ్చే 6 నెలల్లో పొజిషన్ రెడీ అవుతుంది. మీరు ఈ శనివారం సైట్ విజిట్ ప్లాన్ చేసుకుంటారా?', t: 14 },
        { who: 'prospect', name: 'Prospect',        text: 'శనివారం ఉదయం 11 గంటలకు నాకు అనుకూలంగా ఉంటుంది.', t: 23 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'పర్ఫెక్ట్ అండి! శనివారం ఉదయం 11 గంటల స్లాట్ కన్ఫర్మ్ చేశాను. మీకు వాట్సాప్‌లో లొకేషన్ వివరాలు పంపించాను. ధన్యవాదాలు!', t: 27 },
      ],
    },
    en: {
      hasAudio: false,
      title: 'Instant Ad Follow-Up (English)',
      desc: 'US / Indian English · Instant Speed-to-Lead',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent', text: 'Hello Arjun! I noticed you just submitted an enquiry for the Lakeview Luxury Villas. Calling to share project details — is now a good time?', t: 0 },
        { who: 'prospect', name: 'Prospect',        text: 'Yes, hi! I wanted to check the pricing for 3BHK units and whether possession is ready this year.', t: 5 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'The 3BHK luxury villas start at ₹1.2 Cr, and Phase 1 is handover-ready by November. What is your preferred budget range?', t: 12 },
        { who: 'prospect', name: 'Prospect',        text: 'My budget is around 1 to 1.3 Cr for self-use. I would like to inspect the site.', t: 20 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'Wonderful, Arjun. That fits our Phase 1 premium villas perfectly. Would Saturday at 11:00 AM or Sunday at 3:00 PM work for a walkthrough?', t: 26 },
      ],
    },
    hi: {
      hasAudio: false,
      title: 'Lead Qualification Call (Hindi)',
      desc: 'Hindi Conversational · Real-Time CRM Sync',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent', text: 'नमस्ते अर्जुन जी! आपने अभी हमारे जुबली हिल्स प्रीमियम विला प्रोजेक्ट के लिए इन्क्वायरी की थी। क्या दो मिनट बात हो सकती है?', t: 0 },
        { who: 'prospect', name: 'Prospect',        text: 'हाँ, बताइए। मुझे 3BHK विला का बजट और पज़ेशन टाइमलाइन जानना था।', t: 6 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'बिल्कुल सर। 3BHK विला 1.2 करोड़ से शुरू हैं और रेडी-टू-मूव हैं। क्या आप इस वीकेंड साइट विज़िट शेड्यूल करना चाहेंगे?', t: 14 },
        { who: 'prospect', name: 'Prospect',        text: 'हाँ, इस शनिवार सुबह 11:30 बजे ठीक रहेगा।', t: 22 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'शानदार! शनिवार 11:30 AM का स्लॉट बुक हो गया है। लोकेशन और गेट पास आपके व्हाट्सएप पर भेज दिया गया है। धन्यवाद!', t: 26 },
      ],
    },
  };

  let lang     = 'te';
  let playing  = false;
  let simTimer = null;
  let simSec   = 0;
  const SIM_DUR = 34;

  /* ─── Render transcript ─── */
  function renderTranscript(key) {
    const d = DATA[key];
    document.getElementById('track-title').textContent   = d.title;
    document.getElementById('track-subtitle').textContent = d.desc;
    document.getElementById('track-name').textContent     = d.title;
    document.getElementById('track-desc-text').textContent = d.desc;

    dlList.innerHTML = '';
    d.lines.forEach((ln, i) => {
      const row = document.createElement('div');
      row.className = `dialogue-row ${ln.who}${i === 0 ? ' active' : ''}`;
      row.dataset.time = ln.t;
      row.innerHTML = `
        <div class="d-avatar ${ln.who === 'ai' ? 'ai' : 'prospect'}">${ln.who === 'ai' ? 'AI' : 'P'}</div>
        <div class="d-body">
          <div class="d-name">${ln.name}</div>
          <div class="d-text">${ln.text}</div>
        </div>`;
      dlList.appendChild(row);
    });
  }

  /* ─── Helpers ─── */
  function fmt(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${ss < 10 ? '0' : ''}${ss}`;
  }

  function updateScrub(cur, tot) {
    if (!tot) tot = SIM_DUR;
    const pct = Math.min(100, Math.max(0, (cur / tot) * 100));
    scrubFill.style.width = `${pct}%`;
    timeTxt.textContent = `${fmt(cur)} / ${fmt(tot)}`;
    // highlight transcript
    const rows = dlList.querySelectorAll('.dialogue-row');
    rows.forEach(r => r.classList.remove('active'));
    for (let i = rows.length - 1; i >= 0; i--) {
      if (cur >= parseFloat(rows[i].dataset.time || 0)) {
        rows[i].classList.add('active');
        break;
      }
    }
  }

  /* ─── Waveform animation ─── */
  let waveAnim = null;
  function animWave(on) {
    if (on) {
      waveform.classList.add('playing');
      waveAnim = setInterval(() => {
        bars.forEach((b, i) => {
          const h = (Math.sin(i * 0.55 + Date.now() * 0.006) + 1.2) * 18 + 6;
          b.style.height = `${Math.min(48, Math.max(6, h))}px`;
        });
      }, 130);
    } else {
      waveform.classList.remove('playing');
      if (waveAnim) clearInterval(waveAnim);
      bars.forEach((b, i) => {
        b.style.height = `${Math.sin((i / BAR_COUNT) * Math.PI) * 32 + 8}px`;
      });
    }
  }

  /* ─── Play / Pause ─── */
  async function toggle() {
    if (!playing) {
      playing = true;
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      animWave(true);
      if (DATA[lang].hasAudio && audio) {
        try { await audio.play(); } catch { simPlay(); }
      } else { simPlay(); }
    } else { pause(); }
  }

  function pause() {
    playing = false;
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    animWave(false);
    if (audio) audio.pause();
    if (simTimer) clearInterval(simTimer);
  }

  function simPlay() {
    if (simTimer) clearInterval(simTimer);
    simTimer = setInterval(() => {
      simSec += 0.5;
      if (simSec >= SIM_DUR) { simSec = 0; pause(); updateScrub(0, SIM_DUR); }
      else updateScrub(simSec, SIM_DUR);
    }, 500);
  }

  /* Audio hooks */
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      if (DATA[lang].hasAudio) updateScrub(audio.currentTime, audio.duration || SIM_DUR);
    });
    audio.addEventListener('ended', () => { pause(); updateScrub(0, audio.duration || SIM_DUR); });
  }

  playBtn.addEventListener('click', toggle);

  /* Scrubber seek */
  scrubber.addEventListener('click', e => {
    const pct = (e.clientX - scrubber.getBoundingClientRect().left) / scrubber.offsetWidth;
    if (DATA[lang].hasAudio && audio && audio.duration) {
      audio.currentTime = pct * audio.duration;
      updateScrub(audio.currentTime, audio.duration);
    } else { simSec = pct * SIM_DUR; updateScrub(simSec, SIM_DUR); }
  });

  /* Language pills */
  langPills.forEach(pill => {
    pill.addEventListener('click', () => {
      langPills.forEach(p => { p.classList.remove('active'); p.setAttribute('aria-selected', 'false'); });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      lang = pill.dataset.lang;
      pause();
      if (audio) audio.currentTime = 0;
      simSec = 0;
      updateScrub(0, SIM_DUR);
      renderTranscript(lang);
    });
  });

  /* ─── Audit form ─── */
  const auditForm = document.getElementById('audit-form');
  if (auditForm) {
    auditForm.addEventListener('submit', e => {
      e.preventDefault();
      const phone = document.getElementById('audit-phone').value.trim();
      if (!phone) return;
      const msg = encodeURIComponent(`Hi Revorax, I would like a Free Lead Workflow Audit. My number is: ${phone}`);
      window.open(`https://wa.me/917995854994?text=${msg}`, '_blank');
      const btn = auditForm.querySelector('button[type="submit"]');
      btn.innerHTML = '<span>Sent! Opening WhatsApp… ✓</span>';
    });
  }

  /* ─── Scroll Reveal (IntersectionObserver) ─── */
  const revealEls = document.querySelectorAll('.reveal, .stagger');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => observer.observe(el));

  /* ─── Init ─── */
  renderTranscript('te');
});
