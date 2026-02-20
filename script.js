const categories = ['architecture','scenography','interior','object'];

const imageNames = [
    { src: 'me01.png', title: 'alina pinardi', ph: '' },
    { src: 'DSC_0168.jpg', title: '01 / fragment', ph: 'arthur heck' },
    { src: '_DSC0022.jpg', title: '02 / movement', ph: 'arthur heck' },
    { src: '_DSC0048.jpg', title: '03 / light', ph: 'arthur heck' },
    { src: '_DSC0065_R.jpg', title: '04 / structure', ph: 'arthur heck' },
    { src: '_DSC5821.jpg', title: '05 / shadow', ph: 'arthur heck' },
    { src: '_DSC5840.jpg', title: '06 / form', ph: 'arthur heck' },
    { src: '_DSC5846.jpg', title: '07 / detail', ph: 'arthur heck' },
    { src: '_DSC5858.jpg', title: '08 / urban', ph: 'arthur heck' },
    { src: '_DSC9619.jpg', title: '09 / sequence', ph: 'arthur heck' }
];

const world = document.getElementById('image-world');
const canvas = document.getElementById('canvas');
const bgCanvas = document.getElementById('noise-bg');
const ctx = bgCanvas.getContext('2d');

let scale = 0.35; 
let pos = { x: 0, y: 0 };
let isPanning = false;
let isDraggingImg = false;
let currentDraggedImg = null;
let start = { x: 0, y: 0 };
let highestZ = 100;
let activeCategory = null; // currently selected HUD category

// BACKGROUND NOISE
let dots = [];
function initBackground() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    dots = [];
    for (let i = 0; i < 2000; i++) {
        dots.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            vx: Math.random() * 5, vy: Math.random() * 5,
            size: Math.random() * 0.7 + 0.3
        });
    }
}

function animateBackground() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const time = Date.now() * 0.0002; 
    dots.forEach(dot => {
        const dx = Math.sin(time + dot.vx) * 40;
        const dy = Math.cos(time + dot.vy) * 40;
        ctx.beginPath();
        ctx.arc(dot.x + dx, dot.y + dy, dot.size, 0, Math.PI * 2);
        ctx.fill();
    });
    requestAnimationFrame(animateBackground);
}

// WORLD INIT
function init() {
    const spacingX = 900;
    const spacingY = 900;
    const cols = 3;

    imageNames.forEach((data, index) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        const randomWidth = Math.floor(Math.random() * 450) + 300;
        container.style.width = randomWidth + 'px';
        
        // skip category assignment for me01.png
        if (data.src !== 'me01.png') {
            const rndCat = categories[Math.floor(Math.random() * categories.length)];
            container.dataset.category = rndCat;
            container.setAttribute('data-category', rndCat);
        } else {
            container.classList.add('no-category');
        }
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const jitterX = (Math.random() - 0.5) * 600; 
        const jitterY = (Math.random() - 0.5) * 600;

        const posX = (col * spacingX) + jitterX + 2500;
        const posY = (row * spacingY) + jitterY + 2500;

        container.style.left = posX + 'px';
        container.style.top = posY + 'px';
        container.style.zIndex = index + 10;

        container.innerHTML = `
            <img src="${data.src}" draggable="false">
            <div class="image-caption"><span>${data.title}</span><span style="float:right; opacity:0.5;">ph: ${data.ph}</span></div>
        `;
        // adjust caption size in proportion to the image width
        const captionEl = container.querySelector('.image-caption');
        if (captionEl) {
            // base font size matches --font-size-small (9px)
            const baseSize = 9;
            const scaleFactor = randomWidth / 300; // 300 is the minimum width used
            captionEl.style.fontSize = (baseSize * scaleFactor) + 'px';
        }

        // center camera on index 1 (first actual image after me01.png), not index 4
        if (index === 1) {
            const centerX = posX + (randomWidth / 2);
            const centerY = posY + (randomWidth * 1.2 / 2);
            pos.x = (window.innerWidth / 2) - (centerX * scale);
            pos.y = (window.innerHeight / 2) - (centerY * scale);
        }

        container.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDraggingImg = true;
            currentDraggedImg = container;
            highestZ++;
            container.style.zIndex = highestZ;
            world.style.transition = 'none';
            const rect = container.getBoundingClientRect();
            start.imgOffsetX = (e.clientX - rect.left) / scale;
            start.imgOffsetY = (e.clientY - rect.top) / scale;
        });
        world.appendChild(container);
    });
    
    updateTransform();
    setupCategoryIcons();
}

// INPUT HANDLING
window.addEventListener('mousemove', e => {
    if (isPanning) {
        pos.x = e.clientX - start.x;
        pos.y = e.clientY - start.y;
        updateTransform();
    } else if (isDraggingImg && currentDraggedImg) {
        const worldX = (e.clientX - pos.x) / scale;
        const worldY = (e.clientY - pos.y) / scale;
        currentDraggedImg.style.left = (worldX - start.imgOffsetX) + 'px';
        currentDraggedImg.style.top = (worldY - start.imgOffsetY) + 'px';
    }
});

canvas.addEventListener('mousedown', e => {
    isPanning = true;
    world.style.transition = 'none';
    start.x = e.clientX - pos.x;
    start.y = e.clientY - pos.y;
});

window.addEventListener('mouseup', () => {
    isPanning = false;
    isDraggingImg = false;
    currentDraggedImg = null;
    world.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.49, 0.32, 0.99)';
});

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const oldScale = scale;
    scale = Math.min(Math.max(0.1, scale + (-e.deltaY * 0.0012)), 2);
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    pos.x = mouseX - (mouseX - pos.x) * (scale / oldScale);
    pos.y = mouseY - (mouseY - pos.y) * (scale / oldScale);
    updateTransform();
}, { passive: false });

function updateTransform() {
    world.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale})`;
    if (activeCategory) drawConnections(activeCategory);
}

document.getElementById('logo-trigger').addEventListener('click', e => {
    e.preventDefault();
    const meImg = document.querySelector('img[src*="me01.png"]');
    if (meImg) {
        meImg.parentElement.classList.toggle('glow-me');
    }
});

document.getElementById('contact-trigger').addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('contact-overlay').classList.toggle('active');
    // dim/undim all images when contact toggles
    document.querySelectorAll('.image-container').forEach(c => {
        c.classList.toggle('dimmed');
    });
});
// also allow closing when clicking inside the overlay
document.getElementById('contact-overlay').addEventListener('click', (e) => {
    e.stopPropagation();
});

// category filtering utilities
function applyCategoryFilter(category) {
    document.querySelectorAll('.image-container').forEach(c => {
        const img = c.querySelector('img');
        if (c.dataset.category === category) {
            c.classList.add('highlighted');
            c.classList.remove('dimmed');
            // dynamic glow based on image/container width
            if (img) {
                const w = c.getBoundingClientRect().width || img.naturalWidth || 300;
                const glow = Math.max(24, Math.round(w * 0.16));
                img.style.boxShadow = `0 0 ${glow}px rgba(255,255,255,0.18), 0 12px ${Math.round(glow/2)}px rgba(255,255,255,0.06)`;
                img.style.transition = 'filter 0.45s ease, box-shadow 0.45s ease, transform 0.35s ease';
            }
        } else {
            c.classList.add('dimmed');
            c.classList.remove('highlighted');
            if (img) {
                img.style.boxShadow = '';
            }
        }
    });
}

function clearFilter() {
    document.querySelectorAll('.image-container').forEach(c => {
        const img = c.querySelector('img');
        c.classList.remove('dimmed', 'highlighted');
        if (img) {
            img.style.boxShadow = '';
            img.style.transition = '';
        }
    });
}

function clearConnections() {
    const svg = document.getElementById('connection-layer');
    if (svg) svg.innerHTML = '';
}

function setupCategoryIcons() {
    const icons = document.querySelectorAll('.category-tab');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent global clear-on-click-outside

            // imprint pad has no data-category; handle it separately
            if (icon.classList.contains('imprint-pad')) {
                toggleImprint();
                return;
            }

            const cat = icon.dataset.category;
            if (!cat) return;

            if (icon.classList.contains('active')) {
                // toggle off
                icon.classList.remove('active');
                activeCategory = null;
                clearFilter();
                clearConnections();
            } else {
                icons.forEach(i => i.classList.remove('active'));
                icon.classList.add('active');
                activeCategory = cat;
                applyCategoryFilter(cat);
                drawConnections(cat);
            }
        });
    });
}

function toggleImprint() {
    const overlay = document.getElementById('imprint-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active');
    // dim/undim images when imprint toggles
    document.querySelectorAll('.image-container').forEach(c => {
        c.classList.toggle('dimmed');
    });
}

// click outside the HUD clears selection, and close imprint/contact overlays
document.addEventListener('click', (e) => {
    // close imprint if clicked outside
    if (!e.target.closest('#imprint-overlay') && !e.target.closest('#imprint-pad')) {
        document.getElementById('imprint-overlay').classList.remove('active');
        // undim images
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('dimmed');
        });
    }
    
    // close contact if clicked outside
    if (!e.target.closest('#contact-overlay') && !e.target.closest('#contact-trigger')) {
        document.getElementById('contact-overlay').classList.remove('active');
        // undim images
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('dimmed');
        });
    }
    
    // unglow me01.png if clicked outside logo
    if (!e.target.closest('#logo-trigger')) {
        const meImg = document.querySelector('img[src*="me01.png"]');
        if (meImg) {
            meImg.parentElement.classList.remove('glow-me');
        }
    }
    
    if (!e.target.closest('#category-bar')) {
        const icons = document.querySelectorAll('.category-tab');
        icons.forEach(i => i.classList.remove('active'));
        if (activeCategory !== null) {
            activeCategory = null;
            clearFilter();
            clearConnections();
        }
    }
});

// utility: arrange tabs in circle around center of #category-bar
function layoutHud() {
    const hud = document.getElementById('category-bar');
    const tabs = hud.querySelectorAll('.category-tab');
    const radius = hud.offsetWidth / 2 - 20; // leave padding
    tabs.forEach((tab, i) => {
        const angle = (i / tabs.length) * Math.PI * 2 - Math.PI / 2; // start at top
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        tab.style.position = 'absolute';
        // position relative to hud top-left
        tab.style.left = (hud.offsetWidth / 2 + x - tab.offsetWidth / 2) + 'px';
        tab.style.top = (hud.offsetHeight / 2 + y - tab.offsetHeight / 2) + 'px';
    });
}

// draw connecting lines from HUD icon to each matching image
// helper to choose nearest corner (or edge midpoint) of a rect to a point
function nearestPointOnRect(px, py, rect) {
    // corners
    const pts = [
        {x: rect.left, y: rect.top},
        {x: rect.right, y: rect.top},
        {x: rect.left, y: rect.bottom},
        {x: rect.right, y: rect.bottom}
    ];
    let best = pts[0];
    let bestDist = Infinity;
    pts.forEach(p => {
        const dx = p.x - px;
        const dy = p.y - py;
        const d = dx*dx + dy*dy;
        if (d < bestDist) {
            bestDist = d;
            best = p;
        }
    });
    return best;
}

function drawConnections(category) {
    const svg = document.getElementById('connection-layer');
    if (!svg) return;
    svg.innerHTML = '';
    const icons = document.querySelectorAll('.category-tab');
    const icon = [...icons].find(i => i.dataset.category === category);
    if (!icon) return;
    const iconRect = icon.getBoundingClientRect();
    document.querySelectorAll('.image-container').forEach(c => {
        if (c.dataset.category === category) {
            const rect = c.getBoundingClientRect();
            // choose the corner of image nearest to icon center
            const imgCenter = {x: rect.left + rect.width/2, y: rect.top + rect.height/2};
            const end = nearestPointOnRect(imgCenter.x, imgCenter.y, rect);
            // now pick the corner of icon nearest to this end point
            const start = nearestPointOnRect(end.x, end.y, iconRect);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', start.x);
            line.setAttribute('y1', start.y);
            line.setAttribute('x2', end.x);
            line.setAttribute('y2', end.y);
            line.setAttribute('stroke', 'rgba(200,200,200,0.3)');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('filter', 'url(#glow)');
            svg.appendChild(line);
        }
    });
}

window.addEventListener('resize', () => {
    initBackground();
    if (activeCategory) drawConnections(activeCategory);
});

// Initialisierung
initBackground();
animateBackground();
init();