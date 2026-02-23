# SBKdirekt Pest-AI Webapp (Foto → KI-Erkennung → Profi-Report)

## Was ist das?
Eine Webapp, in der man ein Foto hochlädt. Die KI erkennt den Schädling und erzeugt einen Profi-Report
(IPM, Ursachen, Inspektion, Maßnahmen, PSA, Dokumentation, Follow-up). Ausgabe ist strukturiertes JSON
und wird im UI sauber angezeigt.

## Einmalig nötig (unvermeidbar)
Du brauchst nur:
1) einen Netlify Account
2) einen OpenAI API Key als Umgebungsvariable in Netlify: `OPENAI_API_KEY`

Mehr musst du inhaltlich nicht bauen.

## Deploy (Netlify)
- Repo zu GitHub hochladen (oder ZIP entpacken und per Netlify "Deploy manually" geht auch)
- Netlify → New site → Repository auswählen
- Environment Variables:
  - OPENAI_API_KEY = <dein key>
- Deploy → fertig

## Lokal testen (optional)
```bash
npm install
npm run dev
```

## Sicherheit/Qualität
- Die Function gibt keine Biozid-Mischungen/Rezepte aus, nur allgemeine Profi-Hinweise (Zulassung/Etikett).
- Foto allein ist unsicher → Limitations + fehlende Zusatzinfos werden immer ausgegeben.
