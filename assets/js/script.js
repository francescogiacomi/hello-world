(() => {
  'use strict';

  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Custom cursor — interpolated dot + ring with hover scale
     --------------------------------------------------------- */
  const cursor = document.getElementById('cursor');

  if (cursor && isFinePointer) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cx = mouseX;
    let cy = mouseY;
    let visible = false;

    const ease = 0.22;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        cursor.classList.remove('is-hidden');
        cx = mouseX; cy = mouseY;
      }
    };

    const onLeave = () => {
      visible = false;
      cursor.classList.add('is-hidden');
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));

    const render = () => {
      cx += (mouseX - cx) * ease;
      cy += (mouseY - cy) * ease;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    // Hover state via delegation on [data-cursor="hover"] + native interactive els
    const isHoverable = (el) => {
      if (!el || el === document) return false;
      if (el.matches?.('[data-cursor="hover"], a, button, input, textarea, select, label[for], [role="button"]')) return true;
      return false;
    };

    document.addEventListener('mouseover', (e) => {
      if (isHoverable(e.target.closest('[data-cursor="hover"], a, button, [role="button"]'))) {
        cursor.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      const related = e.relatedTarget;
      if (!related || !related.closest?.('[data-cursor="hover"], a, button, [role="button"]')) {
        cursor.classList.remove('is-hover');
      }
    });

    // Click pulse
    document.addEventListener('mousedown', () => cursor.classList.add('is-press'));
    document.addEventListener('mouseup',   () => cursor.classList.remove('is-press'));
  } else if (cursor) {
    cursor.remove();
  }

  /* ---------------------------------------------------------
     Sticky header shadow on scroll
     --------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     Reveal-on-scroll
     --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if (revealTargets.length && 'IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------
     Scroll-linked fades: hero exit + works cards behind sticky title
     --------------------------------------------------------- */
  if (!prefersReduced) {
    const heroTitle = document.querySelector('.hero__title');
    const clientsEl = document.querySelector('.clients');
    const worksHead = document.querySelector('.works__head');
    const workCards = document.querySelectorAll('.section--works .work');

    /* Progressive mask: the portion of each card that has passed
       under the sticky title becomes transparent (top-down "wipe"),
       while the part still below stays fully visible.
       Hard edge — no transition band. */

    let ticking = false;
    const onScrollFade = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        const vh = window.innerHeight;

        // Hero: 1 at top, 0 by ~85% of a viewport scrolled
        const heroOpacity = Math.max(0, Math.min(1, 1 - sy / (vh * 0.85)));
        if (heroTitle) heroTitle.style.opacity = heroOpacity;
        if (clientsEl) clientsEl.style.opacity = heroOpacity;

        // Works cards: top-down mask anchored at the sticky title bottom
        if (worksHead && workCards.length) {
          const titleBottom = worksHead.getBoundingClientRect().bottom;
          workCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const cardHeight = rect.height;
            if (!cardHeight) return;

            // Round to whole pixels — avoids sub-pixel jitter at the cut edge
            const cut = Math.round(titleBottom - rect.top);

            if (cut <= 0) {
              // Title is above card top → no mask
              card.style.maskImage = '';
              card.style.webkitMaskImage = '';
              card.style.pointerEvents = '';
            } else if (cut >= cardHeight) {
              // Card is entirely under the title zone → fully masked
              card.style.maskImage = 'linear-gradient(transparent, transparent)';
              card.style.webkitMaskImage = 'linear-gradient(transparent, transparent)';
              card.style.pointerEvents = 'none';
            } else {
              const cutPct = (cut / cardHeight) * 100;
              const mask = `linear-gradient(to bottom, transparent 0%, transparent ${cutPct}%, #000 ${cutPct}%, #000 100%)`;
              card.style.maskImage = mask;
              card.style.webkitMaskImage = mask;
              // If more than 90% of the card is masked, kill hover
              card.style.pointerEvents = (cut / cardHeight) > 0.9 ? 'none' : '';
            }
          });
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScrollFade, { passive: true });
    window.addEventListener('resize', onScrollFade, { passive: true });
    onScrollFade();
  }

  /* ---------------------------------------------------------
     Clients: lazy-swap text → SVG if file exists
     Folder convention: assets/img/clients/<slug>.svg
     Probes once per unique slug, applies to all matching <li>
     (ticker duplicates the list for the seamless loop).
     --------------------------------------------------------- */
  {
    const probed = new Set();
    document.querySelectorAll('.clients li[data-client]').forEach((li) => {
      const slug = li.dataset.client;
      if (!slug || probed.has(slug)) return;
      probed.add(slug);

      const src = `assets/img/clients/${slug}.svg`;
      const probe = new Image();
      probe.onload = () => {
        document.querySelectorAll(`.clients li[data-client="${slug}"]`).forEach((target) => {
          const alt = target.textContent.trim();
          target.innerHTML = `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
        });
      };
      probe.src = src;
    });
  }

  /* ---------------------------------------------------------
     Footer: local time chip
     --------------------------------------------------------- */
  const timeEl = document.getElementById('footerTime');
  if (timeEl) {
    const tick = () => {
      try {
        const fmt = new Intl.DateTimeFormat('it-IT', {
          hour: '2-digit', minute: '2-digit',
          timeZone: 'Europe/Rome'
        });
        timeEl.textContent = `Italy · ${fmt.format(new Date())}`;
      } catch {
        timeEl.textContent = 'Italy';
      }
    };
    tick();
    setInterval(tick, 30_000);
  }

  /* ---------------------------------------------------------
     Anchor smooth-scroll with header offset
     --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();
