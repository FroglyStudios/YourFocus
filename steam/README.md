# Steam Integration Setup

## Erforderliche Schritte für Steam-Veröffentlichung:

### 1. Steamworks SDK Setup
- Registrieren Sie sich als Steam-Entwickler bei https://partner.steamgames.com/
- Erstellen Sie eine neue App in Steamworks
- Notieren Sie sich Ihre Steam App ID

### 2. Achievement Icons erstellen
Erstellen Sie für jedes Achievement zwei Icons:
- **Farbig (unlocked)**: 64x64 PNG, JPG oder TGA
- **Grau (locked)**: 64x64 PNG, JPG oder TGA

Benötigte Icons:
- `achievement_first_launch.jpg` / `achievement_first_launch_gray.jpg`
- `achievement_first_session.jpg` / `achievement_first_session_gray.jpg`
- `achievement_dedicated.jpg` / `achievement_dedicated_gray.jpg`
- `achievement_focused.jpg` / `achievement_focused_gray.jpg`
- `achievement_master.jpg` / `achievement_master_gray.jpg`

### 3. Steam Store Assets
Erstellen Sie folgende Assets für den Steam Store:
- **Header Capsule**: 460x215 px
- **Small Capsule**: 231x87 px
- **Main Capsule**: 616x353 px
- **Library Assets**: Verschiedene Größen
- **Screenshots**: Mindestens 5 Screenshots in 1920x1080

### 4. Konfiguration
1. Ersetzen Sie `480` in `steam_appid.txt` mit Ihrer echten Steam App ID
2. Laden Sie `achievements.json` in Steamworks hoch
3. Laden Sie alle Achievement-Icons hoch
4. Konfigurieren Sie Store-Seite mit `store_description.txt`

### 5. Build für Steam
```bash
# Setzen Sie Ihre Steam App ID
export STEAM_APP_ID=YOUR_APP_ID

# Build für Steam
npm run build-electron
```

### 6. Steam Depot Setup
- Erstellen Sie Depots für Windows, macOS, Linux
- Laden Sie die gebauten Executables hoch
- Testen Sie mit Steam SDK

### 7. Testing
- Verwenden Sie Steam SDK für lokale Tests
- Testen Sie alle Achievements
- Verifizieren Sie Steam Cloud Saves
- Testen Sie auf allen Zielplattformen

### 8. Veröffentlichung
- Füllen Sie alle Store-Informationen aus
- Setzen Sie Preise und Verfügbarkeit
- Reichen Sie zur Steam-Review ein
- Nach Genehmigung: Veröffentlichen!

## Wichtige Hinweise:
- Steam nimmt 30% der Verkäufe
- Mindestgebühr: $100 für Steam Direct
- Review-Prozess kann 1-7 Tage dauern
- Achievements müssen sinnvoll und erreichbar sein