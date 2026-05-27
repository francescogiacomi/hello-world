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
     Subtle parallax on project shapes + hero title
     --------------------------------------------------------- */
  if (!prefersReduced) {
    const shapes = document.querySelectorAll('.project__shape');
    const heroTitle = document.querySelector('.hero__title');

    let ticking = false;
    const onScrollParallax = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;

        if (heroTitle) {
          const t = Math.min(sy * 0.08, 80);
          heroTitle.style.transform = `translate3d(0, ${t}px, 0)`;
          heroTitle.style.opacity = String(Math.max(1 - sy / 700, 0.15));
        }

        shapes.forEach((shape) => {
          const rect = shape.getBoundingClientRect();
          const vh = window.innerHeight;
          const center = rect.top + rect.height / 2;
          const offset = (center - vh / 2) / vh;
          const tx = offset * -14;
          const ty = offset * -28;
          shape.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScrollParallax, { passive: true });
    onScrollParallax();
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
        timeEl.textContent = `Milano · ${fmt.format(new Date())} CET`;
      } catch {
        timeEl.textContent = 'Milano';
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
