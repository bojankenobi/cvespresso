/**
 * CVespresso - API Bridge & Archive Manager
 * Verzija: 8.1 (Zaključavanje dugmadi + Vidljivo Delete dugme)
 */

document.getElementById('btnCV').addEventListener('click', () => generate('cv'));
document.getElementById('btnCL').addEventListener('click', () => generate('cl'));

let currentSession = { jobDesc: "", appId: null };

function cleanText(text) {
    return text ? text.replace(/<[^>]*>?/gm, '').trim() : "";
}

// OTVARANJE PDF PREVIEW MODALA
function openPdfPreview(url, fileName) {
    const pdfModal = document.getElementById('pdfModal');
    const pdfFrame = document.getElementById('pdfFrame');
    const btnDownload = document.getElementById('btnDownloadPdf');
    const btnClose = document.getElementById('btnClosePdf');

    if (!pdfModal || !pdfFrame) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
    }
    pdfFrame.src = url;
    pdfModal.classList.remove('hidden');

    btnDownload.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    btnClose.onclick = () => {
        pdfModal.classList.add('hidden');
        setTimeout(() => { pdfFrame.src = ""; window.URL.revokeObjectURL(url); }, 300);
    };
}

// GLAVNA FUNKCIJA
async function generate(type) {
    const descField = document.getElementById('jobDesc');
    const desc = cleanText(descField.value);

    if (!desc) { alert("Zalepite oglas za posao."); return; }

    const db = window._supabase || window.supabase;
    let user = null;
    if (db) {
        const { data } = await db.auth.getUser();
        user = data?.user;
    }

    const isNewJob = (desc !== currentSession.jobDesc);
    let companyName = "Nova Aplikacija";

    if (isNewJob && user) {
        companyName = prompt("Unesite ime kompanije za koju aplicirate (za arhivu):", "Ime kompanije");
        if (!companyName) companyName = "Nepoznata Kompanija";
    }

    let currentDossier = JSON.parse(localStorage.getItem('cv_espresso_dossier')) || (typeof masterDossier !== 'undefined' ? masterDossier : {});
    currentDossier.full_name = cleanText(currentDossier.full_name || "User");

    // ZAKLJUČAVANJE OBA DUGMETA DA SPREČIMO DUPLE KARTICE
    descField.style.opacity = "0.5";
    descField.disabled = true;
    
    const btnCV = document.getElementById('btnCV');
    const btnCL = document.getElementById('btnCL');
    const originalTextCV = btnCV.innerText;
    const originalTextCL = btnCL.innerText;
    
    btnCV.disabled = true;
    btnCL.disabled = true;
    
    if (type === 'cv') btnCV.innerText = "Cooking...";
    else btnCL.innerText = "Cooking...";

    // Osigurač za jezik
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'sr';

    try {
        const response = await fetch(`${type === 'cv' ? '/generate-pdf/' : '/generate-cover-letter/'}?lang=${lang}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_description: desc, user_dossier: currentDossier })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const filePrefix = type === 'cv' ? 'CV' : 'CoverLetter';
            const fileName = `CVespresso_${filePrefix}_${currentDossier.full_name.replace(/\s+/g, '_')}_${lang}.pdf`;

            openPdfPreview(url, fileName);

            // UPIS U BAZU
            if (user && isNewJob) {
                const newApp = {
                    user_id: user.id,
                    company_name: companyName,
                    job_description: desc,
                    cv_data: currentDossier
                };

                const { data, error } = await db.from('applications').insert(newApp).select();
                if (!error && data) {
                    currentSession.jobDesc = desc;
                    currentSession.appId = data[0].id;
                    loadApplications();
                }
            }
        } else {
            alert("❌ Python server prijavio grešku.");
        }
    } catch (err) {
        console.error("🚨 Mrežna greška:", err);
    } finally {
        // OTKLJUČAVANJE
        descField.style.opacity = "1";
        descField.disabled = false;
        btnCV.innerText = originalTextCV;
        btnCL.innerText = originalTextCL;
        btnCV.disabled = false;
        btnCL.disabled = false;
    }
}

// REGENERACIJA IZ ARHIVE (Popravljen event bag)
window.rebuildFromArchive = async function(event, appId, type) {
    const btnId = event.currentTarget;
    const originalText = btnId.innerText;
    
    try {
        const db = window._supabase || window.supabase;
        const { data, error } = await db.from('applications').select('*').eq('id', appId).single();
        if (error || !data) throw error;

        btnId.innerText = "Wait...";
        btnId.disabled = true;

        const lang = (typeof currentLang !== 'undefined') ? currentLang : 'sr';

        const response = await fetch(`${type === 'cv' ? '/generate-pdf/' : '/generate-cover-letter/'}?lang=${lang}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_description: data.job_description, user_dossier: data.cv_data })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            openPdfPreview(url, `CVespresso_Archive_${lang}.pdf`);
        } else {
            throw new Error("Server vratio grešku pri generisanju.");
        }
    } catch (err) { 
        console.error(err);
        alert("Greška pri preuzimanju iz arhive."); 
    } finally {
        btnId.innerText = originalText;
        btnId.disabled = false;
    }
}

async function loadApplications() {
    const listContainer = document.getElementById('applicationsList');
    if (!listContainer) return;

    const db = window._supabase || window.supabase;
    if (!db) return;

    try {
        const { data: { user } } = await db.auth.getUser();
        if (!user) return;

        const { data, error } = await db.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;

        if (data.length === 0) {
            listContainer.innerHTML = `<div class="text-center opacity-20 text-[10px] uppercase font-bold tracking-widest mt-10">Nema sačuvanih aplikacija</div>`;
            return;
        }

        let html = '';
        data.forEach(app => {
            const date = new Date(app.created_at).toLocaleDateString('sr-RS');
            const company = app.company_name || "Nepoznata Kompanija";
            
            // Ažuriran HTML kartice sa vidljivim dugmetom za brisanje
            html += `
            <div class="p-4 border border-[var(--border)] rounded-xl relative group hover:border-[var(--border-hover)] bg-[var(--bg)] shadow-sm mt-3">
                
                <button onclick="deleteApplication('${app.id}')" class="absolute top-2 right-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-all" title="Obriši aplikaciju">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </button>

                <h4 class="font-bold text-xs uppercase tracking-wider mb-1 pr-8 truncate" title="${company}">${cleanText(company)}</h4>
                <p class="text-[9px] opacity-40 mb-3">${date}</p>
                <div class="flex gap-2 items-center">
                    <button onclick="rebuildFromArchive(event, '${app.id}', 'cv')" class="text-[8px] border border-[var(--border)] px-2 py-2 rounded uppercase font-bold tracking-widest flex-1 hover:border-gray-400 transition-colors">CV</button>
                    <button onclick="rebuildFromArchive(event, '${app.id}', 'cl')" class="text-[8px] border border-[var(--border)] px-2 py-2 rounded uppercase font-bold tracking-widest flex-1 hover:border-gray-400 transition-colors">Letter</button>
                </div>
            </div>`;
        });
        listContainer.innerHTML = html;
    } catch (err) { console.error("Greška pri fioci:", err); }
}

window.deleteApplication = async function(id) {
    if (!confirm("Obrisati ovu aplikaciju iz arhive?")) return;
    try {
        const db = window._supabase || window.supabase;
        await db.from('applications').delete().eq('id', id);
        if (currentSession.appId === id) {
            currentSession.jobDesc = "";
            currentSession.appId = null;
        }
        loadApplications(); 
    } catch (err) { alert("Greška pri brisanju."); }
}

document.addEventListener('DOMContentLoaded', () => {
    const interval = setInterval(() => {
        const db = window._supabase || window.supabase;
        if (db) {
            clearInterval(interval);
            db.auth.onAuthStateChange((event, session) => {
                if (session) loadApplications();
            });
            db.auth.getUser().then(({data}) => {
                if(data?.user) loadApplications();
            });
        }
    }, 500);
});