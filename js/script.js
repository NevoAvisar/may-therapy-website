/* =========================================================
   May – Forest & Rivers
   The right-side tree grows with the scroll (GSAP + ScrollTrigger):
   trunk draws downwards → a branch sprouts and a blossom opens for
   every section → at the finale the tree settles into roots & moss.
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Contact settings – edit here ---------- */
  const CONTACT = {
    // International format, digits only, no "+" or leading 0 (e.g. 972501234567)
    whatsappNumber: '972XXXXXXXXX',
    whatsappMessage: 'היי מאי 🌿 הגעתי דרך האתר ואשמח לתאם מפגש.',
    email: 'may@example.com',
    emailSubject: 'פנייה מהאתר – שאלה / תיאום מפגש',
    emailBody: 'היי מאי,\n\nאשמח לשמוע פרטים נוספים ולתאם מפגש.\n\nשם:\nטלפון:\n\nתודה!'
  };

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const rail = document.querySelector('.tree-rail');
  const trunk = document.querySelector('.trunk');
  const trunkLight = document.querySelector('.trunk-light');
  const tip = document.querySelector('.growth-tip');
  const stages = Array.prototype.slice.call(document.querySelectorAll('.tree .stage'));

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  /* =========================================================
     1. Contact links
     ========================================================= */
  const waHref = 'https://wa.me/' + CONTACT.whatsappNumber.replace(/[\s+()-]/g, '') +
    '?text=' + encodeURIComponent(CONTACT.whatsappMessage);
  const mailHref = 'mailto:' + CONTACT.email +
    '?subject=' + encodeURIComponent(CONTACT.emailSubject) +
    '&body=' + encodeURIComponent(CONTACT.emailBody);

  document.querySelectorAll('.js-whatsapp').forEach(function (a) { a.href = waHref; });
  document.querySelectorAll('.js-email-label').forEach(function (s) { s.textContent = CONTACT.email; });

  const feedback = document.getElementById('copyFeedback');
  let feedbackTimer;
  function showFeedback(text) {
    if (!feedback) return;
    feedback.textContent = text;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(function () { feedback.textContent = ''; }, 6000);
  }
  document.querySelectorAll('.js-email').forEach(function (a) {
    a.href = mailHref;
    // If no mail client opens, the page keeps focus – copy the address so nobody is stuck.
    a.addEventListener('click', function () {
      let left = false;
      const onBlur = function () { left = true; };
      window.addEventListener('blur', onBlur, { once: true });
      setTimeout(function () {
        window.removeEventListener('blur', onBlur);
        if (left || document.hidden) return;
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(CONTACT.email).then(
            function () { showFeedback('כתובת המייל הועתקה: ' + CONTACT.email); },
            function () { showFeedback('אפשר לכתוב לי לכתובת: ' + CONTACT.email); }
          );
        } else {
          showFeedback('אפשר לכתוב לי לכתובת: ' + CONTACT.email);
        }
      }, 900);
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* =========================================================
     2. FAQ accordion
     ========================================================= */
  const faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  const onLayoutChange = debounce(function () { if (hasGsap) ScrollTrigger.refresh(); }, 80);

  function setFaq(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq-trigger').setAttribute('aria-expanded', String(open));
  }
  faqItems.forEach(function (item) {
    item.querySelector('.faq-trigger').addEventListener('click', function () {
      const open = !item.classList.contains('is-open');
      faqItems.forEach(function (other) { if (other !== item) setFaq(other, false); });
      setFaq(item, open);
    });
    item.querySelector('.faq-panel').addEventListener('transitionend', function (e) {
      if (e.propertyName === 'grid-template-rows') onLayoutChange();
    });
  });

  /* =========================================================
     3. Nav state, floating WhatsApp
     ========================================================= */
  const fab = document.querySelector('.fab');
  const hero = document.getElementById('hero');
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  const navTargets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function onScroll() {
    const y = window.scrollY;
    root.classList.toggle('is-scrolled', y > 24);
    if (fab && hero) fab.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);

    const probe = window.innerHeight * 0.4;
    let active = -1;
    navTargets.forEach(function (el, i) {
      if (el && el.getBoundingClientRect().top <= probe) active = i;
    });
    navLinks.forEach(function (a, i) {
      if (i === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });
  onScroll();

  /* Card light follows the pointer (fine pointers only) */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.card, .contact-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* =========================================================
     4. Fallback: no GSAP or reduced motion → the tree is shown fully grown
     ========================================================= */
  if (!hasGsap || reduceMotion.matches || !trunk) {
    root.classList.add('no-gsap', 'is-rooted');
    if (rail) rail.classList.add('is-ready');
    document.querySelectorAll('.card').forEach(function (c) { c.classList.add('is-bloomed'); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* =========================================================
     5. Tree geometry
     ========================================================= */
  const trunkLen = trunk.getTotalLength();

  // Length along the trunk at which it first reaches a given y (viewBox units)
  function lenAtY(y) {
    let lo = 0, hi = trunkLen;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (trunk.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
    }
    return lo;
  }

  /* The gap is a little longer than the path and the hidden offset sits inside
     it, so round line-caps don't leave a stray dot before a stroke starts. */
  function prepStroke(el) {
    const len = el.getTotalLength();
    el.style.strokeDasharray = len + ' ' + (len + 12);
    el.__len = len;
    el.__hide = len + 6;
    return len;
  }
  prepStroke(trunk);
  prepStroke(trunkLight);

  const stageData = stages.map(function (g) {
    const branches = Array.prototype.slice.call(g.querySelectorAll('.branch'));
    branches.forEach(prepStroke);
    const branchStart = g.querySelector('.branch').getPointAtLength(0).y;
    return {
      el: g,
      branches: branches,
      leaves: g.querySelectorAll('.leaf, .leaf-vein'),
      bud: g.querySelector('.bud'),
      petals: g.querySelector('.petals'),
      core: g.querySelector('.core'),
      halo: g.querySelector('.halo'),
      trunkLen: lenAtY(branchStart)
    };
  });

  const roots = Array.prototype.slice.call(document.querySelectorAll('.root'));
  roots.forEach(prepStroke);
  const earth = document.querySelector('.earth');
  const moss = document.querySelectorAll('.moss > *, .pebbles > *');

  /* Trunk is rendered from a single "grown length" so the intro and the
     scroll can both push it without fighting: drawn = max(intro, scroll). */
  const growth = { intro: 0, scroll: 0 };
  function renderTrunk() {
    const drawn = clamp(Math.max(growth.intro, growth.scroll), 0, trunkLen);
    trunk.style.strokeDashoffset = drawn > 0 ? trunkLen - drawn : trunk.__hide;
    trunkLight.style.strokeDashoffset = drawn > 0 ? trunkLight.__len - drawn * (trunkLight.__len / trunkLen) : trunkLight.__hide;
    const p = trunk.getPointAtLength(drawn);
    tip.setAttribute('cx', p.x.toFixed(2));
    tip.setAttribute('cy', p.y.toFixed(2));
    rail.classList.toggle('is-growing', drawn > 2 && drawn < trunkLen - 2);
  }

  /* Hidden starting state for everything that grows */
  function hideAll() {
    stageData.forEach(function (s) {
      s.branches.forEach(function (b) { gsap.set(b, { strokeDashoffset: b.__hide }); });
      gsap.set(s.leaves, { scale: 0, transformOrigin: '0% 50%' });
      gsap.set(s.bud, { scale: 0, opacity: 1, transformOrigin: '50% 100%' });
      gsap.set(s.petals, { scale: 0, rotation: -15, transformOrigin: '50% 50%' });
      gsap.set(s.core, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(s.halo, { scale: 0.4, opacity: 0, transformOrigin: '50% 50%' });
    });
    roots.forEach(function (r) { gsap.set(r, { strokeDashoffset: r.__hide }); });
    gsap.set(earth, { opacity: 0 });
    gsap.set(moss, { scale: 0, transformOrigin: '50% 100%' });
  }

  /* One blossom: branch sprouts → leaves unfurl → bud swells → flower opens.
     Durations are in timeline units (the scroll timeline spans 0 → 1). */
  function addBloom(tl, s, at, unit) {
    const u = unit;
    s.branches.forEach(function (b, i) {
      tl.fromTo(b, { strokeDashoffset: b.__hide }, { strokeDashoffset: 0, duration: u * (i ? 0.5 : 1), ease: 'sine.out', immediateRender: false }, at + (i ? u * 0.5 : 0));
    });
    tl.fromTo(s.leaves, { scale: 0 }, { scale: 1, duration: u * 0.7, stagger: u * 0.12, ease: 'back.out(2)', immediateRender: false }, at + u * 0.35);
    tl.fromTo(s.bud, { scale: 0, opacity: 1 }, { scale: 1, duration: u * 0.45, ease: 'sine.out', immediateRender: false }, at + u * 0.8);
    tl.fromTo(s.halo, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: u * 0.9, ease: 'sine.out', immediateRender: false }, at + u * 1.1);
    tl.fromTo(s.petals, { scale: 0, rotation: -15 }, { scale: 1, rotation: 0, duration: u * 0.9, ease: 'back.out(1.6)', immediateRender: false }, at + u * 1.15);
    tl.fromTo(s.bud, { opacity: 1 }, { opacity: 0, scale: 0.6, duration: u * 0.4, ease: 'sine.in', immediateRender: false }, at + u * 1.3);
    tl.fromTo(s.core, { scale: 0 }, { scale: 1, duration: u * 0.6, ease: 'back.out(2.2)', immediateRender: false }, at + u * 1.5);
  }

  /* =========================================================
     6. Intro – the first sprout & flower open at the top on load
     ========================================================= */
  hideAll();
  renderTrunk();
  rail.classList.add('is-ready');

  const intro = gsap.timeline({ delay: 0.5 });
  intro.to(growth, { intro: stageData[0].trunkLen, duration: 1.6, ease: 'sine.inOut', onUpdate: renderTrunk });
  addBloom(intro, stageData[0], 1.2, 0.9);

  // Hero copy rises in softly
  gsap.from('.hero-inner > *', { y: 24, opacity: 0, duration: 1.3, stagger: 0.14, ease: 'power2.out', delay: 0.15 });
  gsap.from('.scroll-cue', { opacity: 0, duration: 1.2, delay: 1.4 });

  /* =========================================================
     7. Scroll timeline – grows in step with each section
     ========================================================= */
  const sectionEls = [
    document.querySelector('.card-1'),
    document.querySelector('.card-2'),
    document.querySelector('.card-3'),
    document.getElementById('faq')
  ];
  const contactEl = document.getElementById('contact');
  let growTl = null;

  function buildGrowth() {
    let progress = 0;
    if (growTl) {
      progress = growTl.scrollTrigger ? growTl.scrollTrigger.progress : 0;
      if (growTl.scrollTrigger) growTl.scrollTrigger.kill();
      growTl.kill();
      growTl = null;
    }

    const maxScroll = Math.max(1, ScrollTrigger.maxScroll(window));
    const vh = window.innerHeight;
    // Scroll progress (0–1) at which an element's top crosses 62% of the viewport
    function at(el, line) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      return clamp((top - vh * line) / maxScroll, 0, 1);
    }

    const unit = 0.035;
    const points = [];          // [time, trunk length] keyframes
    const blooms = [];
    let last = 0;
    sectionEls.forEach(function (el, i) {
      const t = Math.max(at(el, 0.62), last + unit * 2.2);
      blooms.push({ s: stageData[i + 1], at: t });
      points.push([t, stageData[i + 1].trunkLen]);
      last = t;
    });
    const rootsAt = clamp(Math.max(at(contactEl, 0.7), last + unit * 2.5), 0, 0.93);
    points.push([rootsAt, trunkLen]);

    growTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        start: 0,
        end: 'max',
        scrub: 1.1,
        invalidateOnRefresh: false
      }
    });

    // Trunk: from the top down, reaching each branch exactly as its bloom begins
    let prevT = 0, prevL = 0;
    points.forEach(function (p) {
      growTl.fromTo(growth, { scroll: prevL }, { scroll: p[1], duration: Math.max(0.001, p[0] - prevT), onUpdate: renderTrunk, immediateRender: false }, prevT);
      prevT = p[0];
      prevL = p[1];
    });

    blooms.forEach(function (b) { addBloom(growTl, b.s, b.at, unit); });

    // Finale: earth and moss settle, roots spread deep into the ground
    const rootSpan = Math.max(0.05, 1 - rootsAt);
    growTl.fromTo(earth, { opacity: 0 }, { opacity: 1, duration: rootSpan * 0.4, immediateRender: false }, rootsAt);
    roots.forEach(function (r, i) {
      growTl.fromTo(r, { strokeDashoffset: r.__hide }, {
        strokeDashoffset: 0,
        duration: rootSpan * (r.classList.contains('r-fine') ? 0.5 : 0.75),
        ease: 'sine.out',
        immediateRender: false
      }, rootsAt + rootSpan * (r.classList.contains('r-fine') ? 0.4 : i * 0.04));
    });
    growTl.fromTo(moss, { scale: 0 }, { scale: 1, duration: rootSpan * 0.3, stagger: rootSpan * 0.03, ease: 'back.out(2)', immediateRender: false }, rootsAt + rootSpan * 0.15);

    growTl.set({}, {}, 1);   // keep the timeline exactly 0 → 1 long
    growTl.progress(progress);
  }

  /* Cards: float in, and glow softly when their blossom opens */
  gsap.utils.toArray('.card').forEach(function (card) {
    gsap.fromTo(card, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: 1.3, ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
    ScrollTrigger.create({
      trigger: card,
      start: 'top 62%',
      onEnter: function () { card.classList.add('is-bloomed'); },
      onLeaveBack: function () { card.classList.remove('is-bloomed'); }
    });
  });
  ScrollTrigger.create({
    trigger: contactEl,
    start: 'top 70%',
    onToggle: function (self) { root.classList.toggle('is-rooted', self.isActive || self.progress >= 1); }
  });

  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.fromTo(el, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
    });
  });

  buildGrowth();

  // Re-measure after layout changes (fonts, resize, FAQ panels)
  ScrollTrigger.addEventListener('refresh', debounce(buildGrowth, 30));
  let lastW = window.innerWidth;
  window.addEventListener('resize', debounce(function () {
    if (window.innerWidth === lastW) return;   // ignore mobile URL-bar height changes
    lastW = window.innerWidth;
    ScrollTrigger.refresh();
  }, 200));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
