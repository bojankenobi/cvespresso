/**
 * CVespresso - Supabase Auth (MINIMALNA RADNA VERZIJA)
 * Fokus: Login/Logout + background sync, bez auto-rendera
 */

// ============================================
// 1. KONFIGURACIJA
// ============================================
const SUPABASE_URL = 'https://vywoekaobnhbyoxuozbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5d29la2FvYm5oYnlveHVvemJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM2NjcsImV4cCI6MjA4NzY0OTY2N30.hph67oSWjYM414sOLXTz6tO75fiEWkzsvp3B-ViU1Vk';

// 1. KREIRANJE GLOBALNE KONEKCIJE (OVO REŠAVA SVE TVOJE BAGOVE!)
window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const _supabase = window._supabase; 

let syncLock = false;

// 2. LOGIN / LOGOUT
window.loginWithGoogle = async function() {
    try {
        await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    } catch (e) {
        console.error("Login error:", e);
        alert("Greška pri prijavi: " + e.message);
    }
};

window.logout = async function() {
    try {
        await _supabase.auth.signOut();
        localStorage.removeItem('cv_espresso_dossier');
        window.location.reload();
    } catch (e) {}
};

// 3. SYNC IZ CLOUD-A (Učitavanje dosijea iz baze)
window.fetchProfileFromCloud = async function(userId) {
    if (syncLock) return;
    syncLock = true;
    try {
        const { data, error } = await _supabase.from('profiles').select('cv_data').eq('id', userId).single();
        if (data && data.cv_data) {
            if (typeof masterDossier !== 'undefined') Object.assign(masterDossier, data.cv_data);
            localStorage.setItem('cv_espresso_dossier', JSON.stringify(data.cv_data));
        }
    } catch (e) {} finally { syncLock = false; }
};

// 4. SYNC NA CLOUD (Snimanje dosijea u bazu)
window.syncDossierToCloud = async function(dossierData) {
    if (syncLock) return;
    syncLock = true;
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return; 
        await _supabase.from('profiles').upsert({ id: user.id, cv_data: dossierData });
    } catch (e) {} finally { syncLock = false; }
};

// 5. AUTH STATE LISTENER (Pali/gasi dugmiće)
_supabase.auth.onAuthStateChange((event, session) => {
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    if (session) {
        if (btnLogin) btnLogin.classList.add('hidden');
        if (btnLogout) btnLogout.classList.remove('hidden');
        window.fetchProfileFromCloud(session.user.id);
    } else {
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (btnLogout) btnLogout.classList.add('hidden');
    }
});

// 6. INIT CHECK
(async () => {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session) window.fetchProfileFromCloud(session.user.id);
    } catch (e) {}
})();
