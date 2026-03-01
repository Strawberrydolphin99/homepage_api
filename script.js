const categories = ['building','installation','object','research','index'];

const imageNames = [
    { src: 'INS_FAMILY-HOUSE_23_01_built.jpg',
        category: 'installation' },
    { src: 'INS_FAMILY-HOUSE_23_02_built.jpg',
        category: 'installation' },
    { src: 'INS_FAMILY-HOUSE_23_03_built.jpg',
        category: 'installation' },
    { src: 'BUI_PORTAL_24_01_built.jpg',
        category: 'building' },
    { src: 'BUI_PORTAL_24_02_built.jpg',
        category: 'building' },
    { src: 'BUI_PORTAL_24_03_built.jpg',
        category: 'building' },
    { src: 'BUI_PORTAL_24_04_built.jpg',
        category: 'building' },
    { src: 'BUI_PORTAL_24_05_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_02_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_03_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_04_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_05_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_06_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_07_built.jpg',
        category: 'building' },
    { src: 'BUI_SURGICAL PRACTICE_24_08_built.jpg',
        category: 'building' },
    { src: 'INS_WAREHOUSE LIGHTNING_25_01_completed.jpg',
        category: 'installation' },
    { src: 'INS_WAREHOUSE LIGHTNING_25_02_completed.jpg',
        category: 'installation' },
    { src: 'OBJ_BENCH_24_01_built.jpg',
        category: 'object' },
    { src: 'OBJ_CONSOLE_24_01_built.jpg',
        category: 'object' },
    { src: 'OBJ_HANGERS_22_01_built.jpg',
        category: 'object' },
    { src: 'OBJ_INFINITE LAMP_21_01_built.jpg',
        category: 'object' },
    { src: 'OBJ_INFINITE LAMP_21_02_built.jpg',
        category: 'object' },
    { src: 'OBJ_LOCKER_24_01_built.jpg',
        category: 'object' },
    { src: 'OBJ_HANGERS_22_02_built.jpg',
        category: 'object' },
    { src: 'OBJ_TABLE_24_01_built.jpg',
        category: 'object' },
    { src: 'OBJ_TABLE_24_02_built.jpg',
        category: 'object' },
    { src: 'RES_CORPOREAL VARIATIONS_25_01_ongoing.jpg',
        category: 'research' },
    { src: 'RES_CORPOREAL VARIATIONS_25_02_ongoing.jpg', 
        category: 'research' },
    { src: 'BUI_HOUSING FOR UNCERTAIN CIRCUMSTANCES_21_01_study.jpg',
        category: 'building' },
    { src: 'BUI_HOUSING FOR UNCERTAIN CIRCUMSTANCES_21_02_study.jpg',
        category: 'building' },
    { src: 'BUI_NATURAL SWIMMING POOL_23_01_study.jpg',
        category: 'building' },
    { src: 'BUI_NATURAL SWIMMING POOL_23_02_study.jpg',
        category: 'building' },
];

const world = document.getElementById('image-world');
const canvas = document.getElementById('canvas');
const bgCanvas = document.getElementById('noise-bg');
const ctx = bgCanvas.getContext('2d');

let scale = 0.08; 
let pos = { x: 0, y: 0 };
let isPanning = false;
let isDraggingImg = false;
let currentDraggedImg = null;
let start = { x: 0, y: 0 };
let highestZ = 100;
let activeCategory = null; // currently selected HUD category
let isZoomInProgress = true; // disable interactions until zoom completes

// MOBILE DETECTION
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const isMobile = isMobileDevice();
let touchStartDist = 0;
let touchStartScale = 0.08;

// BACKGROUND NOISE
let dots = [];
function initBackground() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    dots = [];
    const gridSpacingX = 35;
    const gridSpacingY = 35;
    
    for (let x = 0; x < bgCanvas.width; x += gridSpacingX) {
        for (let y = 0; y < bgCanvas.height; y += gridSpacingY) {
            dots.push({
                x: x,
                y: y,
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                speedX: Math.random() * 2 + 0.5,
                speedY: Math.random() * 2 + 0.5,
                size: Math.random() * 0.7 + 0.3,
                bounceRange: Math.random() * 0.8 + 0.4
            });
        }
    }
}

function animateBackground() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const time = Date.now() * 0.003; 
    dots.forEach(dot => {
        const dx = Math.sin(time * dot.speedX + dot.phaseX) * dot.bounceRange;
        const dy = Math.cos(time * dot.speedY + dot.phaseY) * dot.bounceRange;
        ctx.beginPath();
        ctx.arc(dot.x + dx, dot.y + dy, dot.size, 0, Math.PI * 2);
        ctx.fill();
    });
    requestAnimationFrame(animateBackground);
}

// WORLD INIT
// Map category abbreviations to full names
const categoryMap = {
    'BUI': 'building',
    'INS': 'installation',
    'OBJ': 'object',
    'RES': 'research',
    'IDX': 'index'
};

const categoryAbbrevMap = {
    building: 'BUI',
    installation: 'INS',
    object: 'OBJ',
    research: 'RES',
    index: 'IDX'
};

// Extract category from filename
function getCategoryFromFilename(filename) {
    // Get filename without extension
    const nameWithoutExt = filename.split('.')[0];
    // Get first part before underscore
    const prefix = nameWithoutExt.split('_')[0].toUpperCase();
    // Return mapped category or null if not found
    return categoryMap[prefix] || null;
}

function init() {
    const spacingX = 1400;
    const spacingY = 1000;
    const cols = 5;

    // Keep world hidden initially
    world.style.opacity = '0';
    world.style.visibility = 'hidden';
    world.style.transition = 'none';
    
    let imagesToLoad = imageNames.length;
    let imagesLoaded = 0;

    imageNames.forEach((data, index) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        // me01.png gets random width/height but capped lower so it's never the biggest
        const randomWidth = data.src === 'me01.png' 
            ? Math.floor(Math.random() * 350) + 300  // 300-650px
            : Math.floor(Math.random() * 450) + 300; // 300-750px
        const randomHeight = data.src === 'me01.png'
            ? Math.floor(Math.random() * 300) + 250  // 250-550px
            : Math.floor(Math.random() * 400) + 250; // 250-650px
        container.style.width = randomWidth + 'px';
        container.style.height = randomHeight + 'px';
        
        // skip category assignment for me01.png
        if (data.src !== 'me01.png') {
            const extractedCat = getCategoryFromFilename(data.src);
            const cat = extractedCat || categories[Math.floor(Math.random() * categories.length)];
            container.dataset.category = cat;
            container.setAttribute('data-category', cat);
        } else {
            container.classList.add('no-category');
        }
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const jitterX = (Math.random() - 0.5) * 600; 
        const jitterY = (Math.random() - 0.5) * 600;

        const posX = (col * spacingX) + jitterX + 1800;
        const posY = (row * spacingY) + jitterY + 1800;

        container.style.left = posX + 'px';
        container.style.top = posY + 'px';
        container.style.zIndex = index + 10;
        
        // Store original position for restoration
        container.dataset.originalX = posX;
        container.dataset.originalY = posY;

        const filePrefix = data.src.split('.')[0].split('_')[0].toUpperCase();
        const categoryFromFile = categoryMap[filePrefix];
        const inferredAbbrev = categoryFromFile ? categoryAbbrevMap[categoryFromFile] : '';
        const fallbackAbbrev = container.dataset.category
            ? categoryAbbrevMap[container.dataset.category] || ''
            : '';
        const displayAbbrev = inferredAbbrev || fallbackAbbrev;

        const img = document.createElement('img');
        img.src = data.src;
        img.draggable = false;
        
        // Track when image loads
        img.onload = () => {
            imagesLoaded++;
            updateProgressCircle(imagesLoaded, imagesToLoad);
            if (imagesLoaded === imagesToLoad) {
                // All images loaded - start animation
                startLoadAnimation();
            }
        };
        img.onerror = () => {
            imagesLoaded++;
            updateProgressCircle(imagesLoaded, imagesToLoad);
            if (imagesLoaded === imagesToLoad) {
                startLoadAnimation();
            }
        };
        
        const caption = document.createElement('div');
        caption.className = 'image-caption';
        const filenameWithoutExt = data.src.split('.')[0];
        const filenameParts = filenameWithoutExt.split('_');
        const projectName = filenameParts[1];
        const year = filenameParts[2];
        const titleDisplay = `${projectName}_y${year}`;
        const status = filenameParts[filenameParts.length - 1];
        caption.innerHTML = `<span>${titleDisplay}</span><span style="float:right; opacity:0.5;">status: ${status}</span>`;
        
        container.appendChild(img);
        container.appendChild(caption);
        // adjust caption size in proportion to the image width
        const captionEl = container.querySelector('.image-caption');
        if (captionEl) {
            // base font size matches --font-size-small (9px)
            const baseSize = 9;
            const scaleFactor = randomWidth / 300; // 300 is the minimum width used
            captionEl.style.fontSize = (baseSize * scaleFactor) + 'px';
        }



        container.addEventListener('mousedown', (e) => {
            if (isZoomInProgress) return; // Prevent interaction during zoom
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
        
        // Touch event for mobile image dragging
        container.addEventListener('touchstart', (e) => {
            if (isZoomInProgress || e.touches.length !== 1) return;
            e.stopPropagation();
            isDraggingImg = true;
            currentDraggedImg = container;
            highestZ++;
            container.style.zIndex = highestZ;
            world.style.transition = 'none';
            const rect = container.getBoundingClientRect();
            const touch = e.touches[0];
            start.imgOffsetX = (touch.clientX - rect.left) / scale;
            start.imgOffsetY = (touch.clientY - rect.top) / scale;
        });
        
        world.appendChild(container);
    });
    
    setupCategoryIcons();
    
    // Fallback: if images take too long, start animation anyway after 25 seconds
    setTimeout(() => {
        if (imagesLoaded < imagesToLoad) {
            startLoadAnimation();
        }
    }, 25000);
}

// Update progress circle as images load
function updateProgressCircle(loaded, total) {
    const progressWedge = document.getElementById('progress-wedge');
    if (!progressWedge) return;
    
    const progress = loaded / total;
    const radius = 35;
    const centerX = 50;
    const centerY = 50;
    
    // Calculate angle in radians (0 = top, clockwise)
    const angle = progress * Math.PI * 2;
    
    // Calculate end point of arc
    const endX = centerX + radius * Math.sin(angle);
    const endY = centerY - radius * Math.cos(angle);
    
    // Large arc flag: 1 if angle > 180 degrees (progress > 0.5)
    const largeArcFlag = progress > 0.5 ? 1 : 0;
    
    // Build path: move to center, line to top point, arc to end point, close
    const pathData = progress === 0 
        ? `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A 0 0 0 0 1 ${centerX} ${centerY - radius} Z`
        : `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    
    progressWedge.setAttribute('d', pathData);
}

// Called when all images have loaded
function startLoadAnimation() {
    // Delay slightly to ensure layout is fully computed
    setTimeout(() => {
        // Set initial zoom level (overview) - zoom out more
        scale = 0.05;
        const allImages = document.querySelectorAll('.image-container');
        if (allImages.length > 0) {
            // Center roughly on the middle of all images
            const roughCenterX = 4000;
            const roughCenterY = 4000;
            pos.x = (window.innerWidth / 2) - (roughCenterX * scale);
            pos.y = (window.innerHeight / 2) - (roughCenterY * scale);
        }
        
        // Show the world with overview
        world.style.visibility = 'visible';
        world.style.opacity = '1';
        world.style.transition = 'none';
        updateTransform();
        
        // On mobile: hide spinner and enable interactions immediately
        if (isMobile) {
            const spinner = document.getElementById('loading-spinner');
            spinner.classList.add('hidden');
            isZoomInProgress = false;
        } else {
            // On desktop: wait 2 seconds before hiding spinner and starting zoom
            setTimeout(() => {
                const spinner = document.getElementById('loading-spinner');
                spinner.classList.add('hidden');
                animateZoomIntoImage();
            }, 2000);
        }
        
    }, 100);
}

// Animate zoom into a random image
// Animate zoom into the center of the screen
function animateZoomIntoImage() {
    // Always zoom to the center of the world (which is roughly at 4000, 4000)
    // This keeps the center of the screen in the center throughout the zoom
    isZoomInProgress = true; // Disable interactions
    const centerX = 4000;
    const centerY = 4000;
    
    const startScale = 0.05;
    const endScale = 0.45;
    const duration = 25000; // 25 seconds - smooth long zoom
    const startTime = Date.now();
    
    world.style.transition = 'none'; // No CSS transition
    
    function frame() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in-out sine for smooth, continuous zoom motion
        const easeProgress = (Math.cos(Math.PI * (1 + progress)) + 1) / 2;
        
        scale = startScale + (endScale - startScale) * easeProgress;
        pos.x = (window.innerWidth / 2) - (centerX * scale);
        pos.y = (window.innerHeight / 2) - (centerY * scale);
        
        updateTransform();
        
        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            // Zoom complete - enable interactions
            isZoomInProgress = false;
        }
    }
    
    requestAnimationFrame(frame);
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

// Touch move handler for image dragging
window.addEventListener('touchmove', e => {
    if (isDraggingImg && currentDraggedImg && e.touches.length === 1) {
        const worldX = (e.touches[0].clientX - pos.x) / scale;
        const worldY = (e.touches[0].clientY - pos.y) / scale;
        currentDraggedImg.style.left = (worldX - start.imgOffsetX) + 'px';
        currentDraggedImg.style.top = (worldY - start.imgOffsetY) + 'px';
    }
}, { passive: false });

// Variable to track if current action is a drag
let isDragAction = false;
let dragStartTime = 0;
let dragStartX = 0;
let dragStartY = 0;

canvas.addEventListener('mousedown', e => {
    if (isZoomInProgress) return; // Prevent interaction during zoom
    isDragAction = false;
    dragStartTime = Date.now();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    isPanning = true;
    world.style.transition = 'none';
    start.x = e.clientX - pos.x;
    start.y = e.clientY - pos.y;
});

window.addEventListener('mouseup', () => {
    // Mark as drag if mouse moved significantly or time elapsed
    if (isPanning) {
        const timeDiff = Date.now() - dragStartTime;
        const distMoved = Math.hypot(dragStartX - event.clientX, dragStartY - event.clientY);
        isDragAction = timeDiff > 200 || distMoved > 10; // Drag if held >200ms or moved >10px
    }
    isPanning = false;
    isDraggingImg = false;
    currentDraggedImg = null;
    world.style.transition = 'transform 0.6s ease-in-out';
});

canvas.addEventListener('wheel', e => {
    if (isZoomInProgress) return; // Prevent interaction during zoom
    e.preventDefault();
    const oldScale = scale;
    scale = Math.min(Math.max(0.4, scale + (-e.deltaY * 0.0012)), 2);
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    pos.x = mouseX - (mouseX - pos.x) * (scale / oldScale);
    pos.y = mouseY - (mouseY - pos.y) * (scale / oldScale);
    updateTransform();
}, { passive: false });

// TOUCH HANDLING FOR MOBILE
canvas.addEventListener('touchstart', e => {
    if (isZoomInProgress || e.touches.length > 2) return;
    
    if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchStartDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        touchStartScale = scale;
    } else if (e.touches.length === 1) {
        // Single touch pan start
        isPanning = true;
        world.style.transition = 'none';
        start.x = e.touches[0].clientX - pos.x;
        start.y = e.touches[0].clientY - pos.y;
    }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    if (isZoomInProgress) return;
    e.preventDefault();
    
    if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const newDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const zoomFactor = newDist / touchStartDist;
        const oldScale = scale;
        scale = Math.min(Math.max(0.4, touchStartScale * zoomFactor), 2);
        
        // Zoom towards center of screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        pos.x = centerX - (centerX - pos.x) * (scale / oldScale);
        pos.y = centerY - (centerY - pos.y) * (scale / oldScale);
        updateTransform();
    } else if (e.touches.length === 1 && isPanning) {
        // Single touch pan
        pos.x = e.touches[0].clientX - start.x;
        pos.y = e.touches[0].clientY - start.y;
        updateTransform();
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    isPanning = false;
    world.style.transition = 'transform 0.6s ease-in-out';
}, { passive: false });

function updateTransform() {
    world.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale})`;
}

document.getElementById('logo-trigger').addEventListener('click', e => {
    if (isZoomInProgress) return; // Prevent interaction during zoom
    e.preventDefault();
    e.stopPropagation();
    
    const overlay = document.getElementById('about-overlay');
    const isActive = overlay.classList.contains('active');
    
    // Close all other overlays
    document.getElementById('imprint-overlay').classList.remove('active');
    document.getElementById('credit-overlay').classList.remove('active');
    document.getElementById('contact-overlay').classList.remove('active');
    
    if (isActive) {
        // Close this overlay
        overlay.classList.remove('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    } else {
        // Open this overlay
        overlay.classList.add('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.add('force-dimmed');
        });
    }
});
// also allow closing when clicking inside the overlay
document.getElementById('about-overlay').addEventListener('click', (e) => {
    e.stopPropagation();
});

document.getElementById('contact-trigger').addEventListener('click', e => {
    if (isZoomInProgress) return; // Prevent interaction during zoom
    e.preventDefault();
    e.stopPropagation();
    
    const overlay = document.getElementById('contact-overlay');
    const isActive = overlay.classList.contains('active');
    
    // Close all other overlays
    document.getElementById('imprint-overlay').classList.remove('active');
    document.getElementById('credit-overlay').classList.remove('active');
    document.getElementById('about-overlay').classList.remove('active');
    
    if (isActive) {
        // Close this overlay
        overlay.classList.remove('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    } else {
        // Open this overlay
        overlay.classList.add('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.add('force-dimmed');
        });
    }
});
// also allow closing when clicking inside the overlay
document.getElementById('contact-overlay').addEventListener('click', (e) => {
    e.stopPropagation();
});

// category filtering utilities
function applyCategoryFilter(category) {
    const filteredContainers = [];
    
    document.querySelectorAll('.image-container').forEach(c => {
        const img = c.querySelector('img');
        if (c.dataset.category === category) {
            c.classList.add('highlighted');
            c.classList.remove('dimmed');
            filteredContainers.push(c);
            // Setup smooth flying transition
            c.style.opacity = '0';
            c.style.transform = 'scale(0.5)';
            c.style.transition = 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out, left 1.5s ease-in-out, top 1.5s ease-in-out, box-shadow 1.5s ease-in-out';
            // dynamic glow and shadow based on image/container width
            if (img) {
                const w = c.getBoundingClientRect().width || img.naturalWidth || 300;
                const glow = Math.max(24, Math.round(w * 0.16));
                const shadowSize = Math.max(40, Math.round(w * 0.25));
                img.style.boxShadow = `0 0 ${glow}px rgba(255,255,255,0.25), 0 ${shadowSize}px ${shadowSize * 0.6}px rgba(0,0,0,0.35), inset 0 0 ${glow}px rgba(255,255,255,0.1)`;
            }
        } else {
            c.classList.add('dimmed');
            c.classList.remove('highlighted');
            c.style.opacity = '0.3';
            c.style.transition = 'opacity 0.8s ease-in-out';
            if (img) {
                img.style.boxShadow = '';
            }
        }
    });
    
    // Calculate the world coordinates for the center of the current screen view
    // This accounts for both pan (pos) and zoom (scale)
    // Screen center is at the middle of the viewport
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    // Convert screen coordinates to world coordinates
    // Formula: worldCoord = (screenCoord - panOffset) / zoomScale
    const viewCenterWorldX = (screenCenterX - pos.x) / scale;
    const viewCenterWorldY = (screenCenterY - pos.y) / scale - 800; // Move images up by 800px
    
    // Use spiral/grid arrangement with spacing to reduce overlap
    const minSpacing = 500; // minimum spacing between image centers
    const jitterAmount = 120; // random offset for loose feel
    
    // Use requestAnimationFrame to ensure the transition starts after layout recalc
    requestAnimationFrame(() => {
        filteredContainers.forEach((container, index) => {
            // Spiral pattern: arrange in expanding rings
            const ring = Math.floor(Math.sqrt(index)) + 1;
            const positionInRing = index % (ring * 4 + 1);
            const angle = (positionInRing / (ring * 4)) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const distance = ring * minSpacing + (Math.random() - 0.5) * jitterAmount;
            
            const newX = viewCenterWorldX + Math.cos(angle) * distance;
            const newY = viewCenterWorldY + Math.sin(angle) * distance;
            
            container.style.left = newX + 'px';
            container.style.top = newY + 'px';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        });
    });
}

function clearFilter() {
    document.querySelectorAll('.image-container').forEach(c => {
        const img = c.querySelector('img');
        c.classList.remove('dimmed', 'highlighted');
        
        // Fly out animation
        c.style.opacity = '0';
        c.style.transform = 'scale(0.5)';
        c.style.transition = 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out, left 1.5s ease-in-out, top 1.5s ease-in-out, box-shadow 1.5s ease-in-out';
        
        if (img) {
            img.style.boxShadow = '';
        }
        
        // Use requestAnimationFrame to ensure transition starts
        requestAnimationFrame(() => {
            // Restore original positions
            if (c.dataset.originalX && c.dataset.originalY) {
                c.style.left = c.dataset.originalX + 'px';
                c.style.top = c.dataset.originalY + 'px';
                
                // Restore appearance after animation completes
                setTimeout(() => {
                    c.style.opacity = '1';
                    c.style.transform = 'scale(1)';
                }, 1200);
            }
        });
    });
}

function setupCategoryIcons() {
    const icons = document.querySelectorAll('.category-tab:not(.imprint-pad):not(.credit-pad)');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            if (isZoomInProgress) return; // Prevent interaction during zoom
            e.stopPropagation(); // prevent global clear-on-click-outside

            const cat = icon.dataset.category;
            if (!cat) return;

            if (icon.classList.contains('active')) {
                // toggle off
                icon.classList.remove('active');
                activeCategory = null;
                clearFilter();
            } else {
                icons.forEach(i => i.classList.remove('active'));
                icon.classList.add('active');
                activeCategory = cat;
                applyCategoryFilter(cat);
            }
        });
    });
    
    // Imprint pad handler
    const imprintPad = document.getElementById('imprint-pad');
    if (imprintPad) {
        imprintPad.addEventListener('click', (e) => {
            if (isZoomInProgress) return; // Prevent interaction during zoom
            e.stopPropagation();
            toggleImprint();
        });
    }
    
    // Credit pad handler
    const creditPad = document.getElementById('credit-pad');
    if (creditPad) {
        creditPad.addEventListener('click', (e) => {
            if (isZoomInProgress) return; // Prevent interaction during zoom
            e.stopPropagation();
            toggleCredit();
        });
    }
}

function toggleImprint() {
    const overlay = document.getElementById('imprint-overlay');
    const isActive = overlay.classList.contains('active');
    
    // Close all other overlays
    document.getElementById('credit-overlay').classList.remove('active');
    document.getElementById('about-overlay').classList.remove('active');
    document.getElementById('contact-overlay').classList.remove('active');
    
    if (isActive) {
        // Close this overlay
        overlay.classList.remove('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    } else {
        // Open this overlay
        overlay.classList.add('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.add('force-dimmed');
        });
    }
}

function toggleCredit() {
    const overlay = document.getElementById('credit-overlay');
    const isActive = overlay.classList.contains('active');
    
    // Close all other overlays
    document.getElementById('imprint-overlay').classList.remove('active');
    document.getElementById('about-overlay').classList.remove('active');
    document.getElementById('contact-overlay').classList.remove('active');
    
    if (isActive) {
        // Close this overlay
        overlay.classList.remove('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    } else {
        // Open this overlay
        overlay.classList.add('active');
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.add('force-dimmed');
        });
    }
}

// click outside the HUD clears selection, and close imprint/contact overlays
document.addEventListener('click', (e) => {
    // close imprint if clicked outside
    if (!e.target.closest('#imprint-overlay') && !e.target.closest('#imprint-pad')) {
        document.getElementById('imprint-overlay').classList.remove('active');
        // remove force blur from images
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    }
    // close credit if clicked outside
    if (!e.target.closest('#credit-overlay') && !e.target.closest('#credit-pad')) {
        document.getElementById('credit-overlay').classList.remove('active');
        // remove force blur from images
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    }
    
    // close about if clicked outside
    if (!e.target.closest('#about-overlay') && !e.target.closest('#logo-trigger')) {
        document.getElementById('about-overlay').classList.remove('active');
        // remove force blur from images
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
        });
    }
    // close contact if clicked outside
    if (!e.target.closest('#contact-overlay') && !e.target.closest('#contact-trigger')) {
        document.getElementById('contact-overlay').classList.remove('active');
        // remove force blur from images
        document.querySelectorAll('.image-container').forEach(c => {
            c.classList.remove('force-dimmed');
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
        // Only clear category if not dragging the canvas
        if (!isDragAction) {
            icons.forEach(i => i.classList.remove('active'));
            if (activeCategory !== null) {
                activeCategory = null;
                clearFilter();
                clearConnections();
            }
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

window.addEventListener('resize', () => {
    initBackground();
});

// Disable right-click on images
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// Initialisierung
initBackground();
animateBackground();
init();