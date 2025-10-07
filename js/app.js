// Utilities
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

function setYear() {
  const y = new Date().getFullYear();
  $$('#year').forEach(el => el.textContent = y);
}

// Nav + Dropdowns
function initNav() {
  const hamburger = $('.hamburger');
  const nav = $('#main-nav');
  on(hamburger, 'click', () => {
    if (!nav) return; // guard if main nav is missing
    const open = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (window.matchMedia('(max-width: 680px)').matches) {
      $$('.dropdown').forEach(dd => {
        if (open) dd.classList.add('open'); else dd.classList.remove('open');
        const btn = $('.dropdown-toggle', dd);
        if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  });

  // Dropdown toggles for mobile
  $$('.dropdown').forEach(dd => {
    const btn = $('.dropdown-toggle', dd);
    on(btn, 'click', (e) => {
      if (window.matchMedia('(max-width: 680px)').matches) {
        e.preventDefault();
        dd.classList.toggle('open');
        if (btn) btn.setAttribute('aria-expanded', dd.classList.contains('open') ? 'true' : 'false');
      }
    });
  });

  // Desktop: keep About Us dropdown open after hover or click until another nav item is hovered or a click occurs outside
  const desktopMQ = window.matchMedia('(min-width: 681px)');
  const aboutDropdown = $('.nav-item.dropdown');
  if (aboutDropdown) {
    const aboutBtn = $('.dropdown-toggle', aboutDropdown);

    // NEW: Always navigate to top of About Us on click (both desktop and mobile)
    // Use capture phase so this runs before other click handlers on the same element
    if (aboutBtn) {
      aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        const targetUrl = 'about.html';
        const href = window.location.href;
        if (href.includes('about.html')) {
          // Already on About page: scroll to top smoothly and close mobile nav
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, 0); }
          if (nav) nav.classList.remove('open');
        } else {
          window.location.href = targetUrl;
        }
      }, true);
    }

    // Open on hover
    on(aboutBtn, 'mouseenter', () => {
      if (desktopMQ.matches) {
        aboutDropdown.classList.add('open');
        aboutBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Toggle pin on click (prevent auto-close)
    on(aboutBtn, 'click', (e) => {
      if (desktopMQ.matches) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = aboutDropdown.classList.toggle('open');
        aboutBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });

    // Prevent clicks inside the dropdown from bubbling to document
    on(aboutDropdown, 'click', (e) => {
      if (desktopMQ.matches) e.stopPropagation();
    });

    // Close About dropdown when hovering another top-level nav item
    $$('.nav-list > .nav-item').forEach(item => {
      if (item !== aboutDropdown) {
        on(item, 'mouseenter', () => {
          if (desktopMQ.matches) {
            aboutDropdown.classList.remove('open');
            const btn = $('.dropdown-toggle', aboutDropdown);
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });

    // Click outside to close (desktop)
    on(document, 'click', () => {
      if (desktopMQ.matches) {
        aboutDropdown.classList.remove('open');
        const btn = $('.dropdown-toggle', aboutDropdown);
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close nav on link click (mobile)
  $$('.nav-list a').forEach(a => on(a, 'click', () => {
    if (window.matchMedia('(max-width: 680px)').matches && nav) nav.classList.remove('open');
  }));
}

// Achievements counters
// -> Key Figures counters
function initCounters() {
  const counters = $$('.stat-number');
  let started = false;

  const run = () => {
    counters.forEach((el, idx) => {
      const target = Number(el.dataset.target || '0');
      const hasPrefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const duration = 1600 + (idx * 120); // slight stagger for nicer feel
      const start = performance.now();

      const tick = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const val = Math.floor(target * eased);
        el.textContent = `${hasPrefix}${val}${eased === 1 ? suffix : ''}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting) && !started) {
      started = true;
      // Compute dynamic years in service from 1989 to current year
      const yearsEl = counters[0];
      if (yearsEl) {
        const startYear = 1989;
        const now = new Date();
        const currentYear = now.getFullYear();
        const years = Math.max(0, currentYear - startYear);
        yearsEl.dataset.target = String(years);
      }
      run();
      io.disconnect();
    }
  }, { threshold: 0.35 }); // slightly higher threshold to ensure on-screen

  counters.forEach(c => io.observe(c));
}

// Reusable parallax for sections with alternating gradients
function initParallaxSections() {
  // Parallax disabled: ensure any residual classes are removed
  const sections = Array.from(document.querySelectorAll('.section.parallax, .parallax, .parallax-primary, .parallax-alt, .parallax-architecture, .parallax-engineering'));
  sections.forEach(sec => {
    sec.classList.remove('parallax', 'parallax-primary', 'parallax-alt', 'parallax-architecture', 'parallax-engineering');
    sec.style.backgroundImage = 'none';
    sec.style.backgroundAttachment = 'scroll';
    sec.style.backgroundPosition = '';
  });
}

// Immersive reveal-on-scroll
function initReveal(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const addCandidates = (sel) => Array.from(document.querySelectorAll(sel));
  const candidates = new Set([
    ...addCandidates('main section.section:not(.hero)'),
    ...addCandidates('.section-title'),
    ...addCandidates('.stat'),
    ...addCandidates('.project-card'),
    ...addCandidates('.service-card'),
    ...addCandidates('.card'),
    ...addCandidates('.grid > *'),
    ...addCandidates('.filters'),
  ]);

  candidates.forEach(el => {
    if (el && (!el.dataset || el.dataset.reveal !== 'off')) el.classList.add('reveal');
  });

  if (reduce) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// Scroll progress bar at top of page
function initScrollProgress(){
  let bar = document.getElementById('scroll-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);
  }
  const update = () => {
    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    bar.style.width = progress + '%';
  };
  let rafId = null;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      update();
      rafId = null;
    });
  };
  update();
  on(window, 'scroll', onScroll);
  on(window, 'resize', update);
}

// Projects data (from your folders)
const projectsData = {
  "Industrial": {
    type: "subfolders",
    base: "Projects/Industrial",
    items: [
      "1. Asian Granito Limited",
      "2. SRC Pvt.Ltd",
      "3. SSIPL FB-2 & 3",
      "4. Brimax",
      "5. Huntsman International",
      "6. Waree CB-1 & 2",
      "7. UPL MAXPRO LAB Unit",
      "8. UPL QAQC LAB Unit",
      "9. XL Plastics",
      "10. YRPL",
      "11. Shree Chemopharma",
      "12. Precision Engineering",
      "13. KDI Limited",
      "14. Diamines Ltd",
      "15. HLE Glascoat",
      "16. SSIPL FB-1",
      "17. SSIPL HQ",
      "18. GNFC",
      "19. DNL H2SO4 Plant",
      "20. DRI Steel Plant",
      "21. Evexia Pharma",
      "22. Finolex",
      "23. Red Ridge Global",
      "24. ICTPL",
      "25. HIIPL Boiler house",
      "27. Narayan Powertech",
      "28. ZORBA  Aluminium Processing Unit",
      "29. Rubamin",
      "30. Renown Pharma",
      "31. Metso India Pvt.Ltd",
      "32. Industrial Chimneys",
      "33. Liquid Retaining Structures",
      "34. O&G Plants",
      "35. Pipe Racks and Supports",
      "36. Pure Remedies",
      "37. Scaffolding Design",
      "38. Dyes Formulation Plant HIIPL",
      "39. Capex Reduction for ABL"
    ]
  },
  "Institutional and Public Buildings": {
    type: "subfolders",
    base: "Projects/Institutional and Public Buildings",
    items: [
      "1. AAI Bareilly Airport",
      "2. Maharaja Ranjitsinh Institute  of Design , MSU",
      "3. Institue of Fashion Technology,MSU",
      "4. Faculty of Social works,MSU",
      "5. Pandit Deendayal Auditorium, MSU",
      "6. Institute Policy Research and International Studies,MSU",
      "7. Faculty of Pharmacy,MSU",
      "8. Kanta Stri Vikas Gruh",
      "9. XL Smiles Dr.Praptis clinic",
      "10. Essential Esthetics Dr.Neha Shah",
      "11. Institute of Management Studies, MSU",
      "12. GSFC hostel Building"
    ]
  },
  "Recreational and Hospitality": {
    type: "subfolders",
    base: "Projects/Recreational and Hospitality",
    items: [
      "1. Fortune Park Baroda Dahej",
      "2. Lemon Tree Hotel",
      "3. Fern Narmada Nihar SOU",
      "4. Prakruti Resort",
      "5. Kavery Rajkot",
      "6. Hotel Airport",
      "7. Chowki Dhani Hotels"
    ]
  },
  "Residential": {
    type: "flat",
    base: "Projects/Residential",
    items: ["1.png", "2.png", "3.png"]
  },
  "Unique Projects": {
    type: "flat",
    base: "Projects/Unique Projects",
    items: ["4.jpg","2.jpg","3.png","1.png","6.jpg","5.jpg","8.png","7.png","10.png"]
  }
};

const baseImageExts = [
  'jpg','jpeg','png','webp','gif','bmp','tif','tiff','avif','heic','heif','jfif'
];
const imageExts = Array.from(new Set(baseImageExts.flatMap(e => [e, e.toUpperCase()])));
// Caches to avoid re-probing images repeatedly
const thumbCache = new Map(); // key: base folder, value: thumbnail src or null
const slidesCache = new Map(); // key: base folder, value: array of slide srcs

function encodePath(parts) {
  // Encode path segments while preserving directory separators.
  // Handles inputs that may already contain slashes by splitting and encoding each sub-segment.
  const segments = [];
  for (const part of parts) {
    const cleaned = String(part).replace(/\\/g, '/');
    const sub = cleaned.split('/').filter(Boolean);
    for (const s of sub) segments.push(encodeURIComponent(s));
  }
  return segments.join('/');
}

async function probeImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Faster probe with timeout to avoid long waits on missing files
function probeImageWithTimeout(src, timeoutMs = 300) {
  return Promise.race([
    probeImage(src),
    new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
  ]);
}
async function findThumb(base) {
  // Try file "1" with common project extensions, in parallel with short timeouts
  const candidates = projectImageExts.map(ext => `${base}/1.${ext}`);
  const results = await Promise.all(candidates.map(src => probeImageWithTimeout(src, 250)));
  return results.find(Boolean) || null;
}

async function findThumbCached(base) {
  if (thumbCache.has(base)) return thumbCache.get(base);
  const thumb = await findThumb(base);
  thumbCache.set(base, thumb || null);
  return thumb;
}

async function collectSlides(base, max = 30) {
  const slides = [];
  for (let i = 1; i <= max; i++) {
    let found = null;
    for (const ext of imageExts) {
      const src = `${base}/${i}.${ext}`;
      // eslint-disable-next-line no-await-in-loop
      const ok = await probeImage(src);
      if (ok) { found = ok; break; }
    }
    if (found) slides.push(found);
  }
  return slides;
}

// Optimized collector for Projects: parallel probing in small chunks with early-stop
const projectImageExts = ['jpg','jpeg','png','JPG','JPEG','PNG'];
async function collectProjectSlides(base, maxIndex = 80, chunkSize = 10, emptyChunkStop = 2, timeoutMs = 250) {
  const slides = [];
  let emptyChunks = 0;
  for (let start = 1; start <= maxIndex; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, maxIndex);
    const probes = [];
    for (let i = start; i <= end; i++) {
      probes.push((async () => {
        const results = await Promise.all(
          projectImageExts.map(ext => probeImageWithTimeout(`${base}/${i}.${ext}`, timeoutMs))
        );
        return results.find(Boolean) || null;
      })());
    }
    // eslint-disable-next-line no-await-in-loop
    const chunkResults = await Promise.all(probes);
    const foundThisChunk = chunkResults.filter(Boolean);
    slides.push(...foundThisChunk);
    if (foundThisChunk.length === 0) {
      emptyChunks++;
    } else {
      emptyChunks = 0;
    }
    // If first chunk had no images, stop immediately to keep modal snappy
    if (start === 1 && foundThisChunk.length === 0) break;
    // Stop after consecutive empty chunks once we've found some images
    if (slides.length && emptyChunks >= emptyChunkStop) break;
  }
  return slides;
}

async function getProjectSlidesCached(base) {
  if (slidesCache.has(base)) return slidesCache.get(base);
  const slides = await collectProjectSlides(base);
  slidesCache.set(base, slides);
  return slides;
}

// Helper function to extract number from project name for sorting
function extractNumber(name) {
  const match = name.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : 999;
}

// Helper function to remove number prefix from project name
function cleanProjectName(name) {
  return name.replace(/^\d+\.\s*/, '').trim();
}

// Render Projects
function initProjects() {
  const grid = $('#projects-grid');
  const showMoreBtn = $('#projects-show-more');
  const tabs = $$('.filter-btn');

  let currentFilter = 'All';
  let visibleCount = 0;
  let initialMax = getInitialMax();
  let currentList = [];
  let nextIndex = 0;
  const PAGE_SIZE = 6; // number of items to reveal per Show More click
  let expanded = false; // track expanded/collapsed state explicitly

  function getInitialMax() {
    // Show 12 project tiles initially for a 4x3 grid
    return 12;
  }

  // Project Modal logic
  const projectModal = $('#project-modal');
  const slidesContainer = projectModal ? projectModal.querySelector('.slides-container') : null;
  const prevBtn = projectModal ? projectModal.querySelector('.slide-nav.prev') : null;
  const nextBtn = projectModal ? projectModal.querySelector('.slide-nav.next') : null;
  const modalTitle = $('#project-modal-title');
  const slideCounter = projectModal ? projectModal.querySelector('#project-slide-counter') : null;
  let currentSlides = [];
  let currentIndex = 0;

  function renderSlide() {
    if (!slidesContainer || !currentSlides.length) return;
    slidesContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = currentSlides[currentIndex];
    img.alt = (modalTitle && modalTitle.textContent) ? modalTitle.textContent : 'Project image';
    img.loading = 'eager';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    slidesContainer.appendChild(img);

    // Update slide counter text
    if (slideCounter) {
      const total = currentSlides.length;
      const pos = total ? (currentIndex + 1) : 0;
      slideCounter.textContent = `Image ${pos} of ${total}`;
    }
  }

  function openProjectModal(title, slides) {
    // Use a neutral 1x1 transparent png to avoid logo flashes
    const NEUTRAL_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ekmOmoAAAAASUVORK5CYII=';
    currentSlides = (slides && slides.length) ? slides : [NEUTRAL_PLACEHOLDER];
    currentIndex = 0;
    if (modalTitle) modalTitle.textContent = title;
    renderSlide();
    if (projectModal) {
      projectModal.classList.add('show');
      projectModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('show');
    projectModal.setAttribute('aria-hidden', 'true');
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (!currentSlides.length) return;
    currentIndex = (currentIndex - 1 + currentSlides.length) % currentSlides.length;
    renderSlide();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (!currentSlides.length) return;
    currentIndex = (currentIndex + 1) % currentSlides.length;
    renderSlide();
  });
  $$('#project-modal [data-close="modal"]').forEach(b => on(b, 'click', closeProjectModal));
  on(document, 'keydown', (e) => {
    if (!projectModal || projectModal.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeProjectModal();
    if (e.key === 'ArrowLeft') prevBtn && prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn && nextBtn.click();
  });

  function updateButton() {
    if (!showMoreBtn) return;
    const shouldShow = (currentFilter !== 'All') && (currentList.length > initialMax);
    showMoreBtn.hidden = !shouldShow;
    showMoreBtn.textContent = expanded ? 'Show Less' : 'Show More';
  }

  // Lazy thumbnail loader using IntersectionObserver
  const thumbObserver = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      thumbObserver.unobserve(card);
      const img = card.querySelector('img');
      if (!img) return;
      if (card.dataset.slideshowBase) {
        const base = card.dataset.slideshowBase;
        const thumb = await findThumbCached(base);
        if (thumb) img.src = thumb; // replace placeholder with real thumb
      } else if (card.dataset.singleImage) {
        img.src = card.dataset.singleImage;
      }
    });
  }, { rootMargin: '200px' });

  function buildCard(item) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const img = document.createElement('img');
    const title = document.createElement('div');
    title.className = 'title';

    if (item.kind === 'subfolder') {
      const base = encodePath([item.base, item.name]);
      // Set placeholder immediately; real thumb loaded lazily via IntersectionObserver
      // lightweight transparent placeholder while probing
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ekmOmoAAAAASUVORK5CYII=';
      img.alt = `${item.category} - ${cleanProjectName(item.name)}`;
      img.loading = 'lazy';
      img.onerror = () => {
        img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ekmOmoAAAAASUVORK5CYII=';
        img.style.objectFit = 'contain';
        img.style.background = '#ffffff';
      };

      title.textContent = cleanProjectName(item.name);
      card.dataset.slideshowBase = base;
      card.dataset.projectTitle = title.textContent;

      card.addEventListener('click', async () => {
        // Open instantly with the visible thumbnail for a snappy UX
        const initial = img.currentSrc || img.src || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ekmOmoAAAAASUVORK5CYII=';
        openProjectModal(title.textContent, [initial]);
        try {
          const slides = await getProjectSlidesCached(base);
          if (slides && slides.length) {
            currentSlides = slides;
            currentIndex = 0;
            renderSlide();
          }
        } catch (_e) {
          /* no-op: keep initial slide */
        }
      });
      card.addEventListener('keypress', (e) => { if (e.key === 'Enter') card.click(); });
      // Observe for lazy thumbnail replacement
      thumbObserver.observe(card);
    } else {
      const src = encodePath([item.base, item.file]);
      // Use placeholder, load actual image when visible
      // lightweight transparent placeholder while probing
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ekmOmoAAAAASUVORK5CYII=';
      img.alt = `${item.category} - ${cleanProjectName(item.file)}`;
      img.loading = 'lazy';
      img.onerror = () => {
        img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ekmOmoAAAAASUVORK5CYII=';
        img.style.objectFit = 'contain';
        img.style.background = '#ffffff';
      };

      title.textContent = cleanProjectName(item.file.replace(/\.[^.]+$/, ''));
      card.dataset.singleImage = src;
      card.dataset.projectTitle = title.textContent;

      card.addEventListener('click', () => {
        openProjectModal(title.textContent, [src]);
      });
      card.addEventListener('keypress', (e) => { if (e.key === 'Enter') card.click(); });
      // Observe for lazy image load
      thumbObserver.observe(card);
    }

    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = item.category;

    card.appendChild(img);
    card.appendChild(badge);
    card.appendChild(title);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${item.category} project: ${title.textContent}`);
    return card;
  }

  function gatherAllItems() {
    const all = [];
    for (const [category, conf] of Object.entries(projectsData)) {
      if (conf.type === 'subfolders') {
        // Sort items by number while preserving original order for non-numbered items
        const sortedItems = [...conf.items].sort((a, b) => {
          const numA = extractNumber(a);
          const numB = extractNumber(b);
          return numA - numB;
        });
        
        sortedItems.forEach(name => {
          all.push({ kind: 'subfolder', category, base: conf.base, name });
        });
      } else {
        // Sort flat items by number
        const sortedItems = [...conf.items].sort((a, b) => {
          const numA = extractNumber(a);
          const numB = extractNumber(b);
          return numA - numB;
        });
        
        sortedItems.forEach(file => {
          all.push({ kind: 'flat', category, base: conf.base, file });
        });
      }
    }
    return all;
  }

  // Render a chunk of items from currentList starting at nextIndex
  async function renderChunk(count) {
    const end = Math.min(nextIndex + count, currentList.length);
    for (let i = nextIndex; i < end; i++) {
      const card = buildCard(currentList[i]);
      grid.appendChild(card);
      visibleCount++;
    }
    nextIndex = end;
    updateButton();
  }

  async function render() {
    // Recalculate initialMax on each render
    initialMax = getInitialMax();

    grid.innerHTML = '';
    const all = gatherAllItems();
    currentList = currentFilter === 'All' ? all : all.filter(i => i.category === currentFilter);
    visibleCount = 0;
    nextIndex = 0;
    expanded = false;

    // Show first page
    await renderChunk(initialMax);

    // If should not show for this category, ensure button is hidden immediately
    updateButton();

    // Wire Show More/Less toggle
    showMoreBtn.onclick = async () => {
      if (!expanded) {
        // Expand to show remaining items
        const firstNewIndex = nextIndex; // remember where new items will start
        await renderChunk(currentList.length - nextIndex);
        expanded = true;
        updateButton();
        // Smooth scroll the first newly added card into view
        const firstNew = grid.children[firstNewIndex];
        if (firstNew) {
          try { firstNew.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) { firstNew.scrollIntoView(); }
        }
      } else {
        // Collapse back to initial tiles
        grid.innerHTML = '';
        visibleCount = 0;
        nextIndex = 0;
        await renderChunk(initialMax);
        expanded = false;
        updateButton();
        try { grid.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) { grid.scrollIntoView(); }
      }
    };
  }

  tabs.forEach(btn => on(btn, 'click', async () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    await render();
  }));

  // Re-render on resize to adapt initialMax across breakpoints
  on(window, 'resize', () => {
    const next = getInitialMax();
    if (next !== initialMax) {
      render();
    }
  });

  // initial
  render();
}

// Services
// Rewritten: use local icons from Services/icons, banners from Services/Banner, and descriptions parsed from Word file
const servicesOrder = [
  { index: 1, title: "Master Planning", banner: "Services/Banner/1 Master Planning.jpg", icon: "Services/icons/Master Planning.png" },
  { index: 2, title: "Architecture", banner: "Services/Banner/2 Architecture.jpg", icon: "Services/icons/Architecture.png" },
  { index: 3, title: "Structural Engineering", banner: "Services/Banner/3 Stuctural Engineering.jpg", icon: "Services/icons/Structural Engineering.png" },
  { index: 4, title: "MEP", banner: "Services/Banner/4 MEP.jpg", icon: "Services/icons/MEP.png" },
  { index: 5, title: "HVAC", banner: "Services/Banner/5 HVAC.jpg", icon: "Services/icons/HVAC.png" },
  { index: 6, title: "Procurement and Construction", banner: "Services/Banner/6 Procurement and Construction.jpg", icon: "Services/icons/PROCUREMENT & CONSTRUCTION.png" },
  { index: 7, title: "Critical Industrial Infrastructure", banner: "Services/Banner/7 Critical Industrial Infrastructure.jpg", icon: "Services/icons/Ctitical Industries .png" },
  { index: 8, title: "Structural Health Audits & Non-Destructive Testing (NDT)", banner: "Services/Banner/8 Structural Health Audits & Non-Destructive Testing (NDT).jpg", icon: "Services/icons/Non-Destructive Testing .png" },
  { index: 9, title: "Retrofitting and Rehabilitation", banner: "Services/Banner/9 Retrofitting and Rehabilitation.jpg", icon: "Services/icons/Retrofitting .png" },
  { index: 10, title: "Project Management", banner: "Services/Banner/10 Project Management.jpg", icon: "Services/icons/Project Management .png" },
  { index: 11, title: "Landscaping", banner: "Services/Banner/11 Landscaping.jpg", icon: "Services/icons/Landscaping .png" },
  { index: 12, title: "Interiors", banner: "Services/Banner/12 Interiors.jpg", icon: "Services/icons/Interior.png" },
  { index: 13, title: "Water Management Systems", banner: "Services/Banner/13 Water Management Systems.jpg", icon: "Services/icons/watermanagement and Retaining .png" },
  { index: 14, title: "Industrial and Commercial Leasing", banner: "Services/Banner/14 Industrial and Commercial Leasing.jpg", icon: "Services/icons/Industrial & Commercial.png" },
  { index: 15, title: "Built-to-Suit Industrial Leased Properties", banner: "Services/Banner/15 Built-to-Suit Industrial Leased Properties.jpg", icon: "Services/icons/Builttosuitindstries.png" }
];

let serviceDescriptions = new Map();
let serviceDescriptionsHtml = new Map();
let serviceDocLoaded = false;
let currentServiceIndex = 0; // 0-based index into servicesOrder

async function loadServiceDescriptions() {
  // DOCX source not present in Services/Discription; skip fetching to prevent 404s.
  // Function retained as a no-op for backward compatibility.
  serviceDocLoaded = true;
  return serviceDescriptionsHtml.size ? serviceDescriptionsHtml : serviceDescriptions;
}

function initServices() {
  const grid = $('#services-grid');
  if (grid) {
    grid.innerHTML = '';
    servicesOrder.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <div class="icon"><img src="${encodeURI(s.icon)}" alt="${s.title} icon" loading="lazy" /></div>
        <div class="title">${s.title}</div>
      `;
      // Ensure icon has a fallback if missing
      const iconImg = card.querySelector('.icon img');
      if (iconImg) {
        iconImg.onerror = () => {
          iconImg.src = NEUTRAL_PLACEHOLDER;
          iconImg.style.objectFit = 'contain';
          iconImg.style.background = '#ffffff';
        };
      }
      card.tabIndex = 0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label', `${s.title} details`);
      card.addEventListener('click', () => openServiceModalByIndex(idx));
      card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openServiceModalByIndex(idx); });
      grid.appendChild(card);
    });
  }

  const modal = $('#service-modal');
  const title = $('#service-modal-title');
  const banner = $('#service-modal-banner');
  const desc = $('#service-modal-desc');
  const prevBtn = modal ? modal.querySelector('.slide-nav.prev') : null;
  const nextBtn = modal ? modal.querySelector('.slide-nav.next') : null;

  function updateModalContent() {
    const svc = servicesOrder[currentServiceIndex];
    if (!svc) return;
    title.textContent = `${svc.index}. ${svc.title}`;
    banner.src = encodeURI(svc.banner);
    banner.alt = `${svc.title} banner`;
    // Fallback if banner image is missing
    if (banner) {
      banner.onerror = () => {
        banner.src = NEUTRAL_PLACEHOLDER;
        banner.style.objectFit = 'contain';
        banner.style.background = '#ffffff';
      };
    }
    
    // Static service descriptions for first 10 services
    const staticDescriptions = {
      "Master Planning": `
        <ul>
          <li>Comprehensive land-use analysis and zoning compliance.</li>
          <li>Integration of urban design, infrastructure, and environmental considerations.</li>
          <li>Strategic site planning for industrial, commercial, and institutional developments.</li>
          <li>Space optimization for maximum efficiency and sustainability.</li>
          <li>Phased development strategies for long-term growth.</li>
          <li>Incorporation of circulation networks (roads, pedestrian, utilities).</li>
          <li>Climate-responsive and sustainable planning approaches.</li>
          <li>Stakeholder consultation and vision alignment.</li>
          <li>Future-proof design accommodating expansion and adaptability.</li>
        </ul>
      `,
      "Architecture": `
        <ul>
          <li>Concept-to-completion architectural design services.</li>
          <li>Innovative, functional, and aesthetic design solutions.</li>
          <li>Sustainable and green building practices (IGBC/GBC compliance).</li>
          <li>Space planning tailored to user needs and operations.</li>
          <li>Industrial, commercial, residential, and institutional design expertise.</li>
          <li>Advanced 3D visualization, BIM, and walkthroughs.</li>
          <li>Regulatory approvals and statutory compliances.</li>
          <li>Integration of modern materials and technologies.</li>
          <li>Human-centric and ergonomically designed environments.</li>
        </ul>
      `,
      "Structural Engineering": `
        <ul>
          <li>Safe, economical, and optimized structural designs.</li>
          <li>Expertise in steel, RCC, composite, and precast structures.</li>
          <li>Design of complex industrial facilities and heavy foundations.</li>
          <li>Advanced seismic and wind-resistant structural systems.</li>
          <li>Finite Element Analysis (FEA) and structural modeling.</li>
          <li>Retaining structures, deep foundations, and piling design.</li>
          <li>Value engineering for material and cost optimization.</li>
          <li>Rehabilitation and retrofitting of existing structures.</li>
          <li>Compliance with international and Indian codes (IS, ACI, Eurocode).</li>
        </ul>
      `,
      "MEP": `
        <ul>
          <li>End-to-end design and coordination of MEP systems.</li>
          <li>Energy-efficient mechanical systems tailored to industry needs.</li>
          <li>Power distribution, lighting, and electrical safety systems.</li>
          <li>Advanced plumbing & drainage systems for water conservation.</li>
          <li>Fire detection and suppression systems as per NFPA/IS codes.</li>
          <li>Low-voltage & communication systems integration.</li>
          <li>BIM-based MEP clash detection and coordination.</li>
          <li>Sustainable and smart building services design.</li>
          <li>Operation-friendly systems ensuring minimal downtime.</li>
        </ul>
      `,
      "HVAC": `
        <ul>
          <li>Industrial-grade HVAC system design and engineering.</li>
          <li>Thermal comfort solutions for commercial & industrial facilities.</li>
          <li>Cleanroom & controlled environment HVAC expertise.</li>
          <li>Energy-efficient chiller, VRV, and packaged solutions.</li>
          <li>Computational Fluid Dynamics (CFD) based airflow design.</li>
          <li>Heat load calculation and optimized ducting design.</li>
          <li>HVAC retrofitting and system performance upgrades.</li>
          <li>Indoor Air Quality (IAQ) and ventilation strategies.</li>
          <li>Smart HVAC controls with IoT integration.</li>
        </ul>
      `,
      "Procurement and Construction": `
        <ul>
          <li>End-to-end project management and execution.</li>
          <li>Transparent vendor evaluation and procurement process.</li>
          <li>Cost estimation, budgeting, and value engineering.</li>
          <li>Quality assurance and quality control (QA/QC) protocols.</li>
          <li>On-site supervision and contractor coordination.</li>
          <li>Time-bound project delivery with milestone tracking.</li>
          <li>Safety compliance and EHS implementation.</li>
          <li>Supply chain management and logistics planning.</li>
          <li>Turnkey construction services for industrial and commercial facilities.</li>
        </ul>
      `,
      "Critical Industrial Infrastructure": `
        <ul>
          <li>Design and execution of mission-critical industrial facilities.</li>
          <li>Blast-resistant and fire-safe structures for high-risk industries.</li>
          <li>Specialized foundations for heavy machinery and dynamic loads.</li>
          <li>Utility networks for water, power, gas, and process pipelines.</li>
          <li>Hazardous area planning and compliance with global safety norms.</li>
          <li>High-performance structures for chemical, petrochemical & pharma plants.</li>
          <li>Customized solutions for manufacturing & process industries.</li>
          <li>Integration of automation and smart infrastructure technologies.</li>
          <li>End-to-end risk management and disaster resilience planning.</li>
        </ul>
      `,
      "Structural Health Audits & Non-Destructive Testing (NDT)": `
        <ul>
          <li>Comprehensive evaluation of structures without causing damage.</li>
          <li>Ultrasonic, radiographic, and magnetic particle inspection.</li>
          <li>Concrete strength, rebar detection, and crack assessment.</li>
          <li>Weld testing and thickness measurements for industrial structures.</li>
          <li>Quality verification of structural integrity and durability.</li>
          <li>Early detection of potential defects to prevent failures.</li>
          <li>Compliance with IS, ASTM, and international standards.</li>
          <li>Condition monitoring for predictive maintenance planning.</li>
          <li>Detailed reporting with actionable recommendations.</li>
        </ul>
      `,
      "Retrofitting and Rehabilitation": `
        <ul>
          <li>Structural strengthening of aging and distressed buildings.</li>
          <li>Seismic retrofitting for earthquake-prone regions.</li>
          <li>Advanced repair techniques for concrete and steel structures.</li>
          <li>Fiber Reinforced Polymer (FRP) wrapping and jacketing solutions.</li>
          <li>Restoration of heritage and special-purpose structures.</li>
          <li>Corrosion control and protective coating applications.</li>
          <li>Life-cycle extension of critical infrastructure assets.</li>
          <li>Customized rehabilitation strategies for industrial facilities.</li>
          <li>Cost-effective and sustainable repair methodologies.</li>
        </ul>
      `,
      "Project Management": `
        <ul>
          <li>End-to-end project planning and execution oversight.</li>
          <li>Scope definition, scheduling, and resource allocation.</li>
          <li>Independent cost estimation and financial monitoring.</li>
          <li>Contractor/vendor prequalification and tender management.</li>
          <li>Quality assurance and risk mitigation strategies.</li>
          <li>Progress monitoring with milestone tracking.</li>
          <li>Stakeholder coordination and reporting systems.</li>
          <li>Compliance with statutory, safety, and regulatory norms.</li>
          <li>Ensuring on-time and within-budget project delivery.</li>
        </ul>
      `,
      // Newly added static descriptions (11–15)
      "Landscaping": `
        <ul>
          <li>Sustainable and climate-responsive landscape design.</li>
          <li>Integration of softscape (plants, trees, lawns) and hardscape elements.</li>
          <li>Outdoor spaces enhancing user experience and aesthetics.</li>
          <li>Stormwater management and green infrastructure solutions.</li>
          <li>Xeriscaping and low-maintenance plantation strategies.</li>
          <li>Landscape lighting and irrigation system design.</li>
          <li>Corporate, industrial, and residential landscape expertise.</li>
          <li>Eco-friendly materials and native plantation practices.</li>
          <li>Enhancing environmental performance and well-being.</li>
        </ul>
      `,
      "Interiors": `
        <ul>
          <li>Functional and aesthetic interior space planning.</li>
          <li>Tailored solutions for corporate, industrial, and residential spaces.</li>
          <li>Ergonomic and user-centric workplace designs.</li>
          <li>Integration of natural lighting and ventilation strategies.</li>
          <li>Selection of sustainable materials and finishes.</li>
          <li>Modular furniture and customized design elements.</li>
          <li>3D visualization, walkthroughs, and BIM-based interiors.</li>
          <li>Acoustic design for comfort and efficiency.</li>
          <li>Branding through spatial design and theme integration.</li>
        </ul>
      `,
      "Water Management Systems": `
        <ul>
          <li>End-to-end design of water storage, drainage, and treatment systems.</li>
          <li>Rainwater harvesting, groundwater recharge, and stormwater management.</li>
          <li>Industrial wastewater treatment and recycling solutions.</li>
          <li>Hydraulic and hydrological analysis for flood control.</li>
          <li>Design of gravity & reinforced earth retaining walls.</li>
          <li>Advanced geotechnical solutions including secant piles, diaphragm walls, and soil nailing.</li>
          <li>Erosion control and slope stabilization systems.</li>
          <li>Compliance with environmental norms and sustainability standards.</li>
          <li>Long-term water balance planning for industrial estates.</li>
        </ul>
      `,
      "Industrial and Commercial Leasing": `
        <ul>
          <li>Advisory services for leasing of warehouses, factories, and office spaces.</li>
          <li>Market analysis and property benchmarking for clients.</li>
          <li>Legal and technical due diligence for leasing contracts.</li>
          <li>Flexible leasing models to suit client requirements.</li>
          <li>Negotiation support ensuring competitive rentals and terms.</li>
          <li>Industrial park and SEZ leasing facilitation.</li>
          <li>End-to-end transaction management and client representation.</li>
          <li>Strong network with developers, landlords, and agencies.</li>
          <li>Post-leasing support and space utilization guidance.</li>
        </ul>
      `,
      "Built-to-Suit Industrial Leased Properties": `
        <ul>
          <li>Customized industrial facility development based on client specifications.</li>
          <li>Concept-to-delivery solutions including design, approvals, and construction.</li>
          <li>Flexible layouts designed for process optimization and scalability.</li>
          <li>Compliance with fire, safety, and industrial codes.</li>
          <li>Cost-efficient and energy-efficient building strategies.</li>
          <li>Fast-track delivery through EPC and turnkey execution.</li>
          <li>Single-window support for land acquisition, approvals, and leasing.</li>
          <li>Long-term lease structuring with client-specific agreements.</li>
          <li>Hassle-free facility management and maintenance integration.</li>
        </ul>
      `
    };
    
    // Populate description using static content; DOCX loading disabled (no file present)
    desc.innerHTML = '';
    const staticDesc = staticDescriptions[svc.title];
    if (staticDesc) {
      desc.innerHTML = staticDesc;
    } else {
      desc.textContent = 'Description will be updated soon.';
    }
    
    // Update nav disabled state
    if (prevBtn) prevBtn.disabled = currentServiceIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentServiceIndex >= servicesOrder.length - 1;
  }

  window.openServiceModalByIndex = function(idx){
    currentServiceIndex = Math.max(0, Math.min(servicesOrder.length - 1, idx));
    if (modal){
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
    }
    updateModalContent();
  }

  if (prevBtn) on(prevBtn, 'click', () => {
    if (currentServiceIndex > 0){ currentServiceIndex--; updateModalContent(); }
  });
  if (nextBtn) on(nextBtn, 'click', () => {
    if (currentServiceIndex < servicesOrder.length - 1){ currentServiceIndex++; updateModalContent(); }
  });

  // Close handlers
  $$('.modal [data-close="modal"]').forEach(b => on(b, 'click', () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  }));

  // Keyboard navigation within service modal
  on(document, 'keydown', (e) => {
    if (!modal || !modal.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') {
      if (currentServiceIndex > 0){ currentServiceIndex--; updateModalContent(); }
    } else if (e.key === 'ArrowRight') {
      if (currentServiceIndex < servicesOrder.length - 1){ currentServiceIndex++; updateModalContent(); }
    } else if (e.key === 'Escape') {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
    }
  });
}

function serviceIcon(key) {
  // Obsolete: now using local PNG icons instead of SVG
}

// Removed old static services array and modal functions
// All services functionality now handled by the new initServices function above
function buildClientsData() {
  const arr = [];
  for (let i = 1; i <= 84; i++) {
    const src = `Partner-logo/logo.${i}.jpg`;
    let category = '';
    if (i >= 1 && i <= 25) category = 'Public Companies';
    else if (i >= 26 && i <= 50) category = 'Multinational Companies';
    else if (i >= 51 && i <= 74) category = 'Private Limited Companies';
    else if (i >= 75 && i <= 81) category = 'Government Organizations';
    else category = 'Associate Property International Consultants';
    // Override specific indices for manual corrections
    // Assumption: Knightfrank logo is at index 81 and should be moved to Associates
    const overrides = {
      81: 'Associate Property International Consultants'
    };
    if (overrides[i]) category = overrides[i];
    arr.push({ src, category, i });
  }
  return arr;
}
function initClients() {
  const all = buildClientsData();
  const grid = $('#clients-grid');
  const showMore = $('#clients-show-more');
  const tabs = $$('.client-filter-btn');
  let current = 'Public Companies';

  if (!grid) return; // safety guard if clients grid is not present

  function render() {
    grid.innerHTML = '';
    const list = all.filter(x => x.category === current);
    const initial = list.slice(0, 25); // show 5x5 = 25
    const rest = list.slice(25);
    initial.forEach(item => {
      const wrap = document.createElement('div');
      wrap.classList.add('client-card');
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = `${item.category} logo ${item.i}`;
      img.loading = 'lazy';
      img.onerror = () => { img.src = NEUTRAL_PLACEHOLDER; img.style.objectFit = 'contain'; img.style.background = '#ffffff'; };
      wrap.appendChild(img);
      grid.appendChild(wrap);
    });

    if (showMore) {
      showMore.hidden = rest.length === 0;
      showMore.onclick = () => {
        rest.forEach(item => {
          const wrap = document.createElement('div');
          wrap.classList.add('client-card');
          const img = document.createElement('img');
          img.src = item.src;
          img.alt = `${item.category} logo ${item.i}`;
          img.loading = 'lazy';
          img.onerror = () => { img.src = NEUTRAL_PLACEHOLDER; img.style.objectFit = 'contain'; img.style.background = '#ffffff'; };
          wrap.appendChild(img);
          grid.appendChild(wrap);
        });
        showMore.hidden = true;
      };
    }
  }

  tabs.forEach(btn => on(btn, 'click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    current = btn.dataset.filter;
    render();
  }));

  render();
}

// Newsroom (from your folders)
const newsroomData = [
  {
    title: "Bareilly Airport Inaugration Ceremony",
    base: "News Room/Bareilly Airport Inaugration Ceremony",
    images: ["1.jpg","1.png","2.jpg","3.jpg","4.jpg","4.png","5.jpg"]
  },
  {
    title: "Dr. Madhvi Lata Vadodara",
    base: "News Room/Dr. Madhvi Lata Vadodara",
    images: ["1.png","2.png","3.png","4.png","5.png","6.png"]
  },
  {
    title: "IGBC Vadodara",
    base: "News Room/IGBC Vadodara",
    images: ["1.jpeg","1739301439486.jpeg","1739301475984.jpeg","1739301477745.jpeg","1739301480697.jpeg","1739301480737.jpeg"]
  },
  {
    title: "KBS Architecture in PEB",
    base: "News Room/KBS Architecture in PEB",
    images: ["1.jpg","1a.jpg","2.JPG","3.JPG","4.JPG","63f18bd5-bd48-415c-a1a4-58223704c07f.JPG","6569a13a-3483-4bde-b8fb-fae4623b0b00.JPG","8177fc98-35c0-4d34-8912-c8966ddb54d2.JPG","a81b7698-9fca-4517-9bc6-2db2c053c111.JPG","c89cd20b-7cef-4cf1-be6b-d174d0b3d2ce.JPG","cd8fe10f-8500-4817-b139-0a2ae8e9d8e3.JPG","e995f6fe-df4b-4f96-be22-89aeaf0771bb.JPG"]
  }
];

function initNewsroom() {
  const grid = document.querySelector('#newsroom-grid');
  const showMoreBtn = document.querySelector('#newsroom-show-more');
  if (!grid || !showMoreBtn) return;

  // Build a flattened list of newsroom items similar to projects
  // Each group becomes one card, clicking opens a slideshow of its images
  const allItems = newsroomData.map(group => ({
    title: group.title,
    base: group.base,
    images: group.images
  }));

  const INITIAL_MAX = 3;
  const PAGE_SIZE = 3;
  let expanded = false;
  let nextIndex = 0;

  function makeCard(item) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const img = document.createElement('img');
    // Try to use first available image as thumb
    img.src = encodePath([item.base, item.images[0]]);
    img.alt = item.title;
    img.loading = 'lazy';
    img.onerror = () => {
      img.src = NEUTRAL_PLACEHOLDER;
      img.style.objectFit = 'contain';
      img.style.background = '#ffffff';
    };

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = item.title;

    card.appendChild(img);
    card.appendChild(title);
    card.tabIndex = 0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label', `Newsroom gallery: ${item.title}`);

    card.addEventListener('click', async () => {
      const slides = await buildNewsroomSlides(item);
      openNewsroomModal(item.title, slides);
    });
    card.addEventListener('keypress', (e) => { if (e.key === 'Enter') card.click(); });

    return card;
  }

  async function buildNewsroomSlides(item) {
    // Validate each provided file actually exists by probing
    const slides = [];
    for (const file of item.images) {
      const candidate = encodePath([item.base, file]);
      // eslint-disable-next-line no-await-in-loop
      const ok = await probeImage(candidate);
      if (ok) slides.push(ok);
    }
    // Fallback: also try numeric sequence if nothing was found
    if (!slides.length) {
      const seq = await collectSlides(item.base, 150);
      if (seq && seq.length) return seq;
    }
    return slides.length ? slides : [NEUTRAL_PLACEHOLDER];
  }

  // Modal elements (specific to Newsroom)
  const modal = document.getElementById('newsroom-modal');
  const slidesContainer = modal ? modal.querySelector('.slides-container') : null;
  const prevBtn = modal ? modal.querySelector('.slide-nav.prev') : null;
  const nextBtn = modal ? modal.querySelector('.slide-nav.next') : null;
  const modalTitle = document.getElementById('newsroom-modal-title');
  let currentSlides = [];
  let currentSlideIndex = 0;

  function renderSlide() {
    if (!slidesContainer || !currentSlides.length) return;
    slidesContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = currentSlides[currentSlideIndex] || NEUTRAL_PLACEHOLDER;
    img.alt = modalTitle && modalTitle.textContent ? modalTitle.textContent : 'Newsroom image';
    img.loading = 'eager';
    slidesContainer.appendChild(img);
  }

  function openNewsroomModal(title, slides) {
    currentSlides = slides && slides.length ? slides : [NEUTRAL_PLACEHOLDER];
    currentSlideIndex = 0;
    if (modalTitle) modalTitle.textContent = title;
    renderSlide();
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
    }
  }

  function closeNewsroomModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (!currentSlides.length) return;
    currentSlideIndex = (currentSlideIndex - 1 + currentSlides.length) % currentSlides.length;
    renderSlide();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (!currentSlides.length) return;
    currentSlideIndex = (currentSlideIndex + 1) % currentSlides.length;
    renderSlide();
  });
  document.querySelectorAll('#newsroom-modal [data-close="modal"]').forEach(b => b.addEventListener('click', closeNewsroomModal));
  document.addEventListener('keydown', (e) => {
    if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeNewsroomModal();
    if (e.key === 'ArrowLeft') prevBtn && prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn && nextBtn.click();
  });

  function updateShowMore() {
    // Show button only if there are more than initial tiles
    showMoreBtn.hidden = allItems.length <= INITIAL_MAX;
    showMoreBtn.textContent = expanded ? 'Show Less' : 'Show More';
  }

  async function renderChunk(count){
    const end = Math.min(nextIndex + count, allItems.length);
    for (let i = nextIndex; i < end; i++) {
      // eslint-disable-next-line no-await-in-loop
      const card = makeCard(allItems[i]);
      grid.appendChild(card);
    }
    nextIndex = end;
    updateShowMore();
  }

  // Initial render
  renderChunk(INITIAL_MAX);

  showMoreBtn.onclick = async () => {
    if (!expanded) {
      // Expand: render remaining items
      const firstNewIndex = nextIndex;
      await renderChunk(allItems.length - nextIndex);
      expanded = true;
      updateShowMore();
      const firstNew = grid.children[firstNewIndex];
      if (firstNew) {
        try { firstNew.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) { firstNew.scrollIntoView(); }
      }
    } else {
      // Collapse back to initial tiles
      grid.innerHTML = '';
      nextIndex = 0;
      await renderChunk(INITIAL_MAX);
      expanded = false;
      updateShowMore();
      try { grid.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) { grid.scrollIntoView(); }
    }
  };
}

// Forms
function initForms() {
  const contact = $('#contact-form');
  if (contact) {
    // Allow native submission to external service (FormSubmit)
  }
  const careers = $('#careers-form');
  if (careers) {
    // Allow native submission to external service (FormSubmit)
  }
}

// Sustainability & CSR
function initSustainability() {
  const grid = document.querySelector('#sustainability-grid');
  if (!grid) return;

  // If static images already present, enhance with modal viewing; else, attempt auto-discovery
  const staticImgs = Array.from(grid.querySelectorAll('img'));

  // Build slides by probing folder numerically if needed
  async function discoverSlides() {
    // Try known folder name
    const base = 'Sustainability and CSR';
    const slides = await collectSlides(base, 100);
    return slides && slides.length ? slides : staticImgs.map(img => img.src);
  }

  // Create a simple modal (reuse generic structure from CSS classes)
  let modal = document.getElementById('sustainability-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'sustainability-modal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-labelledby', 'sustainability-modal-title');
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <div class="modal-backdrop" data-close="modal"></div>
      <div class="modal-content">
        <button class="modal-close" aria-label="Close" data-close="modal">&times;</button>
        <h3 id="sustainability-modal-title">Sustainability & CSR</h3>
        <div class="modal-nav">
          <button class="slide-nav prev" aria-label="Previous image">&#10094;</button>
          <div class="slides-container"></div>
          <button class="slide-nav next" aria-label="Next image">&#10095;</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  const slidesContainer = modal.querySelector('.slides-container');
  const prevBtn = modal.querySelector('.slide-nav.prev');
  const nextBtn = modal.querySelector('.slide-nav.next');
  const modalTitle = document.getElementById('sustainability-modal-title');
  let currentSlides = [];
  let currentSlideIndex = 0;

  function renderSlide() {
    if (!slidesContainer || !currentSlides.length) return;
    slidesContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = currentSlides[currentSlideIndex] || NEUTRAL_PLACEHOLDER;
    img.alt = (modalTitle && modalTitle.textContent) ? modalTitle.textContent : 'Sustainability image';
    img.loading = 'eager';
    slidesContainer.appendChild(img);
  }

  function openModal(title, slides) {
    if (title && modalTitle) modalTitle.textContent = title;
    currentSlides = slides && slides.length ? slides : [NEUTRAL_PLACEHOLDER];
    currentSlideIndex = 0;
    renderSlide();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  prevBtn.addEventListener('click', () => {
    if (!currentSlides.length) return;
    currentSlideIndex = (currentSlideIndex - 1 + currentSlides.length) % currentSlides.length;
    renderSlide();
  });
  nextBtn.addEventListener('click', () => {
    if (!currentSlides.length) return;
    currentSlideIndex = (currentSlideIndex + 1) % currentSlides.length;
    renderSlide();
  });
  modal.querySelectorAll('[data-close="modal"]').forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (modal.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });

  // Hook each tile to open modal; if no tiles, still open modal with discovered slides
  const clickHandler = async () => {
    const slides = await discoverSlides();
    openModal('Sustainability & CSR', slides);
  };

  if (staticImgs.length) {
    staticImgs.forEach(img => {
      const parent = img.closest('.project-card') || img;
      parent.style.cursor = 'pointer';
      parent.addEventListener('click', clickHandler);
      parent.setAttribute('role','button');
      parent.tabIndex = 0;
      parent.addEventListener('keypress', (e) => { if (e.key === 'Enter') clickHandler(); });
    });
  } else {
    // If empty grid, add a placeholder card
    const card = document.createElement('div');
    card.className = 'project-card';
    const img = document.createElement('img');
    img.src = NEUTRAL_PLACEHOLDER;
    img.alt = 'Sustainability';
    card.appendChild(img);
    grid.appendChild(card);
    card.addEventListener('click', clickHandler);
  }
}

function initSocialDrawer() {
  const drawer = document.querySelector('.social-drawer');
  if (!drawer) return;
  const toggle = drawer.querySelector('.social-drawer-toggle');
  const panel = drawer.querySelector('.social-drawer-panel');
  if (!toggle || !panel) return;
  // default label
  toggle.setAttribute('aria-label', 'Draw out social drawer');
  function openDrawer() {
    drawer.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label', 'Draw in social drawer');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label', 'Draw out social drawer');
  }
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeDrawer() : openDrawer();
  });
  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  initNav();
  initCounters();
  // Parallax disabled site-wide
  // initParallaxSections();
  // initParallaxCssVars();
  initReveal();
  initScrollProgress();
  if ($('#projects-grid')) initProjects();
  if ($('#services-grid')) initServices();
  if ($('#clients-grid')) initClients();
  if (document.getElementById('sustainability-grid')) initSustainability();
  if (document.getElementById('newsroom-grid')) initNewsroom();
  initSocialDrawer();
  // Timeline now uses a framed fullscreen image; skip JS auto-fill
  // if (document.getElementById('history') && document.getElementById('timeline')) initHistoryTimeline();
});

function initHistoryTimeline(){
  const historyEl = document.querySelector('#history .container p');
  const timelineList = document.querySelector('#timeline .timeline');
  if(!historyEl && !timelineList) return;
  fetch('History/timeline_extracted.json', {cache:'no-store'})
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load timeline_extracted.json')))
    .then(data => {
      if(data && data.history_summary && historyEl){
        historyEl.textContent = data.history_summary;
      }
      if(data && Array.isArray(data.events) && data.events.length && timelineList){
        timelineList.innerHTML = data.events.map(ev => {
          const year = ev.year || '';
          const text = ev.text || '';
          return `<li><span>${year}</span> ${text}</li>`;
        }).join('');
      }
    })
    .catch(() => {/* keep existing static content as fallback */});
}


function initParallaxCssVars() {
  // Parallax disabled: clear variables and skip adding scroll listeners
  const root = document.documentElement;
  root.style.setProperty('--pY', '0');
  root.style.setProperty('--heroPY', '0');
}