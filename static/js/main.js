let currentLang = 'sr';

// Event Listeners
const langBtn = document.getElementById('langBtn');
const themeToggleBtn = document.getElementById('themeToggle');

if (langBtn) langBtn.addEventListener('click', toggleLang);
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

// ============================================
// --- AŽURIRANA FUNKCIJA ZA JEZIK ---
// ============================================
function toggleLang() {
    currentLang = currentLang === 'sr' ? 'en' : 'sr';
    if (langBtn) langBtn.innerText = currentLang;
    
    // Promena jezika u Info Modalu (Uputstvu)
    const title = document.getElementById('helpTitle');
    const txtSr = document.getElementById('helpTextSr');
    const txtEn = document.getElementById('helpTextEn');
    
    if (currentLang === 'en') {
        if (title) title.innerText = "How to use?";
        if (txtSr) txtSr.classList.add('hidden');
        if (txtEn) txtEn.classList.remove('hidden');
    } else {
        if (title) title.innerText = "Kako se koristi?";
        if (txtSr) txtSr.classList.remove('hidden');
        if (txtEn) txtEn.classList.add('hidden');
    }
}

function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (sunIcon) sunIcon.classList.toggle('hidden', !isDark);
    if (moonIcon) moonIcon.classList.toggle('hidden', isDark);
    
    localStorage.theme = isDark ? 'dark' : 'light';
}

// Inicijalna provera teme pri učitavanju
(function initTheme() {
    const isDarkStored = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDarkStored) {
        document.documentElement.classList.add('dark');
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    }
})();

// ============================================
// --- SIDE DRAWER LOGIKA (FIOKA) ---
// ============================================
const btnMenu = document.getElementById('btnMenu');
const btnCloseMenu = document.getElementById('btnCloseMenu');
const sideDrawer = document.getElementById('sideDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerOpenDossier = document.getElementById('drawerOpenDossier');

function toggleDrawer() {
    // Ako nema drawera na stranici, prekini izvršavanje
    if (!sideDrawer || !drawerBackdrop) return;

    const isClosed = sideDrawer.classList.contains('-translate-x-full');
    
    if (isClosed) {
        // Otvori drawer
        sideDrawer.classList.remove('-translate-x-full');
        drawerBackdrop.classList.remove('hidden');
        // Kratak delay za glatku animaciju opacity-ja
        setTimeout(() => drawerBackdrop.classList.remove('opacity-0'), 10);
    } else {
        // Zatvori drawer
        sideDrawer.classList.add('-translate-x-full');
        drawerBackdrop.classList.add('opacity-0');
        // Sačekaj da se završi CSS tranzicija (500ms) pa ga ukloni iz DOM-a
        setTimeout(() => drawerBackdrop.classList.add('hidden'), 500); 
    }
}

// Postavljanje listenara za Drawer dugmiće
if (btnMenu) btnMenu.addEventListener('click', toggleDrawer);
if (btnCloseMenu) btnCloseMenu.addEventListener('click', toggleDrawer);
if (drawerBackdrop) drawerBackdrop.addEventListener('click', toggleDrawer);

// Preusmeravanje klika iz Drawera na otvaranje Master Dosijea
if (drawerOpenDossier) {
    drawerOpenDossier.addEventListener('click', () => {
        toggleDrawer(); // Prvo zatvori fioku
        
        const dossierEditor = document.getElementById('dossierEditor');
        
        // Prikazuje formu ako editor i globalna render funkcija postoje
        if (dossierEditor && typeof renderProfessionalForm === "function") {
            dossierEditor.classList.remove('hidden');
            renderProfessionalForm();
        }
    });
}

// ============================================
// --- HELP MODAL LOGIKA (UPUTSTVO) ---
// ============================================
const btnHelp = document.getElementById('btnHelp');
const helpModal = document.getElementById('helpModal');
const helpBackdrop = document.getElementById('helpBackdrop');
const helpContent = document.getElementById('helpContent');
const btnCloseHelp = document.getElementById('btnCloseHelp');

// Pomoćna funkcija za otvaranje/zatvaranje
function toggleHelpModal() {
    if (!helpModal || !helpBackdrop || !helpContent) return;

    if (helpModal.classList.contains('hidden')) {
        // Otvaranje
        helpModal.classList.remove('hidden');
        setTimeout(() => {
            helpBackdrop.classList.remove('opacity-0');
            helpContent.classList.remove('opacity-0', 'scale-95');
        }, 10);
    } else {
        // Zatvaranje
        helpBackdrop.classList.add('opacity-0');
        helpContent.classList.add('opacity-0', 'scale-95');
        // Sačekaj da se animacija završi (300ms)
        setTimeout(() => helpModal.classList.add('hidden'), 300);
    }
}

// Event listeneri za Info prozor
if (btnHelp) btnHelp.addEventListener('click', toggleHelpModal);
if (btnCloseHelp) btnCloseHelp.addEventListener('click', toggleHelpModal);
if (helpBackdrop) helpBackdrop.addEventListener('click', toggleHelpModal);