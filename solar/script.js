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
      hasAudio: true,
      src: 'assets/english-demo-solar.mp3',
      title: 'Inbound Ad Follow-Up — Solar Lead (English)',
      desc: 'English Native Speech · Instant Qualification · Facebook Lead',
      extraction: '✓ Extracted: Solar · Independent House · Bill ₹3K · Qualified',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Hello... am I speaking with Bharat?', t: 0.6 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'Yes, speaking. Who\'s this?', t: 5.6 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Hi, I\'m Priya... calling from Sri Surya Solar.', t: 9.0 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'You\'d enquired about rooftop solar... on Facebook, right?', t: 14.7 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'Yes, I did. Tell me.', t: 18.3 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Great... so just two quick things. Yours is an independent house, correct?', t: 20.5 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'Yes, independent house.', t: 26.0 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Nice. And... is there open space on the terrace?', t: 28.3 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'Yes, the terrace is mostly empty.', t: 33.3 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Got it... so what\'s the monthly electricity bill like?', t: 35.3 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'Hmm... around three thousand.', t: 38.9 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Understood... so, independent house, empty terrace, three-thousand bill — correct?', t: 41.5 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'Yes, that\'s right.', t: 45.9 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'Then your enquiry qualifies. Our team... will contact you for the site survey. Thank you!', t: 47.5 },
      ],
    },
    hi: {
      hasAudio: true,
      src: 'assets/hindi-demo-solar.mp3',
      title: 'Inbound Ad Follow-Up — Solar Lead (Hindi)',
      desc: 'Hindi Native Speech · Instant Qualification · Facebook Lead',
      extraction: '✓ Extracted: Solar · Independent House · Bill ₹3K · Qualified',
      lines: [
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'नमस्ते... भरत जी बात कर रहे हैं?', t: 0 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'हाँ, बोल रहा हूँ। कौन?', t: 3.5 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'नमस्ते, मैं प्रिया बोल रही हूँ... श्री सूर्या सोलर से कॉल कर रही हूँ।', t: 5.8 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'आपने रूफटॉप सोलर के बारे में... फेसबुक पर इन्क्वायरी की थी, है ना?', t: 11.5 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'हाँ, की थी। बताइए।', t: 16.7 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'ठीक है... तो दो छोटी बातें पूछूँगी। आपका इंडिपेंडेंट हाउस है ना?', t: 19.5 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'हाँ, इंडिपेंडेंट हाउस ही है।', t: 22.8 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'बढ़िया। और... छत पर खाली जगह है?', t: 25.1 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'हाँ, छत खाली ही है।', t: 31.6 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'अच्छा... तो महीने का बिजली बिल कितना आता है?', t: 34.3 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'हम्म... तीन हज़ार तक आ जाता है।', t: 38.8 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'समझ गई... मतलब, इंडिपेंडेंट हाउस, छत खाली, बिल तीन हज़ार — सही है ना?', t: 42.1 },
        { who: 'prospect', name: 'Bharath (Prospect)',     text: 'हाँ, बिल्कुल सही।', t: 49.1 },
        { who: 'ai',       name: 'AI Voice Agent (Priya)', text: 'तो आपकी इन्क्वायरी क्वालिफाई हो गई है। हमारी टीम... साइट सर्वे के लिए संपर्क करेगी। धन्यवाद!', t: 51.3 },
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
    audio.addEventListener('loadedmetadata', () => {
      if (DATA[lang].hasAudio && audio.duration) updateScrub(0, audio.duration);
    });
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
