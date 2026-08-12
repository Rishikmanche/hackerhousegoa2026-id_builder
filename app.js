/**
 * HACKER HOUSE GOA 2026 — #FRAMEINGOA GENERATOR ENGINE
 * Vanilla ES6 JavaScript + HTML5 Canvas API
 * Master Immutable Artwork Architecture
 */

// ponytail: polyfill ctx.roundRect for Safari < 15.4 / Chrome < 99
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    const R = Math.min(r, w / 2, h / 2);
    this.moveTo(x + R, y);
    this.lineTo(x + w - R, y);
    this.quadraticCurveTo(x + w, y, x + w, y + R);
    this.lineTo(x + w, y + h - R);
    this.quadraticCurveTo(x + w, y + h, x + w - R, y + h);
    this.lineTo(x + R, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - R);
    this.lineTo(x, y + R);
    this.quadraticCurveTo(x, y, x + R, y);
    this.closePath();
    return this;
  };
}

// ponytail: keep state minimal and centralized
const state = {
  mode: 'id', // 'id' | 'pfp' | 'team'
  isFlipped: false,
  
  // Single photo mode (PFP / Builder ID)
  photoImg: null,
  transform: { x: 0, y: 0, scale: 1.0 },
  
  // Team mode (3 photos)
  teamPhotos: [null, null, null],
  teamTransforms: [
    { x: 0, y: 0, scale: 1.0 },
    { x: 0, y: 0, scale: 1.0 },
    { x: 0, y: 0, scale: 1.0 }
  ],
  activeTeamSlot: 0,
  
  // Builder ID fields
  name: 'ELON MUSK',
  handle: '@elonmusk',
  role: 'PARTICIPANT',
  builderTitle: 'LATENCY SHAMAN',
  cardId: 'HHG26-001',
  
  // Team mode fields
  teamName: 'TEAM HYPERDRIVE',
  
  // Dragging state
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  initialTransform: { x: 0, y: 0 }
};

// Builder title pool (40+ fun creative titles)
const BUILDER_TITLES = [
  'LATENCY SHAMAN',
  'API ALCHEMIST',
  'CODE NOMAD',
  'DEBUGGING DRIFTER',
  'SYSTEM WIZARD',
  'BYTE SORCERER',
  'CONSENSUS GHOST',
  'KERNEL ARCHITECT',
  'GPU WHISPERER',
  'CACHE MYSTIC',
  'THREAD WEAVER',
  'ALGO PROPHET',
  'ASYNC WARLOCK',
  'STACK CRUSADER',
  'MEMPOOL MONK',
  'ZERO-DAY DRIFTER',
  'BYTE DRIFTER',
  'BIT MANIPULATOR',
  'RUSTIC BLACKSMITH',
  'PACKET PALADIN',
  'SYNTAX SAMURAI',
  'RUNTIME RUNNER',
  'PIPELINE PILOT',
  'VECTOR VOID',
  'SHARDING SHADOW'
];

// Asset cache
const assets = {
  idMaster: new Image(),
  idBackMaster: new Image(),
  pfpMaster: new Image(),
  sunHorizon: new Image(),
  sampleAvatar: new Image()
};

// Preload master artwork
function preloadAssets() {
  assets.idMaster.src = 'assets/id/id-master.png';
  assets.idBackMaster.src = 'assets/id/id-back-master.png';
  assets.pfpMaster.src = 'assets/pfp/pfp-master.png';
  assets.sunHorizon.src = 'assets/brand/official-sun-horizon.png';
  assets.sampleAvatar.src = 'assets/id/sample-avatar.png';

  assets.sampleAvatar.onerror = () => {
    if (assets.sampleAvatar.src.endsWith('.png')) {
      assets.sampleAvatar.src = 'assets/id/sample-avatar.jpeg';
    }
  };

  // Always initialize with sample demo photo
  assets.sampleAvatar.onload = () => {
    if (!state.photoImg) {
      state.photoImg = assets.sampleAvatar;
    }
    if (!state.teamPhotos[0]) state.teamPhotos[0] = assets.sampleAvatar;
    if (!state.teamPhotos[1]) state.teamPhotos[1] = assets.sampleAvatar;
    if (!state.teamPhotos[2]) state.teamPhotos[2] = assets.sampleAvatar;
    renderCanvas();
  };

  assets.idMaster.onload = () => renderCanvas();
  assets.pfpMaster.onload = () => renderCanvas();
  assets.sunHorizon.onload = () => renderCanvas();
}

// DOM Elements
let canvas, ctx;
let zoomSlider, zoomValText;
let cardFlipper, flipBtn, flipLabel;
let toastContainer;

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('main-canvas');
  ctx = canvas.getContext('2d');
  
  zoomSlider = document.getElementById('zoom-slider');
  zoomValText = document.getElementById('zoom-val-text');
  cardFlipper = document.getElementById('card-flipper');
  flipBtn = document.getElementById('btn-flip-card');
  flipLabel = document.getElementById('flip-label');
  toastContainer = document.getElementById('toast-container');

  // Sticky header background transition on scroll
  window.addEventListener('scroll', () => {
    const header = document.getElementById('site-header');
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }
  });

  // Mobile navigation menu toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Smooth scroll and active state handler for all internal anchor links (#...)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        // Close mobile nav if open
        if (navLinks) navLinks.classList.remove('mobile-open');

        let targetY = 0;
        if (targetId !== '#hero') {
          const headerOffset = 85;
          targetY = Math.max(0, targetElement.offsetTop - headerOffset);
        }

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        // Update active class on nav links
        document.querySelectorAll('.nav-link').forEach(nl => {
          nl.classList.toggle('active', nl.getAttribute('href') === targetId);
        });
      }
    });
  });

  // Scrollspy: update active nav link on page scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = '#' + section.getAttribute('id');
      }
    });
    if (currentId) {
      document.querySelectorAll('.nav-link').forEach(nl => {
        nl.classList.toggle('active', nl.getAttribute('href') === currentId);
      });
    }
  });

  preloadAssets();
  initEventListeners();
  renderCanvas();
});

// Event Listeners setup
function initEventListeners() {
  // Mode selection tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const mode = tab.dataset.mode;
      setMode(mode);
    });
  });

  // Format selection cards — bind to card only; button stops propagation to avoid double-fire (#7)
  document.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const mode = card.dataset.mode;
      if (mode) {
        setMode(mode);
        document.getElementById('studio').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  document.querySelectorAll('.btn-format-select').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });

  // Flip 3D Card Toggle
  if (flipBtn) {
    flipBtn.addEventListener('click', () => {
      state.isFlipped = !state.isFlipped;
      cardFlipper.classList.toggle('flipped', state.isFlipped);
      flipLabel.textContent = state.isFlipped ? 'Flip to Front' : 'Flip to Back';
    });
  }

  // Reset Zoom & Pan
  document.getElementById('btn-reset-transform').addEventListener('click', () => {
    if (state.mode === 'team') {
      state.teamTransforms[state.activeTeamSlot] = { x: 0, y: 0, scale: 1.0 };
    } else {
      state.transform = { x: 0, y: 0, scale: 1.0 };
    }
    zoomSlider.value = 1.0;
    zoomValText.textContent = '100%';
    renderCanvas();
    showToast('Photo position & zoom reset');
  });

  // Zoom Slider
  zoomSlider.addEventListener('input', (e) => {
    const scale = parseFloat(e.target.value);
    zoomValText.textContent = `${Math.round(scale * 100)}%`;
    if (state.mode === 'team') {
      state.teamTransforms[state.activeTeamSlot].scale = scale;
    } else {
      state.transform.scale = scale;
    }
    renderCanvas();
  });

  // Load Demo Photo Button
  document.getElementById('btn-load-sample').addEventListener('click', () => {
    state.photoImg = assets.sampleAvatar;
    state.teamPhotos = [assets.sampleAvatar, assets.sampleAvatar, assets.sampleAvatar];
    state.transform = { x: 0, y: 0, scale: 1.0 };
    state.teamTransforms = [
      { x: 0, y: 0, scale: 1.0 },
      { x: 0, y: 0, scale: 1.0 },
      { x: 0, y: 0, scale: 1.0 }
    ];
    zoomSlider.value = 1.0;
    zoomValText.textContent = '100%';
    renderCanvas();
    showToast('Loaded demo portrait ✨');
  });

  // Single Photo Upload — clean click isolation and value reset
  const photoInput = document.getElementById('file-photo-input');
  const photoDropzone = document.getElementById('photo-dropzone');

  if (photoDropzone && photoInput) {
    photoDropzone.addEventListener('click', (e) => {
      if (e.target !== photoInput) {
        photoInput.value = '';
        photoInput.click();
      }
    });
    photoInput.addEventListener('click', (e) => e.stopPropagation());
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileUpload(e.target.files[0]);
      }
    });
  }

  // Drag & Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    photoDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      photoDropzone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    photoDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      photoDropzone.classList.remove('drag-over');
    });
  });
  photoDropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  // Paste from clipboard — guard: don't intercept when user is typing in a field (#10)
  window.addEventListener('paste', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        handleFileUpload(file);
        showToast('Image pasted from clipboard 📋');
        break;
      }
    }
  });

  // Team Photo Slots — with active slot selection (#6)
  [0, 1, 2].forEach(slotIndex => {
    const slotInput = document.getElementById(`team-file-${slotIndex}`);
    const slotBox = document.getElementById(`slot-box-${slotIndex}`);
    
    slotBox.addEventListener('click', (e) => {
      selectTeamSlot(slotIndex);
      // Double click or click when already active opens file chooser
      slotInput.click();
    });

    slotInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            state.teamPhotos[slotIndex] = img;
            slotBox.classList.add('has-photo');
            selectTeamSlot(slotIndex);
            renderCanvas();
            showToast(`Teammate ${slotIndex + 1} photo uploaded!`);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  });

  // Interactive Canvas Pan/Drag
  canvas.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);

  // Touch Support — preventDefault stops page scroll while dragging photo (#15)
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      startDrag(e.touches[0]);
    }
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (state.isDragging && e.touches.length === 1) {
      e.preventDefault();
      onDrag(e.touches[0]);
    }
  }, { passive: false });
  window.addEventListener('touchend', endDrag);

  // Mouse Wheel Zoom on Canvas
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const currentScale = state.mode === 'team' 
      ? state.teamTransforms[state.activeTeamSlot].scale 
      : state.transform.scale;
    const newScale = Math.max(0.5, Math.min(2.5, currentScale + delta));
    
    zoomSlider.value = newScale;
    zoomValText.textContent = `${Math.round(newScale * 100)}%`;
    if (state.mode === 'team') {
      state.teamTransforms[state.activeTeamSlot].scale = newScale;
    } else {
      state.transform.scale = newScale;
    }
    renderCanvas();
  }, { passive: false });

  // Text input listeners (Live Instant Preview)
  bindInput('input-name', (val) => { state.name = val.toUpperCase(); renderCanvas(); });
  bindInput('input-handle', (val) => { state.handle = val; renderCanvas(); });
  bindInput('input-builder-title', (val) => { state.builderTitle = val.toUpperCase(); renderCanvas(); });
  bindInput('input-card-id', (val) => { state.cardId = val.toUpperCase(); renderCanvas(); });
  bindInput('input-team-name', (val) => { state.teamName = val.toUpperCase(); renderCanvas(); });
  // <select> fires 'change', not 'input' — bind separately (#3)
  const roleEl = document.getElementById('input-role');
  if (roleEl) roleEl.addEventListener('change', (e) => { state.role = e.target.value; renderCanvas(); });

  // Reroll Builder Title
  document.getElementById('btn-reroll-title').addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * BUILDER_TITLES.length);
    const newTitle = BUILDER_TITLES[randomIndex];
    state.builderTitle = newTitle;
    document.getElementById('input-builder-title').value = newTitle;
    renderCanvas();
    showToast(`Class rolled: ${newTitle} 🎲`);
  });

  // Randomize Pass ID
  document.getElementById('btn-reroll-id').addEventListener('click', () => {
    const num = String(Math.floor(Math.random() * 247) + 1).padStart(3, '0');
    const newId = `HHG26-${num}`;
    state.cardId = newId;
    document.getElementById('input-card-id').value = newId;
    renderCanvas();
  });



  // Download Action
  document.getElementById('btn-download-png').addEventListener('click', downloadPNG);

  // Share to X Action
  document.getElementById('btn-share-x').addEventListener('click', shareToX);

  // Copy to Clipboard Action
  document.getElementById('btn-copy-clipboard').addEventListener('click', copyToClipboard);
}

// Bind text input helper
function bindInput(id, callback) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', (e) => callback(e.target.value));
  }
}

// Handle File Upload
function handleFileUpload(file) {
  if (!file.type.match('image.*')) {
    showToast('Please select a valid image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      if (state.mode === 'team') {
        state.teamPhotos[state.activeTeamSlot] = img;
        document.getElementById(`slot-box-${state.activeTeamSlot}`).classList.add('has-photo');
      } else {
        state.photoImg = img;
        state.transform = { x: 0, y: 0, scale: 1.0 };
        zoomSlider.value = 1.0;
        zoomValText.textContent = '100%';
      }
      renderCanvas();
      showToast('Photo updated successfully! ✨');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Returns ratio of canvas internal px to displayed CSS px (#4)
// e.g. if canvas is 741px wide but CSS-scaled to 350px → ratio = 741/350 ≈ 2.1
function canvasPixelRatio() {
  const rect = canvas.getBoundingClientRect();
  return rect.width > 0 ? canvas.width / rect.width : 1;
}

// Drag & Pan handlers
function startDrag(e) {
  state.isDragging = true;
  state.dragStart = { x: e.clientX, y: e.clientY };
  if (state.mode === 'team') {
    state.initialTransform = { ...state.teamTransforms[state.activeTeamSlot] };
  } else {
    state.initialTransform = { ...state.transform };
  }
}

function onDrag(e) {
  if (!state.isDragging) return;
  const ratio = canvasPixelRatio();
  const dx = (e.clientX - state.dragStart.x) * ratio;
  const dy = (e.clientY - state.dragStart.y) * ratio;
  
  if (state.mode === 'team') {
    state.teamTransforms[state.activeTeamSlot].x = state.initialTransform.x + dx;
    state.teamTransforms[state.activeTeamSlot].y = state.initialTransform.y + dy;
  } else {
    state.transform.x = state.initialTransform.x + dx;
    state.transform.y = state.initialTransform.y + dy;
  }
  renderCanvas();
}

function endDrag() {
  state.isDragging = false;
}

// Select and highlight active team slot (#6)
function selectTeamSlot(slotIndex) {
  state.activeTeamSlot = slotIndex;
  [0, 1, 2].forEach(i => {
    const box = document.getElementById(`slot-box-${i}`);
    if (box) box.classList.toggle('active-slot', i === slotIndex);
  });
  // Sync zoom slider to selected slot scale
  if (zoomSlider && zoomValText) {
    const scale = state.teamTransforms[slotIndex].scale;
    zoomSlider.value = scale;
    zoomValText.textContent = `${Math.round(scale * 100)}%`;
  }
}

// Switch Creation Mode
function setMode(mode) {
  state.mode = mode;
  
  // Update mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  // Toggle mode-specific control fields
  const isId = (mode === 'id');
  const isPfp = (mode === 'pfp');
  const isTeam = (mode === 'team');

  document.getElementById('fields-builder-id').style.display = isId ? 'block' : 'none';
  const pfpFields = document.getElementById('fields-pfp');
  if (pfpFields) pfpFields.style.display = isPfp ? 'block' : 'none';
  document.getElementById('group-single-photo').style.display = isTeam ? 'none' : 'block';
  document.getElementById('group-team-photos').style.display = isTeam ? 'block' : 'none';
  document.getElementById('group-team-name').style.display = isTeam ? 'block' : 'none';

  if (isTeam) {
    selectTeamSlot(state.activeTeamSlot);
  } else {
    // Sync zoom slider to single photo scale
    if (zoomSlider && zoomValText) {
      zoomSlider.value = state.transform.scale;
      zoomValText.textContent = `${Math.round(state.transform.scale * 100)}%`;
    }
  }

  // Toggle flip tool
  if (flipBtn) {
    flipBtn.style.display = isId ? 'inline-flex' : 'none';
    if (!isId && state.isFlipped) {
      state.isFlipped = false;
      cardFlipper.classList.remove('flipped');
    }
  }

  // Update canvas dimensions label — match actual canvas output size (#2)
  const dimLabel = document.getElementById('canvas-dim-label');
  if (mode === 'pfp') dimLabel.textContent = '1080 × 1080 PNG (PFP Frame)';
  else if (mode === 'id') dimLabel.textContent = '760 × 1035 PNG (VIP Builder ID)';
  else if (mode === 'team') dimLabel.textContent = '1400 × 800 PNG (Squad Pass)';

  renderCanvas();
}

/* ==========================================================================
   CANVAS RENDERING ENGINE (Master Immutable Artwork Architecture)
   ========================================================================== */
function renderCanvas() {
  if (!canvas || !ctx) return;

  if (state.mode === 'id') {
    renderBuilderId();
  } else if (state.mode === 'pfp') {
    renderPfpFrame();
  } else if (state.mode === 'team') {
    renderTeamFrame();
  }
}

// 01 — BUILDER ID RENDERER (Flagship VIP Pass — 760 × 1035 Master Template)
function renderBuilderId() {
  const W = 760;
  const H = 1035;
  canvas.width = W;
  canvas.height = H;

  // 1. Draw Master Base Card Artwork (from real.png)
  if (assets.idMaster.complete && assets.idMaster.naturalWidth > 0) {
    ctx.drawImage(assets.idMaster, 0, 0, W, H);
  } else {
    // Fallback background green
    ctx.fillStyle = '#0C3823';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Draw User Photo clipped to calibrated circle matching reference composition
  // Photo circle: Center (502, 630), Radius = 190 (Bounding Box: X=312..692, Y=440..820)
  const photo = state.photoImg || assets.sampleAvatar;
  const cx = 502;
  const cy = 630;
  const r = 190;

  if (photo && photo.complete && photo.naturalWidth > 0) {
    ctx.save();
    
    // Create Circular Mask
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw photo with pan & zoom (ensuring full coverage of circle)
    const scale = state.transform.scale;
    const aspect = photo.naturalHeight / photo.naturalWidth;
    let baseW, baseH;
    if (aspect >= 1) {
      baseW = (r * 2.2) * scale;
      baseH = baseW * aspect;
    } else {
      baseH = (r * 2.2) * scale;
      baseW = baseH / aspect;
    }
    const drawX = cx - baseW / 2 + state.transform.x;
    const drawY = cy - baseH / 2 + state.transform.y;

    ctx.drawImage(photo, drawX, drawY, baseW, baseH);
    ctx.restore();

    // Draw crisp golden inner ring over photo edge
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#F5B601';
    ctx.stroke();
  }

  // 3. Draw Dynamic Typography & Badges with official pink headings
  const leftX = 43;

  // A. NAME HEADING & VALUE
  ctx.save();
  ctx.fillStyle = '#FF2A85';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('NAME', leftX, 471);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 36px "Space Grotesk", sans-serif';
  const name = state.name || 'ELON MUSK';
  const words = name.split(' ');
  if (words.length > 1 && name.length > 12) {
    ctx.fillText(words[0], leftX, 497);
    ctx.fillText(words.slice(1).join(' '), leftX, 545);
  } else {
    ctx.fillText(name, leftX, 502);
  }
  ctx.restore();

  // B. ROLE HEADING & VALUE
  ctx.save();
  ctx.fillStyle = '#FF2A85';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ROLE', leftX, 600);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 19px "Space Grotesk", sans-serif';
  ctx.fillText(state.role || 'PARTICIPANT', leftX, 624);
  ctx.restore();

  // C. HANDLE HEADING & VALUE
  ctx.save();
  ctx.fillStyle = '#FF2A85';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('HANDLE', leftX, 688);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 17px "JetBrains Mono", monospace';
  ctx.fillText(state.handle || '@elonmusk', leftX, 712);
  ctx.restore();

  // D. BUILDER TITLE / CLASS BADGE
  ctx.save();
  const titleText = `✦ ${state.builderTitle || 'LATENCY SHAMAN'}`;
  ctx.font = '800 12px "JetBrains Mono", monospace';
  const titleW = ctx.measureText(titleText).width + 20;
  
  // Pill background
  ctx.fillStyle = 'rgba(255, 42, 133, 0.95)';
  ctx.beginPath();
  ctx.roundRect(leftX, 746, Math.min(270, titleW), 28, 6);
  ctx.fill();
  ctx.strokeStyle = '#F5B601';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, leftX + 10, 760);
  ctx.restore();

  // E. PASS ID HEADING & VALUE
  ctx.save();
  ctx.fillStyle = '#FF2A85';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('PASS ID', leftX, 788);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 17px "JetBrains Mono", monospace';
  ctx.fillText(state.cardId || 'HHG26-001', leftX, 806);
  ctx.restore();

  // F. CRISP VECTOR BARCODE (Width: 290px, Height: 54px)
  renderBarcode(ctx, leftX, 836, 290, 54, state.cardId || 'HHG26-001');

  // G. #FRAMEINGOA Tag in bottom right
  ctx.save();
  ctx.fillStyle = '#F5B601';
  ctx.font = '800 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('#FRAMEINGOA', W - 38, H - 28);
  ctx.restore();
}

// 02 — PFP FRAME RENDERER (1080 × 1080 Square Avatar)
function renderPfpFrame() {
  const S = 1080; // true 1080×1080 output (#2)
  canvas.width = S;
  canvas.height = S;

  const CX = S / 2; // 540
  const CY = S / 2; // 540
  const R = 410;    // photo circle radius

  // 1. Dark background
  ctx.fillStyle = '#072414';
  ctx.fillRect(0, 0, S, S);

  // 2. Draw User Photo clipped to central circle (or fallback to sample demo photo)
  const photo = state.photoImg || assets.sampleAvatar;
  if (photo && photo.complete && photo.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = state.transform.scale;
    const baseSize = R * 2.4 * scale;
    const aspect = photo.naturalHeight / photo.naturalWidth;
    const drawW = baseSize;
    const drawH = baseSize * aspect;
    const drawX = CX - drawW / 2 + state.transform.x;
    const drawY = CY - drawH / 2 + state.transform.y;

    ctx.drawImage(photo, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // 3. Draw Master PFP Frame Overlay if loaded; else code-drawn fallback (#1)
  if (assets.pfpMaster.complete && assets.pfpMaster.naturalWidth > 0) {
    ctx.drawImage(assets.pfpMaster, 0, 0, S, S);
  } else {
    drawPfpFallbackFrame(S, CX, CY, R);
  }
}

// Code-drawn PFP frame — used when pfp-master.png is unavailable (#1)
function drawPfpFallbackFrame(S, CX, CY, R) {
  // Outer decorative ring
  ctx.beginPath();
  ctx.arc(CX, CY, R + 18, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#F5B601';
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(CX, CY, R + 4, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(245,182,1,0.5)';
  ctx.stroke();

  // Corner accent arcs (top-left, top-right, bottom-left, bottom-right)
  const accents = [{ a: -Math.PI * 0.85, b: -Math.PI * 0.65 }, { a: -Math.PI * 0.35, b: -Math.PI * 0.15 }, { a: Math.PI * 0.15, b: Math.PI * 0.35 }, { a: Math.PI * 0.65, b: Math.PI * 0.85 }];
  accents.forEach(({ a, b }) => {
    ctx.beginPath();
    ctx.arc(CX, CY, R + 30, a, b);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FF2A85';
    ctx.stroke();
  });

  // Bottom pill: event name
  ctx.save();
  ctx.fillStyle = 'rgba(5,25,14,0.88)';
  ctx.beginPath();
  ctx.roundRect(CX - 200, S - 140, 400, 100, 16);
  ctx.fill();
  ctx.strokeStyle = '#F5B601';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#F5B601';
  ctx.font = '800 28px "Syne", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HACKER HOUSE GOA 2026', CX, S - 108);

  ctx.fillStyle = '#FF2A85';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('#FRAMEINGOA · OCT 28–31', CX, S - 72);
  ctx.restore();

  // Top badge: 247
  ctx.save();
  ctx.fillStyle = '#F5B601';
  ctx.beginPath();
  ctx.arc(CX, 68, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#05190e';
  ctx.font = '900 26px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('247', CX, 68);
  ctx.restore();
}

// 03 — TEAM FRAME RENDERER (Widescreen Squad Pass)
function renderTeamFrame() {
  const W = 1400;
  const H = 800;
  canvas.width = W;
  canvas.height = H;

  // 1. Draw Goan beach / horizon backdrop
  if (assets.sunHorizon.complete && assets.sunHorizon.naturalWidth > 0) {
    ctx.drawImage(assets.sunHorizon, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#072818';
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay gradient for contrast
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(5, 25, 14, 0.4)');
  grad.addColorStop(0.5, 'rgba(5, 25, 14, 0.6)');
  grad.addColorStop(1, 'rgba(3, 16, 9, 0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 2. Top Header Brand Lockup
  ctx.save();
  ctx.fillStyle = '#F5B601';
  ctx.font = '900 36px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HACKER HOUSE GOA 2026', W / 2, 75);

  ctx.fillStyle = '#FF2A85';
  ctx.font = '800 20px "Space Grotesk", sans-serif';
  ctx.fillText(`✦ SQUAD PASS · ${state.teamName || 'TEAM HYPERDRIVE'} ✦`, W / 2, 115);

  ctx.fillStyle = '#A3C5B2';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillText('GOA, INDIA · 28 – 31 OCT 2026 · 247 BUILDERS', W / 2, 145);
  ctx.restore();

  // 3. Three Circular Builder Portals
  const portals = [
    { cx: 330, cy: 450, r: 155, label: 'BUILDER 1' },
    { cx: 700, cy: 420, r: 185, label: 'LEAD BUILDER' },
    { cx: 1070, cy: 450, r: 155, label: 'BUILDER 3' }
  ];

  portals.forEach((p, i) => {
    const photo = state.teamPhotos[i] || state.photoImg || assets.sampleAvatar;
    const transform = state.teamTransforms[i];

    ctx.save();
    // Circular clip
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (photo && photo.complete && photo.naturalWidth > 0) {
      const scale = transform.scale;
      const baseW = (p.r * 2.3) * scale;
      const baseH = baseW * (photo.naturalHeight / photo.naturalWidth);
      const drawX = p.cx - baseW / 2 + transform.x;
      const drawY = p.cy - baseH / 2 + transform.y;
      ctx.drawImage(photo, drawX, drawY, baseW, baseH);
    } else {
      ctx.fillStyle = '#0e3822';
      ctx.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
    }
    ctx.restore();

    // Portal Rings & Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.lineWidth = i === 1 ? 6 : 4;
    ctx.strokeStyle = i === 1 ? '#FF2A85' : '#F5B601';
    ctx.stroke();

    // Member Label Pill below circle
    ctx.fillStyle = i === 1 ? '#FF2A85' : 'rgba(245, 182, 1, 0.9)';
    ctx.beginPath();
    ctx.roundRect(p.cx - 75, p.cy + p.r - 16, 150, 32, 16);
    ctx.fill();

    ctx.fillStyle = '#072414';
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, p.cx, p.cy + p.r);
    ctx.restore();
  });

  // 4. Footer Brand Strip
  ctx.save();
  ctx.fillStyle = '#F5B601';
  ctx.font = '800 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('2:47 PM STUDIO', 60, H - 40);

  ctx.textAlign = 'right';
  ctx.fillText('#FRAMEINGOA · HHGOA.COM', W - 60, H - 40);
  ctx.restore();
}

// Crisp Vector Barcode Generator (Code 39 standard in #F5B601)
const CODE39_MAP = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101'
};

function renderBarcode(ctx, x, y, width, height, text) {
  ctx.save();
  ctx.fillStyle = '#F5B601';

  const cleanText = '*' + (text || 'HHG26-001').toUpperCase().replace(/[^0-9A-Z\-\. ]/g, '') + '*';
  let bitPattern = '';
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    bitPattern += (CODE39_MAP[char] || CODE39_MAP['*']) + '0';
  }

  const moduleWidth = width / bitPattern.length;
  for (let i = 0; i < bitPattern.length; i++) {
    if (bitPattern[i] === '1') {
      ctx.fillRect(x + i * moduleWidth, y, Math.max(1, moduleWidth * 0.95), height);
    }
  }
  ctx.restore();
}

/* ==========================================================================
   EXPORT & SHARING PIPELINE
   ========================================================================== */

// 1. Download High-Res PNG
function downloadPNG() {
  const link = document.createElement('a');
  const filename = state.mode === 'id' 
    ? `HHGoa2026_ID_${(state.name || 'Builder').replace(/\s+/g, '_')}.png`
    : state.mode === 'pfp'
    ? 'HHGoa2026_PFP_Frame.png'
    : `HHGoa2026_Squad_${(state.teamName || 'Team').replace(/\s+/g, '_')}.png`;

  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();

  showToast(`Downloaded ${filename} ✦`);
}

// 2. Share to X (Twitter) — no forced download (#8); user can download separately
function shareToX() {
  const modeText = state.mode === 'id' 
    ? `Claimed my VIP Builder ID (${state.cardId || 'HHG26-001'}) as a ${state.builderTitle || 'Latency Shaman'}!`
    : state.mode === 'pfp'
    ? 'Locked in my official HH Goa 2026 PFP Frame!'
    : `Squad pass generated for ${state.teamName || 'our team'}!`;

  const tweetText = `Just generated my official Hacker House Goa 2026 graphic 🌴⚡\n\n${modeText}\n\nOct 28–31 · Goa, India · 247 Builders\n\nGenerate yours: https://id-genrator-hhgoa26.vercel.app\n\n#FrameInGoa #HackerHouseGoa`;

  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  window.open(intentUrl, '_blank', 'noopener,noreferrer');

  showToast('Download your PNG first, then attach it to the tweet 🚀');
}

// 3. Copy to Clipboard
function copyToClipboard() {
  canvas.toBlob((blob) => {
    if (!blob) {
      showToast('Could not generate image blob');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.write) {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(() => {
        showToast('Image copied to clipboard! 📋');
      }).catch(() => {
        downloadPNG();
      });
    } else {
      downloadPNG();
    }
  }, 'image/png');
}

// Toast notification helper
function showToast(message) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🌴</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
}
