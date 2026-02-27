import os
import json
import re
import uuid       
import tempfile   
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from groq import Groq
from fpdf import FPDF

# --- NOVI IMPORTI ZA SLOWAPI ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Učitavanje eksternih konfiguracija (.env fajl)
load_dotenv()

# --- INICIJALIZACIJA LIMITERA ---
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="CVespresso API")

# Povezivanje limitera sa FastAPI aplikacijom i definisanje hendlera za grešku
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- DINAMIČKO PODEŠAVANJE PUTANJA ---
current_dir = os.path.dirname(os.path.realpath(__file__))
root_dir = os.path.dirname(current_dir)

# Montiranje statičkih fajlova
app.mount("/static", StaticFiles(directory=os.path.join(root_dir, "static")), name="static")

# Podešavanje Jinja2 šablona
templates = Jinja2Templates(directory=[root_dir, os.path.join(current_dir, "templates")])

# Putanja do fonta
FONT_PATH = os.path.join(current_dir, "arial.ttf")

# --- API KLIJENT ---
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key, max_retries=0)

# --- POMOĆNE FUNKCIJE ---
def sanitize_input(text: str) -> str:
    """Uklanja HTML tagove radi sprečavanja XSS napada."""
    if not text:
        return ""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

def sanitize_dossier(dossier: dict) -> dict:
    """Rekurzivno čisti sve tekstualne unose u dosijeu."""
    if isinstance(dossier, dict):
        return {k: sanitize_dossier(v) for k, v in dossier.items()}
    elif isinstance(dossier, list):
        return [sanitize_dossier(i) for i in dossier]
    elif isinstance(dossier, str):
        return sanitize_input(dossier)
    return dossier

def remove_temp_file(path: str):
    """Brisanje fajla u pozadini nakon slanja korisniku radi uštede prostora."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Greška pri brisanju temp fajla: {e}")

def create_pdf_header(pdf: FPDF, profile_data: dict):
    """Zajednička funkcija za iscrtavanje profesionalnog zaglavlja na CV-ju i Pismu"""
    pdf.set_font('ArialUni', size=20)
    pdf.set_text_color(26, 28, 30)
    pdf.cell(0, 10, profile_data.get("full_name", "CVespresso User"), ln=True, align='L')
    
    # --- KONTAKT INFORMACIJE (Email, Telefon, Lokacija) ---
    pdf.set_font('ArialUni', size=9)
    pdf.set_text_color(100, 100, 100)
    
    contact_info = []
    if profile_data.get("email"): contact_info.append(profile_data.get("email"))
    if profile_data.get("phone"): contact_info.append(profile_data.get("phone"))
    if profile_data.get("location"): contact_info.append(profile_data.get("location"))
    
    if contact_info:
        pdf.cell(0, 5, " | ".join(contact_info), ln=True, align='L')

    # --- SOCIJALNE MREŽE I PORTFOLIO ---
    links = []
    if profile_data.get("linkedin"): 
        clean_in = profile_data.get("linkedin").replace("https://", "").replace("http://", "").rstrip('/')
        links.append(f"LinkedIn: {clean_in}")
    if profile_data.get("github"): 
        clean_git = profile_data.get("github").replace("https://", "").replace("http://", "").rstrip('/')
        links.append(f"GitHub: {clean_git}")
    if profile_data.get("website"): 
        clean_web = profile_data.get("website").replace("https://", "").replace("http://", "").rstrip('/')
        links.append(f"Web: {clean_web}")
        
    if links:
        pdf.cell(0, 5, " | ".join(links), ln=True, align='L')
    
    # Linija razdvajanja ispod zaglavlja
    pdf.set_draw_color(200, 200, 200)
    current_y = pdf.get_y() + 3
    pdf.line(10, current_y, 200, current_y)
    pdf.ln(8)

    # Prebacivanje na glavnu crnu boju za ostatak teksta
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('ArialUni', size=11)


# Model podataka
class FullDossierRequest(BaseModel):
    job_description: str
    user_dossier: dict = None 

# Anonimni default profil radi zaštite privatnosti
DEFAULT_MASTER_DOSSIER = {
    "full_name": "Korisnik Aplikacije",
    "title": "Profesionalac",
    "experience": "Primer radnog iskustva koji AI treba da prilagodi.",
    "projects": [],
    "certifications": []
}

# --- RUTE ---

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    """Servira glavni UI aplikacije"""
    try:
        return templates.TemplateResponse("index.html", {"request": request})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template Error: {str(e)}")

@app.get("/sw.js")
async def serve_sw():
    # Servira sw.js sa root-a kako bi PWA radio pravilno
    return FileResponse(os.path.join(root_dir, "static", "sw.js"), media_type="application/javascript")

@app.get("/manifest.json")
async def serve_manifest():
    # Servira manifest sa root-a
    return FileResponse(os.path.join(root_dir, "static", "manifest.json"), media_type="application/json")

@app.post("/generate-pdf/")
@limiter.limit("5/minute") 
async def generate_pdf(request: Request, dossier_req: FullDossierRequest, background_tasks: BackgroundTasks, lang: str = Query("sr", enum=["sr", "en"])):
    """Generiše PDF CV na osnovu Master JSON-a i oglasa"""
    
    clean_job_desc = sanitize_input(dossier_req.job_description)
    profile_data = sanitize_dossier(dossier_req.user_dossier) if dossier_req.user_dossier else DEFAULT_MASTER_DOSSIER
    
    # ensure_ascii=False osigurava da AI model pravilno vidi naša slova (š, đ, ž, ć, č)
    json_dossier = json.dumps(profile_data, ensure_ascii=False)
    
    if lang == "sr":
        sys_msg = """Ti si inženjer za optimizaciju CV-ja (ATS sistemi).
        TVOJ JEDINI ZADATAK JE DA PREFORMULIŠEŠ SADRŽAJ I STROGO GA UPAKUJEŠ U ZADATI ŠABLON.
        STROGA PRAVILA:
        1. KREATIVNOST U STRUKTURI JE ZABRANJENA.
        2. BEZ KONTAKT PODATAKA (ime, email, telefon).
        3. ISKLJUČIVO EKAVICA. Nema ijekavice.
        4. Rezime piši u skrivenom prvom licu."""
        
        user_prompt = f"""
        Dosije: {json_dossier}
        Oglas: {clean_job_desc}
        
        ZADATAK:
        Preformuliši radno iskustvo i rezime. Ispiši sadržaj STROGO koristeći ovaj format:

        PROFESIONALNI REZIME
        [Snažan rezime u 3 rečenice prilagođen oglasu]

        VEŠTINE
        [Lista ključnih veština odvojenih zarezima, izvučenih iz dosijea]

        RADNO ISKUSTVO
        [Pozicija iz dosijea] | [Kompanija iz dosijea] | [Period iz dosijea]
        • [Akcioni bullet poen prilagođen oglasu]
        • [Akcioni bullet poen prilagođen oglasu]
        
        VAŽNO ZA ISKUSTVO: MORAŠ navesti SVA radna iskustva iz dosijea kako bi se sačuvao hronološki red! Za relevantne poslove napiši 2-3 bullet poena. Za starije ili nerelevantne poslove ispiši SAMO naslovnu liniju (Pozicija | Firma | Period) i izostavi bullet poene.

        OBRAZOVANJE
        • [Stepen obrazovanja/Diploma], [Škola] ([Godina])

        SERTIFIKATI
        • [Naziv sertifikata] ([Godina])
        """
    else:
        sys_msg = """You are an elite ATS-Optimization Engineer.
        YOUR ONLY JOB IS TO TRANSLATE, TAILOR THE CONTENT, AND STRICTLY PACK IT INTO THE TEMPLATE.
        STRICT RULES:
        1. TRANSLATE EVERYTHING TO ENGLISH (Job titles, skills, degrees, etc.).
        2. STRUCTURAL CREATIVITY IS FORBIDDEN.
        3. NO CONTACT INFO.
        4. First-person professional summary."""
        
        user_prompt = f"""
        Dossier: {json_dossier}
        Job: {clean_job_desc}
        
        TASK:
        Translate the dossier to English and tailor the candidate's experience. Output the result STRICTLY using the exact format below (copy ALL-CAPS headers):

        PROFESSIONAL SUMMARY
        [3 impactful sentences tailored to the job in English]

        SKILLS
        [Comma-separated list of translated, relevant skills in English]

        WORK EXPERIENCE
        [Translated Job Title] | [Company] | [Period]
        • [Action-oriented bullet point targeting JD keywords in English]
        • [Action-oriented bullet point targeting JD keywords in English]

        CRITICAL FOR EXPERIENCE: You MUST list EVERY job from the dossier to keep the chronological timeline intact. Do not skip any jobs! For relevant roles, provide 2-3 tailored bullets. For older or irrelevant roles, just list the Title, Company, and Period with NO bullets.

        EDUCATION
        • [Translated Degree], [School] ([Year])

        CERTIFICATIONS
        • [Translated Certificate Name] ([Year])
        """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        tailored_text = completion.choices[0].message.content
    except Exception as e:
        print(f"🔥 GROQ DETALJNA GREŠKA: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

    try:
        pdf = FPDF()
        pdf.add_page()
        
        if not os.path.exists(FONT_PATH):
            raise FileNotFoundError(f"Font nije pronađen na putanji: {FONT_PATH}")
            
        pdf.add_font('ArialUni', '', FONT_PATH, uni=True)
        
        # Generiši zaglavlje
        create_pdf_header(pdf, profile_data)
        
        # --- NOVI RENDERER (Estetika i ATS forma) ---
        clean_pdf_text = tailored_text.replace('#', '').replace('**', '').replace('* ', '• ')
        
        # Ključne reči koje okidaju crtanje naslova i linija
        headers = [
            "PROFESIONALNI REZIME", "VEŠTINE", "RADNO ISKUSTVO", "OBRAZOVANJE", "SERTIFIKATI",
            "PROFESSIONAL SUMMARY", "SKILLS", "WORK EXPERIENCE", "EDUCATION", "CERTIFICATIONS"
        ]

        for line in clean_pdf_text.split('\n'):
            line = line.strip()
            if not line:
                pdf.ln(2) # Mali razmak za prazne redove
                continue
            
            upper_line = line.upper()
            
            # 1. AKO JE NASLOV SEKCIJE
            if any(h in upper_line for h in headers) and len(line) < 30:
                pdf.ln(6)
                pdf.set_font('ArialUni', size=11)
                pdf.set_text_color(0, 0, 0) # Crna
                pdf.cell(0, 6, upper_line, ln=True)
                
                # Crtanje horizontalne razdelne linije
                current_y = pdf.get_y()
                pdf.set_draw_color(100, 100, 100) # Siva linija
                pdf.line(10, current_y, 200, current_y)
                pdf.ln(3)
                
            # 2. AKO JE PODNASLOV ZA POSAO (Pozicija | Firma | Datum)
            elif "|" in line and "•" not in line:
                pdf.set_font('ArialUni', size=10)
                pdf.set_text_color(0, 0, 0) # Crna, naglašena
                pdf.cell(0, 7, line, ln=True)
                
            # 3. AKO SU BULLET POENI (ili obrazovanje/sertifikati)
            elif line.startswith("•") or line.startswith("-"):
                pdf.set_font('ArialUni', size=9)
                pdf.set_text_color(50, 50, 50) # Tamno siva za lepši kontrast
                pdf.set_x(14) # Uvlačenje teksta udesno
                pdf.multi_cell(0, 5, line)
                pdf.set_x(10) # Vraćanje margine
                
            # 4. OBIČAN TEKST (Rezime, Veštine)
            else:
                pdf.set_font('ArialUni', size=9)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(0, 5, line)
        temp_dir = tempfile.gettempdir()
        unique_id = uuid.uuid4().hex
        safe_file_path = os.path.join(temp_dir, f"CVespresso_{unique_id}_{lang}.pdf")
        
        pdf.output(safe_file_path)
        
        # Zakaži automatsko brisanje fajla u pozadini nakon slanja responsa
        background_tasks.add_task(remove_temp_file, safe_file_path)
        
        return FileResponse(
            path=safe_file_path, 
            filename=f"CVespresso_{lang}.pdf", 
            media_type='application/pdf'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Error: {str(e)}")


@app.post("/generate-cover-letter/")
@limiter.limit("5/minute")
async def generate_cover_letter(request: Request, dossier_req: FullDossierRequest, background_tasks: BackgroundTasks, lang: str = Query("sr", enum=["sr", "en"])):
    """Generiše propratno pismo prilagođeno poziciji"""
    
    clean_job_desc = sanitize_input(dossier_req.job_description)
    profile_data = sanitize_dossier(dossier_req.user_dossier) if dossier_req.user_dossier else DEFAULT_MASTER_DOSSIER
    
    json_dossier = json.dumps(profile_data, ensure_ascii=False)
    
    if lang == "sr":
        sys_msg = """Ti si vrhunski HR stručnjak za pisanje propratnih pisama (Cover Letters).
        TVOJ JEDINI ZADATAK JE DA NAPIŠEŠ ČIST TEKST PISMA. BEZ IKAKVOG UVODA ILI OBJAŠNJENJA PRE PISMA.
        STROGA PRAVILA:
        1. BEZ KONTAKT PODATAKA I DATUMA na vrhu (sistem to sam dodaje).
        2. ISKLJUČIVO EKAVICA. Nema ijekavice.
        3. Pismo mora biti koncizno, profesionalno i uverljivo."""
        
        user_prompt = f"""
        Dosije: {json_dossier}
        Oglas: {clean_job_desc}
        
        ZADATAK:
        Napiši propratno pismo prateći ISKLJUČIVO ovu formu:

        Poštovani/a [Ime iz oglasa ili 'Timu za zapošljavanje' ako nema imena],

        [Uvod: Jasno navedi za koju poziciju apliciraš i zašto si idealan kandidat za kompaniju.]

        [Razrada: U 1-2 kratka pasusa poveži 2-3 ključna dostignuća ili veštine iz dosijea sa najvažnijim zahtevima iz oglasa. Pokaži konkretnu vrednost koju donosiš.]

        [Zaključak: Kratak poziv na akciju/intervju i zahvalnost na izdvojenom vremenu.]

        Srdačan pozdrav,
        [Puno Ime kandidata iz dosijea]
        """
    else:
        sys_msg = """You are an elite Executive Career Coach specializing in Cover Letters.
        YOUR ONLY JOB IS TO WRITE THE CORE LETTER TEXT. NO INTRODUCTIONS, NO CHAT.
        STRICT RULES:
        1. TRANSLATE ALL RELEVANT CONTENT TO ENGLISH based on the dossier.
        2. NO CONTACT INFO OR DATES at the top (the system adds this automatically).
        3. The letter must be concise, confident, and highly tailored."""
        
        user_prompt = f"""
        Dossier: {json_dossier}
        Job: {clean_job_desc}
        
        TASK:
        Write a cover letter translating the candidate's background to English. STRICTLY use this format:

        Dear [Hiring Manager Name if in JD, otherwise 'Hiring Team'],

        [Opening: State the position you are applying for and a strong hook about why you are a great fit.]

        [Body: In 1-2 concise paragraphs, connect 2-3 key achievements or skills from the dossier to the most critical requirements in the job description. Show measurable impact.]

        [Conclusion: A brief call to action for an interview and gratitude for their time.]

        Sincerely,
        [Candidate's Full Name from dossier]
        """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5
        )
        cl_text = completion.choices[0].message.content
        
        pdf = FPDF()
        pdf.add_page()
        pdf.add_font('ArialUni', '', FONT_PATH, uni=True)
        
        # Generiši ISTE kontakt podatke u zaglavlju i za Cover Letter
        create_pdf_header(pdf, profile_data)
        
        pdf.multi_cell(0, 7, cl_text.replace('**', ''))
        
        temp_dir = tempfile.gettempdir()
        unique_id = uuid.uuid4().hex
        safe_file_path = os.path.join(temp_dir, f"CoverLetter_{unique_id}_{lang}.pdf")
        
        pdf.output(safe_file_path)
        
        # Zakaži automatsko brisanje
        background_tasks.add_task(remove_temp_file, safe_file_path)
        
        return FileResponse(
            path=safe_file_path, 
            filename=f"Cover_Letter_{lang}.pdf", 
            media_type='application/pdf'
        )
        
    except Exception as e:
        print(f"🔥 GROQ DETALJNA GREŠKA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))