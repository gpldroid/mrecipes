(() => {
  'use strict';

  const root = document.querySelector('[data-latest-slider]');
  const grid = document.querySelector('.recipe-grid[data-supabase-recipes]');
  if (!root || !grid) return;

  const track = root.querySelector('[data-slider-track]');
  const viewport = root.querySelector('[data-slider-viewport]');
  const previous = root.querySelector('[data-slider-prev]');
  const next = root.querySelector('[data-slider-next]');
  if (!track || !viewport || !previous || !next) return;

  const recoverImage = async img => {
    if (img.dataset.sliderFallbackTried === 'true') return;
    img.dataset.sliderFallbackTried = 'true';
    const link = img.closest('a[href]');
    if (!link) return;
    try {
      const response = await fetch(link.href, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Recipe page unavailable');
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const source = doc.querySelector('.content-page img, article .recipe-image img, article img');
      const src = source?.getAttribute('src') || source?.getAttribute('data-src');
      if (!src) throw new Error('No recipe image found');
      const fallback = new URL(src, link.href).href;
      if (fallback === img.src) throw new Error('Image URL already failed');
      img.onerror = () => {
        img.remove();
        const placeholder = document.createElement('span');
        placeholder.className = 'latest-slider-image-fallback';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = '🍽️';
        link.appendChild(placeholder);
      };
      img.src = fallback;
    } catch (_) {
      img.remove();
      const placeholder = document.createElement('span');
      placeholder.className = 'latest-slider-image-fallback';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = '🍽️';
      link.appendChild(placeholder);
    }
  };

  const updateControls = () => {
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    previous.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= max - 2;
  };

  const populate = () => {
    const cards = [...grid.querySelectorAll(':scope > .recipe-card')].slice(0, 3);
    if (cards.length === 0) return false;
    track.replaceChildren(...cards.map(card => {
      const clone = card.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('img').forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => recoverImage(img), { once: true });
      });
      return clone;
    }));
    root.hidden = false;
    updateControls();
    return true;
  };

  previous.addEventListener('click', () => {
    const card = track.querySelector('.recipe-card');
    viewport.scrollBy({ left: -(card?.getBoundingClientRect().width || viewport.clientWidth) - 16, behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    const card = track.querySelector('.recipe-card');
    viewport.scrollBy({ left: (card?.getBoundingClientRect().width || viewport.clientWidth) + 16, behavior: 'smooth' });
  });
  viewport.addEventListener('scroll', updateControls, { passive: true });
  window.addEventListener('resize', updateControls, { passive: true });

  root.hidden = true;
  if (!populate()) {
    const observer = new MutationObserver(() => {
      if (populate()) observer.disconnect();
    });
    observer.observe(grid, { childList: true });
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(updateControls).observe(viewport);
  }
})();
