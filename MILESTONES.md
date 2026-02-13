# RPS LIGHT – Milestones (1–8)

## 1) Fundament & Projektstruktur
- Basislayout, Navigation (Dashboard / Stammdaten / Historie / Export-Import)
- UI-Grundregeln (große Kacheln/Buttons, min-h 48)
- Zustand-Store + Persist-Basis

## 2) Stammdaten (ohne JSON-Standardansicht)
- CRUD für relevante Stammdaten
- Standardansicht als Form/UI, optional „Erweitert“ für JSON
- Validierungen und sichere Defaults

## 3) Auftrag anlegen + Nummern-Registry
- Kachel „Auftrag anlegen“ auf Dashboard
- Erstellung eines Auftrags mit eindeutiger Auftragsnummer
- Nie-Wiederverwenden-Regel per persistenter Registry

## 4) Linien-Timeline als Masterplan
- 4 Linien-Spalten im Dashboard
- Timeline je Linie mit FillStart→FillEnd
- DnD/Interaktion für Plananpassung inkl. Guards

## 5) RW derived + Konfliktlogik
- Rückwärtsrechnung MakeStart/MakeEnd aus Linienplan
- RW-Blockierung MakeStart→FillEnd
- Hard-Stop bei RW-Overlap inkl. Konflikttext

## 6) Statusfluss + Locks
- Status: planned/made/running/done
- Fachregeln für erlaubte Übergänge
- Lockverhalten: made lockt RW bis FillEnd

## 7) IST-Update & Timeline-UX
- IST-Update mit Anchor „jetzt"
- Recalc von FillEnd aus Rest/Filled
- Zeitfenster, Zoom, Raster, Jetzt-Linie

## 8) Historie + Export/Import + Stabilisierung
- Historie-Seite mit nachvollziehbaren Änderungen
- Export/Import für relevante Daten
- Hardening: Date-Guards überall, White-Screen-Schutz, Feinschliff
