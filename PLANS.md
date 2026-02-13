# RPS LIGHT – Plan & Contract

## RPS-Zeitstrahl Contract (verbindlich)

1. **Linie ist der Masterplan**
   - Jede Linie plant den Produktionsblock von `FillStart` bis `FillEnd`.
   - Die Linienplanung ist die führende Wahrheit für Start-/Endzeiten der Abfüllung.

2. **RW ist derived + Just-in-Time (rückwärts gerechnet)**
   - `MakeEnd = FillStart - BufferMin` (Default `BufferMin = 0`).
   - `MakeStart = MakeEnd - MakeDur`.
   - Der RW-Block reserviert den Zeitraum **`MakeStart → FillEnd`**.

3. **RW-Overlap = Hard-Stop**
   - Überlappungen auf RW-Ressourcen sind nicht erlaubt.
   - Konflikte blockieren die Planung/Änderung und zeigen eine klare Konfliktmeldung.

4. **Auftragsnummern sind global eindeutig und nie wiederverwendbar**
   - Registry mit Persistenz.
   - Gilt auch nach Löschen/Archivieren eines Auftrags.

5. **Statusmodell**
   - Erlaubte Stati: `planned` / `made` / `running` / `done`.
   - `made` lockt die RW-Reservierung bis `FillEnd`.

6. **IST-Update mit Anchor (Jetzt)**
   - Bei IST-Updates wird mit Zeitanker „jetzt“ gerechnet.
   - Restmengen/Filled-Progress führen zu neuem `FillEnd` ab „jetzt“.

7. **Timeline-Pflichtfeatures**
   - Zeitfenster
   - Zoom
   - Raster
   - Jetzt-Linie

8. **Defensive Datumslogik (No White Screen)**
   - Jede Timeline arbeitet mit Date-Guards (`date-fns/isValid`).
   - Ungültige Datumswerte dürfen nie zum Crash führen.

9. **Stammdaten-UX**
   - Keine JSON-Textareas in der Standardansicht.
   - Optionaler Bereich „Erweitert“ für Rohdatenansicht.

---

## ExecPlan – How we work

- Wir arbeiten **strict milestone-by-milestone**.
- Pro Milestone immer in dieser Reihenfolge:
  1. Kurzplan (Scope, Risiken, DoD)
  2. Implementierung nur im Milestone-Scope
  3. Kurze Test-Checkliste (Happy Path + Guard Cases)
  4. Commit auf Feature-Branch
- Nichts vorziehen: keine Funktionen aus späteren Milestones vorab bauen.
- Bei Konflikten gilt: Stabilität und Bedienbarkeit für den Betrieb haben Priorität.
