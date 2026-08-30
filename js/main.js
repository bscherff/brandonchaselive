const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = new Date().getFullYear();

// ─── Shows ────────────────────────────────────────────────────────────────────

function formatEvent(isoStr, allDay) {
  const d = new Date(isoStr);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    month:   d.toLocaleDateString('en-US', { month: 'short' }),
    day:     d.getDate(),
    label:   d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time:    allDay ? null : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function renderCard(event) {
  const { weekday, month, day, label, time } = formatEvent(event.start, event.all_day);

  const article = document.createElement('article');
  article.className = 'show-card';

  // Date callout box — weekday first
  const dateBox = document.createElement('div');
  dateBox.className = 'show-date';
  dateBox.title = label;

  const wdEl = document.createElement('span');
  wdEl.className = 'show-weekday';
  wdEl.textContent = weekday;

  const moEl = document.createElement('span');
  moEl.className = 'show-month';
  moEl.textContent = month;

  const dyEl = document.createElement('span');
  dyEl.className = 'show-day';
  dyEl.textContent = String(day);

  dateBox.append(wdEl, moEl, dyEl);

  // Show details
  const details = document.createElement('div');
  details.className = 'show-details';

  const titleEl = document.createElement('h3');
  titleEl.className = 'show-title';

  if (/\bJTB\b/i.test(event.summary)) {
    const a = document.createElement('a');
    a.href = 'https://jimtwitty.com';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = event.summary.replace(/\bJTB\b/gi, 'Jim Twitty Band');
    titleEl.appendChild(a);
  } else {
    titleEl.textContent = event.summary;
  }
  details.appendChild(titleEl);

  if (event.location) {
    const locEl = document.createElement('p');
    locEl.className = 'show-location';
    locEl.textContent = event.location;
    details.appendChild(locEl);
  }

  if (time) {
    const timeEl = document.createElement('p');
    timeEl.className = 'show-time';
    timeEl.textContent = time;
    details.appendChild(timeEl);
  }

  article.append(dateBox, details);

  // Optional details link — http/https URLs only
  if (event.url && /^https?:\/\//.test(event.url)) {
    const linkEl = document.createElement('a');
    linkEl.href = event.url;
    linkEl.className = 'show-link';
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    linkEl.textContent = 'Details';
    article.appendChild(linkEl);
  }

  return article;
}

function setListMessage(list, className, text) {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  list.replaceChildren(p);
}

async function loadShows() {
  const list = document.getElementById('shows-list');
  if (!list) return;
  try {
    const res = await fetch('data/events.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const events = await res.json();
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(e => new Date(e.start) >= today);

    if (upcoming.length === 0) {
      setListMessage(list, 'shows-empty', 'No upcoming shows right now — check back soon!');
      return;
    }

    const frag = document.createDocumentFragment();
    upcoming.forEach(e => frag.appendChild(renderCard(e)));
    list.replaceChildren(frag);
  } catch {
    setListMessage(list, 'shows-error', 'Could not load shows. Please try again later.');
  }
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

const FORM_ENDPOINT = 'https://formspree.io/f/xbdwrqrj';
const form          = document.getElementById('contact-form');
const successMsg    = document.getElementById('form-success');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.disabled    = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method:  'POST',
        body:    new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.hidden       = true;
        successMsg.hidden = false;
      } else {
        throw new Error('submission failed');
      }
    } catch {
      btn.disabled    = false;
      btn.textContent = 'Send Message';
      let errMsg = form.querySelector('.form-submit-error');
      if (!errMsg) {
        errMsg = document.createElement('p');
        errMsg.className = 'form-submit-error';
        btn.insertAdjacentElement('afterend', errMsg);
      }
      errMsg.textContent = 'Something went wrong — please email brandon@brandonchaselive.com directly.';
    }
  });
}

// ─── Slideshow ────────────────────────────────────────────────────────────────

function initSlideshow() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots   = Array.from(document.querySelectorAll('.dot'));

  // CSP blocks inline onerror attributes; handle broken images here instead
  slides.forEach(slide => {
    const img = slide.querySelector('img');
    if (img) img.addEventListener('error', () => slide.classList.add('placeholder'));
  });
  if (!slides.length) return;

  let current = 0;
  let timer   = null;

  function goTo(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = ((n % slides.length) + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startTimer() {
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  document.querySelector('.slide-prev').addEventListener('click', () => { goTo(current - 1); resetTimer(); });
  document.querySelector('.slide-next').addEventListener('click', () => { goTo(current + 1); resetTimer(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetTimer(); }));

  const show = document.querySelector('.slideshow');
  show.addEventListener('mouseenter', () => clearInterval(timer));
  show.addEventListener('mouseleave', startTimer);

  startTimer();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

loadShows();
initSlideshow();
