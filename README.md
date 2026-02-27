# ☕ CVespresso

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E.svg)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg)](https://tailwindcss.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq_API-f55036.svg)](https://groq.com/)

*(Scroll down for Serbian version / Srpska verzija se nalazi ispod)*

**CVespresso** is an advanced, AI-powered web application designed to instantly generate ATS-optimized Resumes (CVs) and Cover Letters tailored to specific job descriptions. 

By leveraging the blazing-fast inference of the **Groq AI** and a robust Python backend, CVespresso ensures that your applications pass through Applicant Tracking Systems flawlessly while maintaining a clean, professional, Silicon Valley-grade design.

## ✨ Key Features

* **🤖 AI-Tailored Content**: Uses the lightning-fast Groq API to analyze job descriptions and rewrite your master dossier to match the exact requirements in seconds.
* **📄 ATS-Friendly PDF Export**: Generates perfectly formatted, ATS-readable PDFs using a custom Python backend (`fpdf2`).
* **☁️ Cloud Sync & Archive**: Master dossier and application history are securely synced to the cloud using **Supabase** (PostgreSQL & Auth). Never lose your data.
* **🔐 Seamless Authentication**: Quick and secure login using Google OAuth.
* **📱 PWA Ready**: Installable as a native app on mobile devices and desktops.

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS
* **Backend**: Python, FastAPI
* **Database & Auth**: Supabase
* **AI Engine**: Groq API
* **Deployment**: Vercel (Backend + Frontend) & GitHub

## 🚀 Local Setup & Installation

**1. Clone the repository**
```bash
git clone [https://github.com/bojankenobi/cvespresso.git](https://github.com/bojankenobi/cvespresso.git)
cd cvespresso
2. Create and activate a virtual environment

Bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
3. Install dependencies

Bash
pip install -r requirements.txt
4. Environment Variables
Create a .env file in the root directory and add your API keys:

Code snippet
GROQ_API_KEY=your_groq_api_key
(Note: Supabase keys are configured directly in the frontend auth.js file for anonymous client access).

5. Run the application

Bash
uvicorn api.main:app --reload
Open your browser and navigate to http://127.0.0.1:8000.

☕ CVespresso (Srpski)
CVespresso je napredna web aplikacija pokretana veštačkom inteligencijom, dizajnirana za instant generisanje ATS-optimizovanih CV-jeva i propratnih pisama prilagođenih specifičnim oglasima za posao.

Koristeći neverovatnu brzinu Groq veštačke inteligencije i stabilnog Python backenda, CVespresso osigurava da tvoje prijave besprekorno prolaze kroz ATS (Applicant Tracking Systems) filtere, zadržavajući čist i profesionalan inženjerski dizajn.

✨ Glavne Funkcionalnosti
🤖 AI Prilagođavanje: Koristi Groq API za super-brzu analizu oglasa za posao i inteligentno prilagođavanje tvog Master Dosijea tačnim zahtevima pozicije.

📄 ATS PDF Eksport: Generiše savršeno formatirane, ATS-čitljive PDF dokumente putem custom Python backenda.

☁️ Cloud Sinhronizacija i Arhiva: Master dosije i istorija svih prijava (arhiva) se bezbedno čuvaju u cloud-u pomoću Supabase baze podataka.

🔐 Autentifikacija: Brzo i bezbedno prijavljivanje pomoću Google OAuth sistema.

📱 PWA Standard: Aplikacija se može instalirati direktno na mobilni telefon ili desktop računar.

🛠️ Tehnologije
Frontend: HTML5, Vanilla JavaScript, Tailwind CSS

Backend: Python, FastAPI

Baza i Auth: Supabase (PostgreSQL)

AI Engine: Groq API

Hosting/Deploy: Vercel

🚀 Lokalna Instalacija
1. Kloniranje repozitorijuma

Bash
git clone [https://github.com/bojankenobi/cvespresso.git](https://github.com/bojankenobi/cvespresso.git)
cd cvespresso
2. Kreiranje i aktivacija virtuelnog okruženja

Bash
python -m venv venv
# Za Windows:
venv\Scripts\activate
# Za Mac/Linux:
source venv/bin/activate
3. Instalacija paketa

Bash
pip install -r requirements.txt
4. Konfiguracija okruženja
Napravi .env fajl u glavnom folderu i unesi svoj API ključ:

Code snippet
GROQ_API_KEY=tvoj_groq_api_kljuc
5. Pokretanje servera

Bash
uvicorn api.main:app --reload
Otvori pretraživač i poseti http://127.0.0.1:8000.

👨‍💻 Autor / Author
Bojan Pejić

Portfolio: bojanpejic.com

GitHub: @bojankenobi

Motto: "Automation, automation, automation."
