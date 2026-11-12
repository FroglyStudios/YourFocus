# Sound-Packs für YourFocus

In YourFocus können Sound-Packs für den Timer über den Steam Workshop geteilt und abonniert werden.

## Struktur eines Sound-Packs:

Ein Sound-Pack-Ordner besteht aus:
1. `soundpack.json` – Metadaten des Sound-Packs
2. `session.mp3` (oder `.wav` / `.ogg`) – Audio-Datei, die abgespielt wird, wenn eine Gaming-Session endet (Start der Pause).
3. `break.mp3` (oder `.wav` / `.ogg`) – Audio-Datei, die abgespielt wird, wenn eine Pause endet (Rückkehr zum Spiel / Fokus).

### Beispiel `soundpack.json`:
```json
{
  "type": "soundpack",
  "name": "Sci-Fi Space Alert",
  "description": "Futuristische Sounds für Sessions und Pausen",
  "sessionSound": "session.mp3",
  "breakSound": "break.mp3"
}
```

## Integrierte Sound-Packs (Offline verfügbar):
- **Classic Chimes**: Angenehme, harmonische Glockenklänge
- **8-Bit Retro Arcade**: Nostalgische Chiptune-Arpeggios und Level-Up Jingles
- **Zen Meditation Bell**: Tiefe tibetische Klangschalen und Tempelglocken
- **Cyberpunk Synth**: Zukunftsweisende Synthesizer-Pings und Bässe

