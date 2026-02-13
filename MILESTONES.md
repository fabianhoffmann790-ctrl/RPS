# RPS LIGHT – Milestones (1–8)

## Milestone 1 — Projektgrundlage & Shell

### DoD
- Vite + React + TS + Tailwind laufen (`npm run dev`)
- Layout: Menü oben links, Seiten: Dashboard / Stammdaten / Historie / Export-Import
- Große UI-Skalierung (Kacheln/Buttons)

## Milestone 2 — Store/Persist + Default-Stammdaten + Unique OrderNo

### DoD
- Zustand Persist (LocalStorage): `masterdata` / `orders` / `assignments` / `meta` / `history`
- `usedOrderNumbers` verhindert doppelte Auftragsnummern dauerhaft
- Default-Stammdaten (Produkte, Linienraten, RWs) vorhanden

## Milestone 3 — Auftrag anlegen (Produktsuche + Validierung)

### DoD
- Autocomplete-Suche nach Name/Artikelnummer
- Felder: Menge, Gebinde, Linie, Start, optionale Auftragsnummer (oder auto)
- Create schreibt History, Auftrag erscheint in Linie

## Milestone 4 — Linienboard (Liste + Drag&Drop + Reflow)

### DoD
- 4 Linien nebeneinander, OrderCards
- DnD innerhalb Linie
- Reflow: lückenlos hintereinander
- Edit/Move loggt History

## Milestone 5 — Zeitstrahl Core (keine Invalid Dates)

### DoD
- Zeitfenster konfigurierbar (Default 06–22) als echte Dates gebaut
- Zoom 15 / 30 / 60 + Raster sichtbar
- Jetzt-Linie + "Jump to now"
- Timeline rendert nie mit invaliden Dates (Guards + Fallback statt Crash)

## Milestone 6 — RW Board (JIT derived + Overlap Hard-Stop + 2 Wege Zuweisung)

### DoD
- RW-Belegung: `MakeStart → FillEnd` (JIT, BufferMin)
- RW-Block zweigeteilt
- Overlap blockiert + Konflikttext
- Assignment via Dropdown **und** DnD (Drop auf RW tile oder timeline)

## Milestone 7 — Status/Locks + IST-Update (Anchor)

### DoD
- Status: `planned` / `made` / `running` / `done`
- `made` lockt RW bis FillEnd (kein Umhängen)
- IST-Update: `remaining` / `filled` + Anchor=jetzt → `FillEnd` neu, Timelines sofort aktualisiert

## Milestone 8 — Stammdaten-UI + Historie + Export/Import + Morning Snapshot v1

### DoD
- Stammdaten als Form-Kacheln (Produkte / Linienraten / RWs), optional „Erweitert: JSON“
- History-Seite mit Filter (orderNo / Produkt / Zeitraum)
- Export/Import JSON (`usedOrderNumbers` union)
- Morning Snapshot Panel (IST schnell erfassen)
