(() => {
  const d = document, root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAY = 864e5, MIN = 6e4;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const PMC = 'Philadelphia Meditation Center, 8 East Eagle Road, Havertown, PA 19083';
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const wall = t => { const p = {}; fmt.formatToParts(new Date(t)).forEach(x => { p[x.type] = +x.value; }); return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute); };
  const real = w => { let t = w + 18e6; t = w - (wall(t) - t); return w - (wall(t) - t); };
  const hm = m => m === 720 ? 'Noon' : `${(Math.floor(m / 60) + 11) % 12 + 1}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'AM' : 'PM'}`;

  const sessionsOn = day => {
    const dt = new Date(day), dow = dt.getUTCDay(), n = dt.getUTCDate(), out = [];
    const add = (t, s, e, zoom, info, doors = null, where = PMC) => out.push({ t, s, e, zoom, info, doors, where, day });
    if (dow === 0 && n > 21 && n < 29) add('4th Sunday Dharmette, Sit and Practice Discussion', 660, 750, true, 'A short Dharmette, a sit, and a practice discussion.');
    if (dow === 0) add('Sunday Evening Meditation', 1140, 1215, true, 'Half hour sitting, 15 minutes walking, half hour sitting, then tea.', 1110);
    if (dow === 3) {
      add('Meditation and Dharma Talk with Venerable Bhante Chandrawansa', 1170, null, true, 'Teachings from the Majjhima Nikaya, the Middle Length Discourses of the Buddha.');
      add('Meditation and Recovery', 1170, null, true, 'Weekly meeting. Contact Greg Ardire with questions.', 1140);
    }
    if (dow === 6) add('Saturday Meditation Session', 570, 720, false, 'Sit, walk, break for tea, and repeat. Come for all of it or part of it.');
    if (dow === 6 && n > 7 && n < 15) add('Daylong Meditation Session', null, null, false, 'Led by Venerable Bhante Chandrawansa. Call or email for times.');
    if (day >= Date.UTC(2026, 10, 20) && day <= Date.UTC(2026, 10, 22)) add('NVISION Residential Weekend Retreat', null, null, false, 'An Insight Meditation retreat led by Matthew Daniell.', null, 'Saint Raphaela Center, 616 Coopertown Road, Haverford, PA');
    return out;
  };

  let filter = 'all', cur = null;
  const ok = s => filter === 'all' || (filter === 'zoom' ? s.zoom : true);
  const today = () => { const w = wall(Date.now()); return [w - w % DAY, (w % DAY) / MIN, w]; };
  const next = () => {
    const [t0, , w] = today();
    for (let i = 0; i < 62; i++) {
      for (const s of sessionsOn(t0 + i * DAY)) {
        if (s.s !== null && ok(s) && w < s.day + (s.e ?? s.s) * MIN) return s;
      }
    }
    return null;
  };
  const dur = ms => {
    const m = Math.max(1, Math.ceil(ms / MIN)), h = Math.floor(m / 60), dd = Math.floor(h / 24);
    return m < 60 ? `${m} min` : h < 24 ? `${h} h ${m % 60} min` : `${dd} day${dd > 1 ? 's' : ''} ${h % 24} h`;
  };

  const box = $('[data-next]'), list = $('[data-week]'), month = $('[data-month]');

  const show = () => {
    if (!box) return;
    cur = next();
    if (!cur) throw new Error('no session');
    const [t0] = today(), dt = new Date(cur.day), off = (cur.day - t0) / DAY, name = DAYS[dt.getUTCDay()];
    const ans = $('[data-answer]', box);
    ans.classList.add('is-live');
    ans.textContent = `${off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : name}, ${hm(cur.s)}`;
    $('[data-what]', box).textContent = `${cur.t}. ${name}, ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}. ${cur.doors ? `Doors open ${hm(cur.doors)}. ` : ''}${cur.zoom ? 'In person and on Zoom.' : 'In person only.'}`;
    $$('[data-zoom]', box).forEach(el => { el.hidden = !cur.zoom; });
    $$('[data-key]').forEach(r => r.classList.toggle('is-lit', cur.t.startsWith(r.dataset.key)));
    tick();
  };

  const tick = () => {
    if (!cur) return;
    const now = Date.now(), st = real(cur.day + cur.s * MIN), en = cur.e === null ? null : real(cur.day + cur.e * MIN);
    if (now >= (en ?? st)) { show(); week(); return; }
    const live = now >= st;
    $('[data-count-label]', box).textContent = live ? `Sitting now, until ${hm(cur.e)}` : 'Next sitting begins in';
    $('[data-count]', box).textContent = live ? '' : dur(st - now);
  };

  const pct = m => ((Math.min(Math.max(m, 360), 1320) - 360) / 9.6).toFixed(2);
  const week = () => {
    if (!list) return;
    const [t0, nowM] = today();
    let html = '';
    for (let i = 0; i < 7; i++) {
      const day = t0 + i * DAY, dt = new Date(day), name = DAYS[dt.getUTCDay()], ss = sessionsOn(day).filter(ok), lit = cur && cur.day === day;
      const sess = ss.map(s => `<p class="sess"><strong>${s.s === null ? (s.where === PMC ? 'Call for times' : 'Retreat') : hm(s.s)}</strong><span>${s.t}<small>${s.zoom ? 'In person and on Zoom' : s.where === PMC ? 'In person' : s.where}</small></span></p>`).join('') || '<p class="quiet">No sitting this day</p>';
      const blocks = ss.map(s => s.s === null ? '<b class="blk all"></b>' : `<b class="blk${s.e === null ? ' ongoing' : ''}" style="left:${pct(s.s)}%;width:${pct(360 + (s.e ?? s.s + 45) - s.s)}%"></b>`).join('');
      const nowLine = i === 0 && nowM > 360 && nowM < 1320 ? `<i class="now" style="left:${pct(nowM)}%"></i>` : '';
      html += `<li class="day${lit ? ' is-lit' : ''}"><p class="day-date">${lit ? '<span class="sr-only">Next sitting: </span>' : ''}<strong>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : name}</strong>${i < 2 ? name.slice(0, 3) + ' ' : ''}${MONTHS[dt.getUTCMonth()].slice(0, 3)} ${dt.getUTCDate()}</p><div class="day-what">${sess}</div><div class="track" aria-hidden="true">${blocks}${nowLine}</div></li>`;
    }
    list.innerHTML = html;
  };

  const grid = () => {
    if (!month) return;
    const [t0] = today(), dt = new Date(t0), y = dt.getUTCFullYear(), mo = dt.getUTCMonth();
    const first = new Date(Date.UTC(y, mo, 1)).getUTCDay(), len = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    let html = `<caption>${MONTHS[mo]} ${y}<small>Blue: second Saturday daylong. Light blue: 4th Sunday Dharmette.</small></caption><tr>${DAYS.map(x => `<th scope="col" abbr="${x}">${x.slice(0, 2)}</th>`).join('')}</tr><tr>${'<td></td>'.repeat(first)}`;
    for (let n = 1; n <= len; n++) {
      const dow = (first + n - 1) % 7, two = dow === 6 && n > 7 && n < 15, four = dow === 0 && n > 21 && n < 29;
      const cls = [two && 'is-day', four && 'is-fourth', n === dt.getUTCDate() && 'is-today'].filter(Boolean).join(' ');
      html += `<td${cls ? ` class="${cls}"` : ''}>${n}${two ? '<span class="sr-only"> Daylong</span>' : four ? '<span class="sr-only"> 4th Sunday Dharmette</span>' : ''}</td>${dow === 6 && n < len ? '</tr><tr>' : ''}`;
    }
    month.innerHTML = `${html}</tr>`;
  };

  const sky = () => {
    const [, m] = today(), h = m / 60;
    root.dataset.sky = h >= 5 && h < 10 ? 'dawn' : h >= 10 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night';
    const f = m >= 300 && m < 1260 ? (m - 300) / 960 : ((m + 180) % 1440) / 480;
    root.style.setProperty('--tx', `${(10 + f * 80).toFixed(1)}%`);
    root.style.setProperty('--ty', `${(80 - Math.sin(Math.PI * f) * 60).toFixed(1)}%`);
  };

  const stamp = w => new Date(w).toISOString().replace(/[-:]/g, '').slice(0, 15);
  const esc = s => s.replace(/[,;\\]/g, c => `\\${c}`);
  const ics = s => {
    const tz = ['BEGIN:VTIMEZONE', 'TZID:America/New_York', 'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'TZNAME:EDT', 'END:DAYLIGHT', 'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'TZNAME:EST', 'END:STANDARD', 'END:VTIMEZONE'];
    const ev = ['BEGIN:VEVENT', `UID:${stamp(s.day + s.s * MIN)}-${s.t.replace(/\W+/g, '').slice(0, 16)}@philadelphiameditation.org`, `DTSTAMP:${stamp(Date.now())}Z`, `DTSTART;TZID=America/New_York:${stamp(s.day + s.s * MIN)}`];
    if (s.e !== null) ev.push(`DTEND;TZID=America/New_York:${stamp(s.day + s.e * MIN)}`);
    ev.push(`SUMMARY:${esc(s.t)}`, `LOCATION:${esc(s.where)}`, `DESCRIPTION:${esc(`${s.info} ${s.zoom ? 'Also on Zoom: email phlmedctr@aol.com for access. ' : ''}Please call (610) 853-8200 or email to confirm.`)}`, 'END:VEVENT');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Philadelphia Meditation Center//Next sitting//EN', 'CALSCALE:GREGORIAN', ...tz, ...ev, 'END:VCALENDAR'].join('\r\n');
  };
  const save = () => {
    const url = URL.createObjectURL(new Blob([ics(cur)], { type: 'text/calendar' }));
    const a = Object.assign(d.createElement('a'), { href: url, download: 'pmc-next-sitting.ics' });
    d.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fail = () => {
    $$('[data-empty]').forEach(el => { el.hidden = false; });
    $$('[data-live]').forEach(el => { el.hidden = true; });
    $$('[data-key]').forEach(r => r.classList.remove('is-lit'));
  };
  const run = () => { try { show(); week(); } catch (err) { fail(); } };

  d.addEventListener('click', e => {
    const b = e.target.closest('[data-filter],[data-ics],[data-neutral]');
    if (!b) return;
    if (b.dataset.filter) {
      filter = b.dataset.filter;
      $$('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === filter)));
      run();
    }
    if (b.hasAttribute('data-ics') && cur) save();
    if (b.hasAttribute('data-neutral')) b.setAttribute('aria-pressed', String(root.classList.toggle('neutral')));
  });

  sky();
  if (reduce) root.classList.add('settled');
  else requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('settled')));
  $$('[data-live]').forEach(el => { el.hidden = false; });
  run();
  try { grid(); } catch (err) { if (month) month.hidden = true; }
  setInterval(() => { sky(); try { tick(); week(); } catch (err) { fail(); } }, 3e4);
})();