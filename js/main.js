document.getElementById('footer-year').textContent = new Date().getFullYear();

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
  const { month, day, label, time } = formatEvent(event.start, event.all_day);

  return `
    <article class="show-card">
      <div class="show-date" title="${safeText(label)}">
        <span class="show-month">${month}</span>
        <span class="show-day">${day}</span>
      </div>
      <div class="show-details">
        <h3 class="show-title">${safeText(event.summary)}</h3>
        ${event.location ? `<p class="show-location">${safeText(event.location)}</p>` : ''}
        ${time ? `<p class="show-time">${time}</p>` : ''}
      </div>
      ${event.url && event.url.match(/^https?:\/\//) ? `<a href="${safeText(event.url)}" class="show-link" target="_blank" rel="noopener noreferrer">Details</a>` : ''}
    </article>
  `;
}

async function loadShows() {
  const list = document.getElementById('shows-list');
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
    alert('Something went wrong — please email brandon@brandonchaselive.com directly.');
  }
});

// ─── Slideshow ────────────────────────────────────────────────────────────────

function initSlideshow() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots   = Array.from(document.querySelectorAll('.dot'));
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
