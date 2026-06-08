/* ================================================================
   Photography Portfolio — Main Script
   ================================================================ */

(function () {
  'use strict';

  /* ---- Header: transparent → solid on scroll ---- */
  const header = document.querySelector('.header');
  if (header) {
    const isHome = header.classList.contains('header--overlay');
    const onScroll = () => {
      if (!isHome) return;
      if (window.scrollY > 80) {
        header.classList.remove('header--overlay');
        header.classList.add('header--solid');
      } else {
        header.classList.remove('header--solid');
        header.classList.add('header--overlay');
      }
    };
    if (isHome) window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile menu toggle ---- */
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('is-open');
      nav.classList.toggle('is-open');
      document.body.style.overflow = nav.classList.contains('is-open') ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('is-open');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Active nav link ---- */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---- Fade-in on scroll (IntersectionObserver) ---- */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => obs.observe(el));
  }

  /* ---- Lightbox ---- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('.lightbox__img');
    const lbCaption = lightbox.querySelector('.lightbox__caption');
    const lbCounter = lightbox.querySelector('.lightbox__counter');
    const lbClose = lightbox.querySelector('.lightbox__close');
    const lbPrev = lightbox.querySelector('.lightbox__arrow--prev');
    const lbNext = lightbox.querySelector('.lightbox__arrow--next');

    let photos = [];
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    function openLightbox(index) {
      currentIndex = index;
      updateLightbox();
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function updateLightbox() {
      const photo = photos[currentIndex];
      if (!photo) return;
      lbImg.src = photo.src;
      lbImg.alt = photo.alt || '';
      if (lbCaption) lbCaption.textContent = photo.caption || '';
      if (lbCounter) lbCounter.textContent = (currentIndex + 1) + ' / ' + photos.length;
    }

    function nextPhoto() {
      currentIndex = (currentIndex + 1) % photos.length;
      updateLightbox();
    }

    function prevPhoto() {
      currentIndex = (currentIndex - 1 + photos.length) % photos.length;
      updateLightbox();
    }

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', prevPhoto);
    if (lbNext) lbNext.addEventListener('click', nextPhoto);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    });

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextPhoto();
        else prevPhoto();
      }
    }, { passive: true });

    window._lightbox = { open: openLightbox, setPhotos: (p) => { photos = p; } };
  }

  /* ---- Collections grid: load data and render ---- */
  const gridEl = document.getElementById('collections-grid');
  if (gridEl) {
    fetch('data/collections.json')
      .then(r => r.json())
      .then(data => {
        data.collections.forEach(col => {
          const card = document.createElement('div');
          card.className = 'collection-card fade-in';
          card.innerHTML =
            '<a class="collection-card__link" href="collection.html?id=' + col.id + '">' +
              '<img class="collection-card__img" src="' + col.cover + '" alt="' + col.title + '" loading="lazy">' +
              '<div class="collection-card__info">' +
                '<h3 class="collection-card__title">' + col.title + '</h3>' +
                '<span class="collection-card__meta">' + col.subtitle + ' &mdash; ' + col.year + '</span>' +
              '</div>' +
            '</a>';
          gridEl.appendChild(card);

          requestAnimationFrame(() => {
            requestAnimationFrame(() => { card.classList.add('is-visible'); });
          });
        });
      })
      .catch(() => {
        gridEl.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center">Impossibile caricare le collezioni.</p>';
      });
  }

  /* ---- Single collection: load data and render story ---- */
  const storyEl = document.getElementById('story');
  const storyHeaderEl = document.getElementById('story-header');
  const storyNavEl = document.getElementById('story-nav');
  if (storyEl && storyHeaderEl) {
    const params = new URLSearchParams(location.search);
    const colId = params.get('id');

    fetch('data/collections.json')
      .then(r => r.json())
      .then(data => {
        const cols = data.collections;
        const idx = cols.findIndex(c => c.id === colId);
        if (idx === -1) {
          storyHeaderEl.innerHTML = '<h1>Collezione non trovata</h1><p>Torna alle <a href="collections.html" style="border-bottom:1px solid currentColor">collections</a>.</p>';
          return;
        }

        const col = cols[idx];
        const allPhotos = [];

        document.title = col.title + ' — Francesco Giacomi Photography';

        storyHeaderEl.innerHTML =
          '<span class="text-label">' + col.subtitle + ' &mdash; ' + col.year + '</span>' +
          '<h1>' + col.title + '</h1>' +
          '<p>' + col.description + '</p>';

        col.blocks.forEach(block => {
          const div = document.createElement('div');
          div.className = 'story-block fade-in';

          if (block.type === 'full') {
            div.classList.add('story-block--full');
            const photoIdx = allPhotos.length;
            allPhotos.push({ src: block.src, alt: block.alt || '', caption: block.caption || '' });
            div.innerHTML = '<img src="' + block.src + '" alt="' + (block.alt || '') + '" loading="lazy" data-lightbox="' + photoIdx + '">';
            if (block.caption) {
              const cap = document.createElement('p');
              cap.className = 'story-caption';
              cap.textContent = block.caption;
              div.appendChild(cap);
            }
          } else if (block.type === 'bleed') {
            div.classList.add('story-block--bleed');
            const photoIdx = allPhotos.length;
            allPhotos.push({ src: block.src, alt: block.alt || '', caption: block.caption || '' });
            div.innerHTML = '<img src="' + block.src + '" alt="' + (block.alt || '') + '" loading="lazy" data-lightbox="' + photoIdx + '">';
            if (block.caption) {
              const cap = document.createElement('p');
              cap.className = 'story-caption';
              cap.textContent = block.caption;
              div.appendChild(cap);
            }
          } else if (block.type === 'pair') {
            div.classList.add('story-block--pair');
            block.photos.forEach(photo => {
              const photoIdx = allPhotos.length;
              allPhotos.push({ src: photo.src, alt: photo.alt || '', caption: photo.caption || '' });
              const img = document.createElement('img');
              img.src = photo.src;
              img.alt = photo.alt || '';
              img.loading = 'lazy';
              img.dataset.lightbox = photoIdx;
              div.appendChild(img);
            });
          } else if (block.type === 'text') {
            div.classList.add('story-block--text');
            div.innerHTML = '<p>' + block.content + '</p>';
          }

          storyEl.appendChild(div);
        });

        if (window._lightbox) {
          window._lightbox.setPhotos(allPhotos);
          storyEl.addEventListener('click', (e) => {
            const img = e.target.closest('[data-lightbox]');
            if (img) window._lightbox.open(parseInt(img.dataset.lightbox, 10));
          });
        }

        if (storyNavEl) {
          const prevCol = idx > 0 ? cols[idx - 1] : null;
          const nextCol = idx < cols.length - 1 ? cols[idx + 1] : null;
          let navHTML = '';
          if (prevCol) {
            navHTML += '<a class="story-nav__link story-nav__link--prev" href="collection.html?id=' + prevCol.id + '">' +
              '<span class="story-nav__label">&larr; Precedente</span>' +
              '<span class="story-nav__title">' + prevCol.title + '</span></a>';
          } else {
            navHTML += '<span></span>';
          }
          if (nextCol) {
            navHTML += '<a class="story-nav__link story-nav__link--next" href="collection.html?id=' + nextCol.id + '">' +
              '<span class="story-nav__label">Successiva &rarr;</span>' +
              '<span class="story-nav__title">' + nextCol.title + '</span></a>';
          }
          storyNavEl.innerHTML = navHTML;
        }

        requestAnimationFrame(() => {
          document.querySelectorAll('.story .fade-in').forEach((el, i) => {
            setTimeout(() => el.classList.add('is-visible'), i * 120);
          });
        });
      })
      .catch(() => {
        storyHeaderEl.innerHTML = '<h1>Errore</h1><p>Impossibile caricare i dati.</p>';
      });
  }

  /* ---- Contact form ---- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.querySelector('[name="name"]').value.trim();
      const email = contactForm.querySelector('[name="email"]').value.trim();
      const message = contactForm.querySelector('[name="message"]').value.trim();
      if (!name || !email || !message) return;
      const mailto = 'mailto:francescogiacomi1@gmail.com' +
        '?subject=' + encodeURIComponent('Messaggio da ' + name) +
        '&body=' + encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
      window.location.href = mailto;
    });
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
