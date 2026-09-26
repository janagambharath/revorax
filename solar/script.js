/**
 * Revorax Solar — Interaction Scripts
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
  const BAR_COUNT = 60;
  waveform.innerHTML = '';
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.sin((i / BAR_COUNT) * Math.PI) * 38 + 8}px`;
    waveform.appendChild(bar);
  }
  const bars = waveform.querySelectorAll('.bar');

  /* ─── Dialogue Data ─── */
  const DATA = {
    te: {
      hasAudio: true,
      src: 'assets/telugu-demo-solar-v2.mp3',
      title: 'Inbound Ad Follow-Up — Solar Lead (Telugu)',
      desc: 'Telugu Native Speech · Instant Qualification · Facebook Lead',
      extraction: '✓ Extracted: Solar · Rooftop · Bill ₹3K · Qualified',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'హలో... భారత్ గారు మాట్లాడుతున్నారా అండి?', t: 0 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'అవునండి, మాట్లాడుతున్నాను. ఎవరండి?', t: 2.2 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'నమస్తే అండి, నేను ప్రియాని... శ్రీ సూర్యా సోలార్ నుంచి కాల్ చేస్తున్నాను.', t: 4.6 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'మీరు రూఫ్‌టాప్ సోలార్ గురించి... ఫేస్‌బుక్‌లో ఎంక్వైరీ చేశారు కదండీ?', t: 8.5 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'ఆ, చేశానండి. చెప్పండి.', t: 12.5 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'ఓకే అండి... అయితే, రెండు చిన్న విషయాలు అడుగుతాను.', t: 14.5 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'మీది ఇండిపెండెంట్ హౌసా అండి?', t: 18.2 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'అవునండి, ఇండిపెండెంట్ హౌసే.', t: 21.8 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'ఓకే... టెర్రస్ మీద ఖాళీ స్థలం ఉందా అండి?', t: 24.5 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'ఉందండి, పైన ఖాళీగానే ఉంది.', t: 26.3 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'మంచిదండి. మరి... నెలకు కరెంట్ బిల్లు ఎంత వస్తుంది?', t: 29.9 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'మ్మ్... మూడు వేల దాకా వస్తుందండి.', t: 32.3 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'అర్థమైంది అండి... అంటే, ఇండిపెండెంట్ హౌస్, టెర్రస్ ఖాళీ, బిల్లు మూడు వేలు — కదండీ?', t: 34.0 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'అవునండి, కరెక్ట్.', t: 37.9 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'సరేనండి, అయితే మీ ఎంక్వైరీ క్వాలిఫైడ్ అయింది.', t: 38.8 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'మా టీమ్... సైట్ సర్వే కోసం మిమ్మల్ని కాంటాక్ట్ చేస్తారు.', t: 41.6 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'థాంక్యూ అండి, భారత్ గారు!', t: 42.8 },
      ],
    },
    en: {
      hasAudio: false,
      title: 'Solar Lead Follow-Up (English)',
      desc: 'English · Instant Speed-to-Lead · Solar Rooftop',
      extraction: '✓ Extracted: 5kW Rooftop · Budget ₹3.5L · Site Survey Confirmed',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent', text: 'Hello Arjun! I noticed you just submitted an enquiry for rooftop solar installation. Calling to share details — is now a good time?', t: 0 },
        { who: 'prospect', name: 'Prospect',        text: 'Yes, hi! I wanted to check the pricing for a 5kW system and whether installation can happen this month.', t: 5 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'A 5kW rooftop system starts at ₹3.2 Lakhs with subsidy, and our team can complete installation within 10 days. What is your preferred budget range?', t: 12 },
        { who: 'prospect', name: 'Prospect',        text: 'My budget is around 3 to 3.5 Lakhs. I would like a site survey first.', t: 20 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'That fits our premium panel range perfectly. Would Saturday at 10:00 AM or Monday at 2:00 PM work for a site survey?', t: 26 },
      ],
    },
    hi: {
      hasAudio: false,
      title: 'Solar Lead Qualification (Hindi)',
      desc: 'Hindi Conversational · Real-Time CRM Sync',
      extraction: '✓ Extracted: 3kW Rooftop · Budget ₹2.5L · Site Survey Saturday',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent', text: 'नमस्ते अर्जुन जी! आपने अभी हमारे सोलर रूफटॉप इंस्टॉलेशन के लिए इन्क्वायरी की थी। क्या दो मिनट बात हो सकती है?', t: 0 },
        { who: 'prospect', name: 'Prospect',        text: 'हाँ, बताइए। मुझे 3kW सिस्टम का बजट और सब्सिडी जानना था।', t: 6 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'बिल्कुल सर। 3kW सिस्टम ₹2.5 लाख से शुरू है सब्सिडी के बाद, और 7 दिन में इंस्टॉलेशन हो जाता है। क्या आप इस वीकेंड साइट सर्वे शेड्यूल करना चाहेंगे?', t: 14 },
        { who: 'prospect', name: 'Prospect',        text: 'हाँ, इस शनिवार सुबह 11 बजे ठीक रहेगा।', t: 22 },
        { who: 'ai',       name: 'AI Voice Agent', text: 'शानदार! शनिवार 11:00 AM का स्लॉट बुक हो गया है। लोकेशन डिटेल्स आपके व्हाट्सएप पर भेज दिए गए हैं। धन्यवाद!', t: 26 },
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

    const badge = document.querySelector('.extraction-badge');
    if (badge && d.extraction) {
      badge.textContent = d.extraction;
    }

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
          b.style.height = `${Math.min(54, Math.max(6, h))}px`;
        });
      }, 130);
    } else {
      waveform.classList.remove('playing');
      if (waveAnim) clearInterval(waveAnim);
      bars.forEach((b, i) => {
        b.style.height = `${Math.sin((i / BAR_COUNT) * Math.PI) * 38 + 8}px`;
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
      if (audio) {
        if (DATA[lang].hasAudio && DATA[lang].src) { audio.src = DATA[lang].src; }
        audio.currentTime = 0;
      }
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
      const msg = encodeURIComponent(`Hi Revorax, I would like a Free Solar Lead Workflow Audit. My number is: ${phone}`);
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
