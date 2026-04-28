/**
 * MASTER ENGINE - FALDY.DEV
 * HANDLING: MODULAR HTML, TYPING ANIMATION, YIN-YANG THEME, REVEAL, TILT, PAGE TRANSITION, & 3D PHYSICS (FLOATING CARD)
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. FUNGSI LOAD KOMPONEN (HEADER & FOOTER)
    const loadComponent = async (id, path) => {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.text();
            const el = document.getElementById(id);
            if (el) el.innerHTML = data;
        } catch (err) {
            console.error(`[ERROR] Gagal load ${path}:`, err);
        }
    };

    // LINK HEADER & FOOTER SUDAH DIRATAKAN
    await Promise.all([
        loadComponent('header-placeholder', 'header.html'),
        loadComponent('footer-placeholder', 'footer.html')
    ]);

    setTimeout(() => {
        initTheme(); 
        highlightActiveMenu();
        initReveal();
        initTyping();
        initTilt(); 
        initTruePhysics(); // JALANKAN FISIKA KARTU MELAYANG
    }, 100); 

    const loader = document.getElementById('page-loader');
    if (loader) {
        setTimeout(() => { loader.classList.add('fade-out'); }, 400); 
    }

    // ==========================================================
    // PERBAIKAN: EVENT LISTENER BIAR DOWNLOAD GAK STUCK LOADING
    // ==========================================================
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        if (link) {
            // DETEKSI OTOMATIS: Kalau ini tombol download, zip, pdf, atau ada JS onclick nya, abaikan transisi loading!
            const isDownloadBtn = link.hasAttribute('download') || 
                                  link.href.match(/\.(pdf|zip|rar)$/i) || 
                                  link.getAttribute('onclick');
            
            if (isDownloadBtn) {
                return; // Stop di sini, biarin file-nya didownload normal
            }
        }

        // Kalau link biasa (pindah halaman HTML), baru jalanin animasi Yin-Yang
        if (link && link.href && !link.href.includes('#') && link.target !== '_blank') {
            const currentDomain = window.location.hostname;
            const linkDomain = new URL(link.href).hostname;
            if (currentDomain === linkDomain || linkDomain === '') {
                e.preventDefault();
                const targetUrl = link.href;
                if (loader) {
                    loader.style.pointerEvents = 'all'; 
                    loader.classList.remove('fade-out'); 
                    setTimeout(() => { window.location.href = targetUrl; }, 500); 
                } else { window.location.href = targetUrl; }
            }
        }
    });
});

const initTyping = () => {
    const textElement = document.getElementById('typing-text');
    if (!textElement) return;
    const phrases = ['UI / UX DESIGNER', 'WEB DEVELOPER', 'FULL STACK DEV'];
    let phraseIndex = 0; let charIndex = 0; let isDeleting = false;
    const typeEffect = () => {
        const currentPhrase = phrases[phraseIndex];
        textElement.textContent = isDeleting ? currentPhrase.substring(0, charIndex - 1) : currentPhrase.substring(0, charIndex + 1);
        charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
        let typeSpeed = isDeleting ? 60 : 120;
        if (!isDeleting && charIndex === currentPhrase.length) { typeSpeed = 2000; isDeleting = true; } 
        else if (isDeleting && charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; typeSpeed = 500; }
        setTimeout(typeEffect, typeSpeed);
    };
    typeEffect();
};

const initTheme = () => {
    const btn = document.getElementById('theme-btn');
    const yyIcon = document.getElementById('yy-icon');
    if (!btn) return;
    if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-mode'); if(yyIcon) yyIcon.classList.add('rotate-yy'); }
    btn.onclick = () => {
        document.body.classList.toggle('light-mode');
        if(yyIcon) yyIcon.classList.toggle('rotate-yy');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
};

// ==========================================================
// PERBAIKAN: HIGHLIGHT MENU AKTIF (SUPPORT HOSTING/VERCEL)
// ==========================================================
const highlightActiveMenu = () => {
    let path = window.location.pathname.split("/").pop();
    
    // Kalau di halaman utama (kosong), anggap aja index
    if (path === "" || path === "/") path = "index";
    
    // Bersihin akhiran .html biar cocok di Vercel/Hosting
    let cleanPath = path.replace('.html', '');

    document.querySelectorAll('.nav-link').forEach(link => {
        let linkHref = link.getAttribute('href');
        if (linkHref) {
            let cleanHref = linkHref.replace('.html', '');
            if (cleanHref === cleanPath) {
                link.classList.add('active'); // Nambahin efek terang
            }
        }
    });
};

const initReveal = () => {
    const reveals = document.querySelectorAll('.reveal');
    const revealFunc = () => {
        reveals.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 120) el.classList.add('active');
        });
    };
    window.addEventListener('scroll', revealFunc);
    revealFunc(); 
};

const initTilt = () => {
    const tiltElements = document.querySelectorAll(".profile-frame:not(.nametag-card), .card-visual-3d");
    if (tiltElements.length > 0 && typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(tiltElements, { max: 35, speed: 400, glare: true, "max-glare": 0.5, scale: 1.05, perspective: 1500 });
    }
};

// ==========================================================
// 8. FLOATING CARD PHYSICS (TANPA TALI)
// ==========================================================
const initTruePhysics = () => {
    const wrapper = document.getElementById('interactive-nametag'); 
    if (!wrapper) return;

    let isDragging = false;
    
    // Posisi X & Y Tarikan Kursor
    let cardX = 0, cardY = 0; 
    let velX = 0, velY = 0; 
    
    // Posisi Rotasi (Muter)
    let rotX = 0, rotY = 0;
    let vRotX = 0, vRotY = 0;

    let startMouseX = 0, startMouseY = 0;
    let initialCardX = 0, initialCardY = 0;

    const springPos = 0.02;  
    const frictionPos = 0.90; 
    const springRot = 0.015;  
    const frictionRot = 0.95; 
    
    const updatePhysics = () => {
        if (!isDragging) {
            velX += (0 - cardX) * springPos;
            velY += (0 - cardY) * springPos;
            velX *= frictionPos;
            velY *= frictionPos;
            cardX += velX;
            cardY += velY;

            vRotX += (0 - rotX) * springRot;
            vRotY += (0 - rotY) * springRot;
            vRotX *= frictionRot;
            vRotY *= frictionRot;
            rotX += vRotX;
            rotY += vRotY;
        }

        // Render Transformasi 3D HANYA ke ID Card
        wrapper.style.transform = `translate3d(${cardX}px, ${cardY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        requestAnimationFrame(updatePhysics);
    };
    updatePhysics();

    const getPos = (e) => ({
        x: e.touches ? e.touches[0].clientX : e.clientX,
        y: e.touches ? e.touches[0].clientY : e.clientY
    });

    const startDrag = (e) => {
        isDragging = true;
        const pos = getPos(e);
        
        startMouseX = pos.x; 
        startMouseY = pos.y;
        initialCardX = cardX; 
        initialCardY = cardY;
        
        velX = 0; velY = 0;
        vRotX = 0; vRotY = 0;
        wrapper.style.cursor = 'grabbing';
    };

    const moveDrag = (e) => {
        if (!isDragging) return;
        const pos = getPos(e);
        
        const dx = pos.x - startMouseX;
        const dy = pos.y - startMouseY;

        cardX = initialCardX + (dx * 0.7);
        cardY = initialCardY + (dy * 0.7);

        rotY = cardX * 0.1;
        rotX = -cardY * 0.1;
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.style.cursor = 'grab';
        
        vRotY = cardX * 0.2; 
        vRotX = -cardY * 0.2;
    };

    wrapper.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mouseleave', endDrag);

    wrapper.addEventListener('touchstart', startDrag, {passive: true});
    window.addEventListener('touchmove', moveDrag, {passive: true});
    window.addEventListener('touchend', endDrag);
};

// ==========================================================
// 9. FORCE DOWNLOAD PDF (BYPASS BROWSER PREVIEW & ACROBAT)
// ==========================================================
const forceDownloadCV = (e) => {
    e.preventDefault(); 
    
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    
    // Ubah tombol jadi loading pas diklik
    btn.innerHTML = 'Downloading... <i class="fas fa-spinner fa-spin ms-2"></i>';
    btn.style.pointerEvents = 'none'; 
    
    // Tarik file PDF-nya secara paksa lewat background
    fetch('cv-faldy.pdf')
        .then(response => {
            if (!response.ok) throw new Error("File tidak ditemukan!");
            return response.blob();
        })
        .then(blob => {
            // JURUS PAMUNGKAS: Ubah tipe blob jadi "application/octet-stream" (Data Mentah)
            const rawBlob = new Blob([blob], { type: 'application/octet-stream' });
            const blobUrl = window.URL.createObjectURL(rawBlob);
            
            // Buat elemen link rahasia buat nge-trigger download
            const hiddenLink = document.createElement('a');
            hiddenLink.style.display = 'none';
            hiddenLink.href = blobUrl;
            hiddenLink.download = 'cv-faldy.pdf'; // Nama pas di-save
            
            document.body.appendChild(hiddenLink);
            hiddenLink.click(); 
            
            // Bersih-bersih memori
            window.URL.revokeObjectURL(blobUrl);
            hiddenLink.remove();
            
            // Balikin tombol kayak semula
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        })
        .catch(err => {
            console.error(err);
            alert('Gagal mendownload CV. Pastikan nama file cv-faldy.pdf sudah ada di folder utama (sejajar index.html)!');
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        });
};