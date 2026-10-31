/* =========================================================
   May – Canopy → Trunk → Roots
   GSAP + ScrollTrigger photographic camera · glass UI
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Contact settings – edit here ---------- */
  const CONTACT = {
    // International format, digits only, no "+" or leading 0 (e.g. 972501234567)
    whatsappNumber: '972XXXXXXXXX',
    whatsappMessage: 'היי מאי 🌿 הגעתי דרך האתר ואשמח לשמוע עוד על הטיפולים ולתאם שיחת היכרות.',
    email: 'may@example.com',
    emailSubject: 'פנייה מהאתר – שאלה / תיאום טיפול',
    emailBody: 'היי מאי,\n\nאשמח לשמוע פרטים נוספים על הטיפולים ולתאם שיחת היכרות.\n\nשם:\nטלפון:\n\nתודה!'
  };

  /* ---------- Camera framing – tune to your photo ----------
     zoom – 1 = photo just covers the screen; higher = closer
     x, y – point of the photo (0–1 across / down) to centre on
     Top of the photo = canopy, middle = trunk, bottom = roots. */
  const CAMERA = {
    desktop: {
      canopy: { zoom: 1.3,  x: 0.5, y: 0.3  },
      trunk:  { zoom: 1.75, x: 0.5, y: 0.58 },
      roots:  { zoom: 1.4,  x: 0.5, y: 0.9  }
    },
    mobile: {
      canopy: { zoom: 1.1,  x: 0.5, y: 0.28 },
      trunk:  { zoom: 1.45, x: 0.5, y: 0.56 },
      roots:  { zoom: 1.2,  x: 0.5, y: 0.92 }
    }
  };

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const frame = document.querySelector('.frame');
  const photo = document.querySelector('.tree-photo');

  /* =========================================================
     1. Camera maths
     ========================================================= */
  const view = { W: 0, H: 0, w: 0, h: 0, max: 1 };
  let shots = CAMERA.desktop;

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function measure() {
    if (!frame || !photo) return;
    view.W = frame.clientWidth;
    view.H = frame.clientHeight;
    const nw = photo.naturalWidth || 1600;
    const nh = photo.naturalHeight || 1400;
    const cover = Math.max(view.W / nw, view.H / nh);
    view.w = nw * cover;   // size when the photo just covers the screen
    view.h = nh * cover;
    // Lay the image out at the closest zoom we'll ever use, then only scale
    // it down. Scaling down keeps every pixel crisp; scaling up would blur.
    view.max = Math.max.apply(null, Object.keys(shots).map(function (k) { return shots[k].zoom; })) * 1.05;
    photo.style.width = (view.w * view.max) + 'px';
    photo.style.height = (view.h * view.max) + 'px';
  }

  // Returns a function so GSAP re-reads it on every refresh/resize
  function shot(name, prop, nudge) {
    return function () {
      const s = shots[name];
      const zoom = s.zoom * ((nudge && nudge.zoom) || 1);
      const dw = view.w * zoom;
      const dh = view.h * zoom;
      if (prop === 'scale') return zoom / view.max;
      if (prop === 'x') return clamp(view.W / 2 - s.x * dw, view.W - dw, 0);
      const y = view.H / 2 - s.y * dh - view.H * ((nudge && nudge.dy) || 0);
      return clamp(y, view.H - dh, 0);
    };
  }

  function camera(name, nudge) {
    return { scale: shot(name, 'scale', nudge), x: shot(name, 'x', nudge), y: shot(name, 'y', nudge) };
  }

  // Show a small hint while developing locally if the photo isn't there yet
  function onPhotoMissing() {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
    const notice = document.querySelector('.photo-notice');
    if (local && notice) notice.hidden = false;
  }
  if (photo) {
    if (photo.complete && !photo.naturalWidth) onPhotoMissing();
    photo.addEventListener('error', onPhotoMissing);
  }

  /* =========================================================
     2. The scroll journey
     The stage is position: sticky; the empty .journey-track
     below it supplies the scroll distance the camera plays over,
     then the roots content (FAQ + contact) scrolls up over it.
     ========================================================= */
  let journeyTrigger = null;

  function useStatic(on) { root.classList.toggle('is-static', on); }

  if (!hasGsap || !photo) {
    useStatic(true);
  } else {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.addEventListener('refreshInit', measure);

    measure();
    gsap.config({ force3D: true });
    photo.addEventListener('load', function () { ScrollTrigger.refresh(); });

    const mm = gsap.matchMedia();

    mm.add({
      isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
      isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)'
    }, function (ctx) {
      const c = ctx.conditions;

      if (c.reduce) {
        useStatic(true);
        return function () { useStatic(false); };
      }

      shots = c.isDesktop ? CAMERA.desktop : CAMERA.mobile;
      measure();

      // Load-in (not scroll-linked)
      gsap.from('.pill-nav', { y: -24, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.1 });
      gsap.from('.hero-inner > *', { y: 28, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'power3.out', delay: 0.25 });
      gsap.from('.scroll-cue', { opacity: 0, duration: 1, delay: 1.1 });

      const items = gsap.utils.toArray('.bento-item');

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.journey-track',
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
      journeyTrigger = tl.scrollTrigger;

      /* Ambient light ray: drifts across the whole descent, gold → sage */
      tl.fromTo('.light-ray', { xPercent: 0, yPercent: 0, rotate: 0 }, { xPercent: -16, yPercent: 26, rotate: 7, duration: 100 }, 0)
        .fromTo('.ray-gold', { opacity: 1 }, { opacity: 0.2, duration: 100 }, 0)
        .fromTo('.ray-sage', { opacity: 0.1 }, { opacity: 1, duration: 100 }, 0);

      /* Phase 1 — Canopy (0 → 28): slow breathing drift through the mist */
      tl.fromTo(photo, camera('canopy'), Object.assign(camera('canopy', { zoom: 1.04, dy: 0.03 }), { duration: 28 }), 0)
        .to('.scroll-cue', { opacity: 0, y: 16, duration: 8 }, 4)
        .to('.mist', { y: -40, duration: 28 }, 0)
        .fromTo('.light-sun', { opacity: 1 }, { opacity: 0.85, duration: 28 }, 0);

      /* Phase 2 — Trunk & bento (28 → 68): periphery falls out of focus */
      tl.to('.panel-hero', { autoAlpha: 0, y: -60, duration: 10, ease: 'power1.in' }, 28)
        .fromTo(['.hero-title', '.hero-tagline'], { filter: 'blur(0px)' }, { filter: 'blur(8px)', duration: 10, ease: 'power1.in' }, 28)
        .to('.mist', { opacity: 0, duration: 12 }, 28)
        .to('.shade-hero', { opacity: 0, duration: 12 }, 28)
        .to('.light-sun', { opacity: 0.35, duration: 22 }, 28)
        .to(photo, Object.assign(camera('trunk'), { duration: 22, ease: 'power2.inOut' }), 28)
        .to('.shade-trunk', { opacity: 1, duration: 12 }, 34)
        .fromTo('.dof', { opacity: 0 }, { opacity: 1, duration: 12, ease: 'power1.out' }, 36)
        .set('.panel-trunk', { autoAlpha: 1 }, 40)
        .fromTo('.panel-trunk .panel-header > *',
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 6, stagger: 1.5, ease: 'power2.out' }, 40)
        .fromTo(items,
          { opacity: 0, y: 70, rotateX: 10, scale: 0.96, transformOrigin: '50% 100%', transformPerspective: 900 },
          { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 9, stagger: 2.5, ease: 'power2.out' }, 43)
        .to(photo, { y: shot('trunk', 'y', { dy: 0.04 }), duration: 12 }, 55);

      /* Phase 3 — Descent to the roots (68 → 100) */
      tl.to(items, { opacity: 0, y: -60, duration: 7, stagger: 1, ease: 'power1.in' }, 68)
        .to('.panel-trunk .panel-header', { opacity: 0, y: -40, duration: 6, ease: 'power1.in' }, 68)
        .set('.panel-trunk', { autoAlpha: 0 }, 77)
        .to('.dof', { opacity: 0, duration: 12 }, 70)
        .to('.shade-trunk', { opacity: 0, duration: 10 }, 71)
        .to(photo, Object.assign(camera('roots'), { duration: 26, ease: 'power2.inOut' }), 70)
        .to('.light-sun', { opacity: 0, duration: 14 }, 70)
        .to('.shade-roots', { opacity: 1, duration: 18 }, 78);

      /* Roots content rises into view */
      gsap.utils.toArray('.reveal').forEach(function (el) {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        });
      });

      return function () { journeyTrigger = null; };
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  /* =========================================================
     3. Pill nav – sliding active indicator + journey-aware links
     ========================================================= */
  const navLinks = document.querySelector('.nav-links');
  const indicator = document.querySelector('.nav-indicator');
  const navOffset = function () { return (document.getElementById('pillNav') || { offsetHeight: 0 }).offsetHeight + 28; };
  let activeKey;

  function moveIndicator(link) {
    if (!indicator) return;
    if (!link) { indicator.style.opacity = '0'; return; }
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    indicator.style.opacity = '1';
  }

  function setActiveNav(key) {
    if (!navLinks || key === activeKey) return;
    activeKey = key;
    let current = null;
    navLinks.querySelectorAll('a').forEach(function (a) {
      const on = a.dataset.nav === key;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'true'); current = a; } else { a.removeAttribute('aria-current'); }
    });
    moveIndicator(current);
  }

  function topOf(id) {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top : Infinity;
  }

  function updateActiveNav() {
    const mid = window.innerHeight * 0.5;
    let key = null;
    if (topOf('contact') < mid) key = 'about';
    else if (topOf('faq') < mid) key = 'faq';
    else if (journeyTrigger) key = journeyTrigger.progress > 0.3 ? 'treatments' : null;
    else if (topOf('treatments') < mid) key = 'treatments';
    setActiveNav(key);
  }

  window.addEventListener('resize', function () {
    moveIndicator(navLinks && navLinks.querySelector('a.is-active'));
  });

  // Points along the camera journey (0–1) for links that live inside the sticky stage
  const STOPS = { '#journey': 0, '#treatments': 0.56 };

  function scrollTarget(hash) {
    if (journeyTrigger && hash in STOPS) {
      const st = journeyTrigger;
      return st.start + (st.end - st.start) * STOPS[hash];
    }
    const el = document.querySelector(hash);
    return el ? el.getBoundingClientRect().top + window.scrollY - navOffset() : null;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const hash = link.getAttribute('href');
      if (hash.length < 2) return;
      const top = scrollTarget(hash);
      if (top === null) return;
      e.preventDefault();
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });

  /* =========================================================
     4. Card tilt + cursor spotlight (mouse / trackpad only)
     ========================================================= */
  function bindSpotlight(el, tilt) {
    el.addEventListener('pointermove', function (e) {
      if (!finePointer.matches) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      if (tilt && !reduceMotion.matches) {
        el.classList.add('is-tilting');
        el.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
      }
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  document.querySelectorAll('.bento-card').forEach(function (card) { bindSpotlight(card, true); });
  document.querySelectorAll('.contact-card').forEach(function (card) { bindSpotlight(card, false); });

  /* =========================================================
     5. FAQ accordion – one open at a time, height animated in CSS
     ========================================================= */
  const faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  let faqRefreshTimer;

  function setFaq(item, open) {
    const btn = item.querySelector('.faq-trigger');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  faqItems.forEach(function (item) {
    const btn = item.querySelector('.faq-trigger');
    btn.addEventListener('click', function () {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      faqItems.forEach(function (other) { if (other !== item) setFaq(other, false); });
      setFaq(item, open);
    });

    // Content below moved – let ScrollTrigger re-measure once the height settles
    item.querySelector('.faq-panel').addEventListener('transitionend', function (e) {
      if (e.propertyName !== 'grid-template-rows' || !hasGsap) return;
      clearTimeout(faqRefreshTimer);
      faqRefreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 60);
    });
  });

  /* =========================================================
     6. Root scroll-progress – grows and branches as you descend
     ========================================================= */
  const rpMain = document.querySelector('.rp-main');
  const rpTip = document.querySelector('.rp-tip');
  const rpBranches = Array.prototype.slice.call(document.querySelectorAll('.rp-branch')).map(function (path) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    return { path: path, len: len, at: parseFloat(path.dataset.at) || 0 };
  });
  const rpLen = rpMain ? rpMain.getTotalLength() : 0;
  if (rpMain) {
    rpMain.style.strokeDasharray = rpLen;
    rpMain.style.strokeDashoffset = rpLen;
  }

  function updateRootProgress() {
    if (!rpMain) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

    rpMain.style.strokeDashoffset = rpLen * (1 - p);
    rpMain.style.setProperty('--rp-w', (1.3 + p * 1.2).toFixed(2));
    rpBranches.forEach(function (b) {
      const d = clamp((p - b.at) / 0.1, 0, 1);
      b.path.style.strokeDashoffset = b.len * (1 - d);
    });
    if (rpTip) {
      const pt = rpMain.getPointAtLength(rpLen * p);
      rpTip.setAttribute('cx', pt.x.toFixed(2));
      rpTip.setAttribute('cy', pt.y.toFixed(2));
    }
  }

  /* =========================================================
     7. Contact links
     ========================================================= */
  const whatsappUrl =
    'https://wa.me/' + CONTACT.whatsappNumber.replace(/[\s+()-]/g, '') +
    '?text=' + encodeURIComponent(CONTACT.whatsappMessage);

  const mailtoUrl =
    'mailto:' + CONTACT.email +
    '?subject=' + encodeURIComponent(CONTACT.emailSubject) +
    '&body=' + encodeURIComponent(CONTACT.emailBody);

  document.querySelectorAll('.js-whatsapp').forEach(function (link) {
    link.href = whatsappUrl;
  });

  const feedback = document.getElementById('copyFeedback');
  let feedbackTimer;

  function showFeedback(text) {
    if (!feedback) return;
    feedback.textContent = text;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(function () { feedback.textContent = ''; }, 6000);
  }

  document.querySelectorAll('.js-email').forEach(function (link) {
    link.href = mailtoUrl;

    // If no mail client opens, the page stays focused – copy the address so the visitor isn't stuck.
    link.addEventListener('click', function () {
      let leftPage = false;
      const onBlur = function () { leftPage = true; };
      window.addEventListener('blur', onBlur, { once: true });

      setTimeout(function () {
        window.removeEventListener('blur', onBlur);
        if (leftPage || document.hidden) return;

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(CONTACT.email).then(
            function () { showFeedback('כתובת המייל הועתקה: ' + CONTACT.email); },
            function () { showFeedback('אפשר לכתוב לי לכתובת: ' + CONTACT.email); }
          );
        } else {
          showFeedback('אפשר לכתוב לי לכתובת: ' + CONTACT.email);
        }
      }, 1200);
    });
  });

  /* =========================================================
     8. Nav background, floating button, footer year
     ========================================================= */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const pillNav = document.getElementById('pillNav');
  const fab = document.querySelector('.fab');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (pillNav) pillNav.classList.toggle('is-scrolled', y > 24);
    if (fab) fab.classList.toggle('is-visible', y > window.innerHeight * 0.5);
    updateActiveNav();
    updateRootProgress();
    ticking = false;
  }
  function requestTick() {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();
})();
