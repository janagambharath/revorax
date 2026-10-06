/**
 * Revorax Dental — Interaction Scripts
 * Dual audio-player demo widgets (missed-call callback + appointment reminder),
 * waveform visualiser, transcript switcher, scroll reveals.
 * Telugu-only demos (v2/v1: single-voice Cartesia Shanti — no conversation)
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── Dialogue Data (Telugu only) ─── */
  const DEMOS = {
    callback: {
      hasAudio: true,
      src: 'assets/telugu-demo-dental-v2.mp3',
      lines: [
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'హలో... రమేష్ గారు మాట్లాడుతున్నారా?', t: 0 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'నమస్తే, నేను ప్రియని... స్మైల్ కేర్ డెంటల్ క్లినిక్, దిల్షుక్ నగర్ నుంచి కాల్ చేస్తున్నాను.', t: 3.64 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'మీరు నిన్న మాకు కాల్ చేశారు కదా? అప్పుడు లిఫ్ట్ చేయలేకపోయాము.', t: 10.57 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'ఓకే... అయితే, రెండు చిన్న విషయాలు అడుగుతాను.', t: 15.18 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'మీకు పంటి నొప్పిగా ఉందా... లేక రెగ్యులర్ చెకప్ కోసమా?', t: 19.55 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'అర్థమైంది... నొప్పి ఉంటే ఆలస్యం చేయకూడదు.', t: 24.23 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'మీకు ఎప్పుడు వీలవుతుంది? రేపు పొద్దున్న పదకొండు గంటలకు స్లాట్ ఖాళీగా ఉంది.', t: 28.03 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'సరే... అయితే మీ అపాయింట్మెంట్ బుక్ అయింది.', t: 33.68 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'రేపు ఉదయం పదకొండు గంటలకు... డాక్టర్ గారు మిమ్మల్ని చూస్తారు.', t: 37.55 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'క్లినిక్ అడ్రస్... మీ వాట్సాప్ కి పంపిస్తాను.', t: 42.7 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'థాంక్యూ, రమేష్ గారు!', t: 46.34 },
      ],
    },
    reminder: {
      hasAudio: true,
      src: 'assets/telugu-demo-dental-followup-v2.mp3',
      lines: [
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'హలో... రమేష్ గారు మాట్లాడుతున్నారా?', t: 0 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'నమస్తే, నేను ప్రియని... స్మైల్ కేర్ డెంటల్ క్లినిక్ నుంచి కాల్ చేస్తున్నాను.', t: 3.56 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'రేపు ఉదయం పదకొండు గంటలకు మీ అపాయింట్మెంట్ ఉంది కదా?', t: 9.21 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'దాన్ని కన్ఫర్మ్ చేయడానికే కాల్ చేశాను.', t: 13.24 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'మీరు వస్తున్నారు కదా... లేక టైమ్ మార్చాలా?', t: 16.57 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'సరే... అయితే రేపు పదకొండు గంటలకు కన్ఫర్మ్ అయింది.', t: 20.44 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'పది నిమిషాలు ముందుగా వస్తే సరిపోతుంది.', t: 24.97 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'పాత రిపోర్ట్స్ ఏమైనా ఉంటే... తీసుకురండి.', t: 28.14 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'నొప్పి ఎక్కువైతే... ముందే కాల్ చేయండి.', t: 31.93 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'రేపు ఉదయం కలుద్దాం.', t: 35.57 },
        { who: 'ai', name: 'AI Voice Agent (Priya)', text: 'థాంక్యూ, రమేష్ గారు!', t: 37.85 },
      ],
    },
  };

  const BAR_COUNT = 60;

  function fmt(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${ss < 10 ? '0' : ''}${ss}`;
  }

  /* ─── One widget ─── */
  function initWidget(root, data) {
    const audio     = root.querySelector('.demo-audio');
    const playBtn   = root.querySelector('.play-btn');
    const iconPlay  = root.querySelector('.icon-play');
    const iconPause = root.querySelector('.icon-pause');
    const waveform  = root.querySelector('.waveform');
    const scrubber  = root.querySelector('.scrubber');
    const scrubFill = root.querySelector('.scrubber-fill');
    const timeTxt   = root.querySelector('.time-display');
    const dlList    = root.querySelector('.dialogue-list');
    const transcriptBox = root.querySelector('.transcript');
    const tglBtn    = root.querySelector('.transcript-toggle');

    let playing = false;
    let simTimer = null;
    let simSec = 0;
    const SIM_DUR = 48;

    /* transcript collapse */
    function setTranscript(open) {
      transcriptBox.classList.toggle('open', open);
      tglBtn.setAttribute('aria-expanded', String(open));
      tglBtn.innerHTML = open ? 'Hide transcript ▴' : 'View transcript ▾';
    }
    tglBtn.addEventListener('click', () => setTranscript(!transcriptBox.classList.contains('open')));

    /* waveform bars */
    waveform.innerHTML = '';
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = `${Math.sin((i / BAR_COUNT) * Math.PI) * 38 + 8}px`;
      waveform.appendChild(bar);
    }
    const bars = waveform.querySelectorAll('.bar');

    /* render transcript */
    dlList.innerHTML = '';
    data.lines.forEach((ln, i) => {
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

    function updateScrub(cur, tot) {
      if (!tot) tot = SIM_DUR;
      const pct = Math.min(100, Math.max(0, (cur / tot) * 100));
      scrubFill.style.width = `${pct}%`;
      timeTxt.textContent = `${fmt(cur)} / ${fmt(tot)}`;
      const rows = dlList.querySelectorAll('.dialogue-row');
      rows.forEach(r => r.classList.remove('active'));
      for (let i = rows.length - 1; i >= 0; i--) {
        if (cur >= parseFloat(rows[i].dataset.time || 0)) {
          rows[i].classList.add('active');
          break;
        }
      }
    }

    /* waveform animation */
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

    function showAudioError(msg) {
      if (timeTxt) timeTxt.textContent = msg;
    }

    // play() MUST be called synchronously inside the tap handler. The
    // browser buffers on its own — just call play() and let it.
    function toggle() {
      if (!playing) {
        playing = true;
        setTranscript(true);
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
        animWave(true);
        if (data.hasAudio && audio) {
          const p = audio.play();
          if (p) p.catch(() => {
            showAudioError('Tap play again to start audio');
            pause();
            try { audio.load(); } catch (e) {}
          });
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

    if (audio) {
      audio.addEventListener('loadedmetadata', () => {
        if (data.hasAudio && audio.duration) updateScrub(0, audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        if (data.hasAudio) updateScrub(audio.currentTime, audio.duration || SIM_DUR);
      });
      audio.addEventListener('ended', () => {
        const dur = audio.duration || SIM_DUR;
        if (audio.currentTime < dur - 1.5) {
          audio.play().catch(() => {});
          return;
        }
        pause(); updateScrub(0, dur);
      });
      audio.addEventListener('error', () => {
        if (playing) showAudioError('Audio error — tap play to retry');
      });
    }

    playBtn.addEventListener('click', toggle);

    scrubber.addEventListener('click', e => {
      const pct = (e.clientX - scrubber.getBoundingClientRect().left) / scrubber.offsetWidth;
      if (data.hasAudio && audio && audio.duration) {
        audio.currentTime = pct * audio.duration;
        updateScrub(audio.currentTime, audio.duration);
      } else { simSec = pct * SIM_DUR; updateScrub(simSec, SIM_DUR); }
    });

    updateScrub(0, SIM_DUR);
  }

  /* ─── Init all widgets ─── */
  document.querySelectorAll('.demo-widget').forEach(root => {
    const key = root.dataset.demo;
    if (DEMOS[key]) initWidget(root, DEMOS[key]);
  });

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
});
