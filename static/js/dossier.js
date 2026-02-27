/**
 * CVespresso - Master Dossier Logic
 * Dodate socijalne mreže, portfolio linkovi i rešen bag sa brisanjem teksta pri dodavanju reda
 */

// 1. DUMMY PROFILE
const dummyProfile = {
    full_name: "Ime i Prezime",
    title: "Vaša Profesionalna Titula",
    motto: "Vaš profesionalni moto",
    email: "vas.email@primer.com",
    phone: "+381 60 000 0000",
    location: "Grad, Država",
    linkedin: "linkedin.com/in/korisnik",
    github: "github.com/korisnik",
    website: "www.mojsajt.com",
    experience: [
        { role: "Vaša Pozicija", company: "Naziv Firme", period: "2020 - 2024", desc: "Opis dostignuća" }
    ],
    education: [
        { degree: "Stepen obrazovanja", school: "Naziv škole", year: "Godina" }
    ],
    skills: {
        technical: ["Python", "SQL"],
        industry: ["Offset štampa"],
        soft: ["Liderstvo"]
    },
    certifications: [
        { name: "Naziv Sertifikata", year: "2026" }
    ],
    projects: [
        { name: "Naziv Projekta", desc: "Opis projekta" }
    ]
};

// 2. GLOBALNI MASTER DOSSIER
let masterDossier = null;

// 3. INICIJALIZACIJA
function initializeDossier() {
    console.log("=== 📦 DOSSIER INIT STARTED ===");
    
    let savedDossier = null;
    try {
        const stored = localStorage.getItem('cv_espresso_dossier');
        if (stored && stored.trim() !== "") {
            savedDossier = JSON.parse(stored);
            console.log("✅ LocalStorage: FOUND");
        } else {
            console.log("📁 LocalStorage: EMPTY");
        }
    } catch (e) {
        console.error("❌ LocalStorage error:", e);
        localStorage.removeItem('cv_espresso_dossier');
    }
    
    const hasValidData = savedDossier && 
                         savedDossier.full_name && 
                         savedDossier.full_name.trim() !== "" &&
                         savedDossier.full_name !== "Ime i Prezime";
    
    masterDossier = {
        full_name: hasValidData ? savedDossier.full_name : dummyProfile.full_name,
        title: hasValidData ? savedDossier.title : dummyProfile.title,
        motto: hasValidData ? savedDossier.motto : dummyProfile.motto,
        email: hasValidData ? savedDossier.email : dummyProfile.email,
        phone: hasValidData ? savedDossier.phone : dummyProfile.phone,
        location: hasValidData ? savedDossier.location : dummyProfile.location,
        linkedin: hasValidData && savedDossier.linkedin ? savedDossier.linkedin : dummyProfile.linkedin,
        github: hasValidData && savedDossier.github ? savedDossier.github : dummyProfile.github,
        website: hasValidData && savedDossier.website ? savedDossier.website : dummyProfile.website,
        experience: (hasValidData && Array.isArray(savedDossier.experience)) 
                    ? savedDossier.experience 
                    : JSON.parse(JSON.stringify(dummyProfile.experience)),
        education: (hasValidData && Array.isArray(savedDossier.education)) 
                   ? savedDossier.education 
                   : JSON.parse(JSON.stringify(dummyProfile.education)),
        certifications: (hasValidData && Array.isArray(savedDossier.certifications)) 
                        ? savedDossier.certifications 
                        : JSON.parse(JSON.stringify(dummyProfile.certifications)),
        projects: (hasValidData && Array.isArray(savedDossier.projects)) 
                  ? savedDossier.projects 
                  : JSON.parse(JSON.stringify(dummyProfile.projects)),
        skills: hasValidData && savedDossier.skills 
                ? savedDossier.skills 
                : JSON.parse(JSON.stringify(dummyProfile.skills))
    };
    
    localStorage.setItem('cv_espresso_dossier', JSON.stringify(masterDossier));
    
    console.log("=== 📦 DOSSIER INIT COMPLETE ===");
}

// 4. DOM READY
document.addEventListener('DOMContentLoaded', () => {
    console.log("=== 🚀 DOM CONTENT LOADED ===");
    initializeDossier();
    
    const openDossierBtn = document.getElementById('openDossier');
    const dossierEditor = document.getElementById('dossierEditor');
    
    if (openDossierBtn && dossierEditor) {
        openDossierBtn.addEventListener('click', () => {
            dossierEditor.classList.remove('hidden');
            renderProfessionalForm();
        });
    }
    
    window.renderProfessionalForm = renderProfessionalForm;
    window.saveProfessionalDossier = saveProfessionalDossier;
    window.addEntry = addEntry;
    window.removeEntry = removeEntry;
});

// 5. RENDER FORME
function renderProfessionalForm() {
    const container = document.getElementById('formContainer');
    if (!container) return;
    
    if (!masterDossier) initializeDossier();
    if (!masterDossier.skills) masterDossier.skills = { technical: [], industry: [], soft: [] };
    
    container.innerHTML = `
    <div class="space-y-12 pb-20">
        <section class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 border-b border-[var(--border)] pb-2">01. Lični Podaci & Linkovi</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" id="fName" value="${escapeHtml(masterDossier.full_name)}" class="dossier-input" placeholder="Puno ime">
                <input type="text" id="fTitle" value="${escapeHtml(masterDossier.title)}" class="dossier-input" placeholder="Titula">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="email" id="fEmail" value="${escapeHtml(masterDossier.email)}" class="dossier-input" placeholder="Email">
                <input type="text" id="fPhone" value="${escapeHtml(masterDossier.phone)}" class="dossier-input" placeholder="Telefon">
                <input type="text" id="fLoc" value="${escapeHtml(masterDossier.location)}" class="dossier-input" placeholder="Lokacija">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" id="fLinkedin" value="${escapeHtml(masterDossier.linkedin || '')}" class="dossier-input" placeholder="LinkedIn URL">
                <input type="text" id="fGithub" value="${escapeHtml(masterDossier.github || '')}" class="dossier-input" placeholder="GitHub URL">
                <input type="text" id="fWebsite" value="${escapeHtml(masterDossier.website || '')}" class="dossier-input" placeholder="Lični vebsajt / Portfolio">
            </div>
            
            <textarea id="fMotto" class="dossier-input h-20" placeholder="Motto">${escapeHtml(masterDossier.motto)}</textarea>
        </section>

        <section class="space-y-4">
            <div class="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <h3 class="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">02. Obrazovanje</h3>
                <button onclick="addEntry('education')" class="text-[9px] font-bold text-blue-500 uppercase">+ Dodaj</button>
            </div>
            <div id="educationList" class="space-y-4">
                ${(masterDossier.education || []).map((edu, i) => renderEntry('education', edu, i)).join('')}
            </div>
        </section>

        <section class="space-y-4">
            <div class="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <h3 class="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">03. Iskustvo</h3>
                <button onclick="addEntry('experience')" class="text-[9px] font-bold text-blue-500 uppercase">+ Dodaj</button>
            </div>
            <div id="experienceList" class="space-y-6">
                ${(masterDossier.experience || []).map((exp, i) => renderEntry('experience', exp, i)).join('')}
            </div>
        </section>

        <section class="space-y-6">
            <h3 class="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 border-b border-[var(--border)] pb-2">04. Veštine</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="text-[9px] font-bold uppercase opacity-50 block mb-2">Tehničke</label>
                    <textarea id="skillTech" class="dossier-input text-xs h-24" placeholder="Python, JS...">${escapeHtml((masterDossier.skills?.technical || []).join(', '))}</textarea>
                </div>
                <div>
                    <label class="text-[9px] font-bold uppercase opacity-50 block mb-2">Industrijske</label>
                    <textarea id="skillInd" class="dossier-input text-xs h-24" placeholder="Offset...">${escapeHtml((masterDossier.skills?.industry || []).join(', '))}</textarea>
                </div>
                <div>
                    <label class="text-[9px] font-bold uppercase opacity-50 block mb-2">Meke veštine</label>
                    <textarea id="skillSoft" class="dossier-input text-xs h-24" placeholder="Leadership...">${escapeHtml((masterDossier.skills?.soft || []).join(', '))}</textarea>
                </div>
            </div>
        </section>

        <section class="space-y-4">
            <div class="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <h3 class="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">05. Sertifikati</h3>
                <button onclick="addEntry('certifications')" class="text-[9px] font-bold text-blue-500 uppercase">+ Dodaj</button>
            </div>
            <div id="certificationsList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${(masterDossier.certifications || []).map((cert, i) => renderEntry('certifications', cert, i)).join('')}
            </div>
        </section>

        <button onclick="saveProfessionalDossier()" class="btn-espresso w-full py-6 mt-12 font-black uppercase text-xs tracking-[0.5em]">
            Sačuvaj Master Dosije
        </button>
    </div>`;
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderEntry(type, data, index) {
    if (type === 'education') {
        return `<div class="p-4 border border-[var(--border)] rounded-xl relative group transition-all">
            <button onclick="removeEntry('education', ${index})" class="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-md">×</button>
            <div class="flex flex-col md:flex-row gap-4">
                <input type="text" class="dossier-input edu-degree w-full md:w-2/5" value="${escapeHtml(data.degree || '')}" placeholder="Zvanje">
                <input type="text" class="dossier-input edu-school w-full md:w-2/5" value="${escapeHtml(data.school || '')}" placeholder="Škola">
                <input type="text" class="dossier-input edu-year w-full md:w-1/5" value="${escapeHtml(data.year || '')}" placeholder="Godina">
            </div>
        </div>`;
    }
    if (type === 'experience') {
        return `<div class="p-4 border border-[var(--border)] rounded-xl space-y-3 relative group">
            <button onclick="removeEntry('experience', ${index})" class="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] opacity-0 group-hover:opacity-100">×</button>
            <div class="grid grid-cols-2 gap-3">
                <input type="text" class="dossier-input exp-role" value="${escapeHtml(data.role || '')}" placeholder="Pozicija">
                <input type="text" class="dossier-input exp-comp" value="${escapeHtml(data.company || '')}" placeholder="Firma">
            </div>
            <input type="text" class="dossier-input exp-period" value="${escapeHtml(data.period || '')}" placeholder="Period">
            <textarea class="dossier-input exp-desc h-20 text-xs" placeholder="Opis">${escapeHtml(data.desc || '')}</textarea>
        </div>`;
    }
    if (type === 'certifications') {
        return `<div class="flex gap-2 group">
            <input type="text" class="dossier-input cert-name flex-grow" value="${escapeHtml(data.name || '')}" placeholder="Naziv">
            <input type="text" class="dossier-input cert-year w-24" value="${escapeHtml(data.year || '')}" placeholder="Godina">
            <button onclick="removeEntry('certifications', ${index})" class="text-red-500 opacity-30 group-hover:opacity-100">×</button>
        </div>`;
    }
    return "";
}

// ⚠️ NOVA FUNKCIJA: Čuva trenutno stanje DOM-a u masterDossier objekat u letu
function syncFormToDossier() {
    const container = document.getElementById('formContainer');
    if (!container || container.innerHTML.trim() === '') return;

    masterDossier.full_name = document.getElementById('fName')?.value.trim() || "";
    masterDossier.title = document.getElementById('fTitle')?.value.trim() || "";
    masterDossier.email = document.getElementById('fEmail')?.value.trim() || "";
    masterDossier.phone = document.getElementById('fPhone')?.value.trim() || "";
    masterDossier.location = document.getElementById('fLoc')?.value.trim() || "";
    masterDossier.linkedin = document.getElementById('fLinkedin')?.value.trim() || "";
    masterDossier.github = document.getElementById('fGithub')?.value.trim() || "";
    masterDossier.website = document.getElementById('fWebsite')?.value.trim() || "";
    masterDossier.motto = document.getElementById('fMotto')?.value.trim() || "";
    
    masterDossier.education = Array.from(document.querySelectorAll('.edu-degree')).map((el, i) => ({
        degree: el.value.trim(),
        school: document.querySelectorAll('.edu-school')[i]?.value.trim() || "",
        year: document.querySelectorAll('.edu-year')[i]?.value.trim() || ""
    }));
    
    masterDossier.experience = Array.from(document.querySelectorAll('.exp-role')).map((el, i) => ({
        role: el.value.trim(),
        company: document.querySelectorAll('.exp-comp')[i]?.value.trim() || "",
        period: document.querySelectorAll('.exp-period')[i]?.value.trim() || "",
        desc: document.querySelectorAll('.exp-desc')[i]?.value.trim() || ""
    }));
    
    masterDossier.skills = {
        technical: document.getElementById('skillTech')?.value.split(',').map(s => s.trim()).filter(Boolean) || [],
        industry: document.getElementById('skillInd')?.value.split(',').map(s => s.trim()).filter(Boolean) || [],
        soft: document.getElementById('skillSoft')?.value.split(',').map(s => s.trim()).filter(Boolean) || []
    };
    
    masterDossier.certifications = Array.from(document.querySelectorAll('.cert-name')).map((el, i) => ({
        name: el.value.trim(),
        year: document.querySelectorAll('.cert-year')[i]?.value.trim() || ""
    }));
}

function addEntry(type) {
    syncFormToDossier(); // ✅ Prvo sačuvaj sve što je korisnik do sada kucao!
    
    if (!masterDossier[type]) masterDossier[type] = [];
    
    if (type === 'education') masterDossier.education.push({ degree: "", school: "", year: "" });
    if (type === 'experience') masterDossier.experience.push({ role: "", company: "", period: "", desc: "" });
    if (type === 'certifications') masterDossier.certifications.push({ name: "", year: "" });
    
    renderProfessionalForm(); // Zatim iscrtaj formu sa starim tekstom + novim poljem
}

function removeEntry(type, index) {
    syncFormToDossier(); // ✅ Prvo sačuvaj sve
    
    if (masterDossier[type] && masterDossier[type].length > index) {
        masterDossier[type].splice(index, 1);
    }
    
    renderProfessionalForm();
}

function saveProfessionalDossier() {
    syncFormToDossier(); // Iskoristimo novu funkciju za očitavanje podataka
    
    // Optimizacija: očisti prazne redove pre snimanja u bazu
    masterDossier.education = masterDossier.education.filter(e => e.degree || e.school);
    masterDossier.experience = masterDossier.experience.filter(e => e.role || e.company);
    masterDossier.certifications = masterDossier.certifications.filter(c => c.name);
    
    localStorage.setItem('cv_espresso_dossier', JSON.stringify(masterDossier));
    
    if (typeof syncDossierToCloud === "function") {
        syncDossierToCloud(masterDossier);
    }
    
    document.getElementById('dossierEditor').classList.add('hidden');
    alert("✅ Sačuvano!");
}