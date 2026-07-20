# Mental Map Challenge audio

Mental Map Challenge uses prerecorded MP3s for fixed questions, separate instructions, and result explanations. The registry in `src/atlas/mental-map-audio.js` derives all spoken text from the challenge definitions and deduplicates identical text. Generated route questions use browser speech for their dynamic question and explanation; their shared instruction can reuse a recording.

## Generate recordings

Set `OPENAI_API_KEY` only in the local shell that runs the offline generator. In PowerShell:

```powershell
$env:OPENAI_API_KEY = Read-Host "OpenAI API key" -MaskInput
```

Do not put the key in frontend code or commit it. Local `.env` variants are gitignored, but this generator reads the process environment directly and does not load or create an env file.

List missing recordings without a key:

```powershell
npm run audio:mental-map:list
```

Generate only missing recordings:

```powershell
npm run audio:mental-map:generate
```

Generate missing recordings for one challenge:

```powershell
node scripts/generate-mental-map-audio.mjs --challenge lake-erie-all
```

Explicitly regenerate one challenge or every fixed recording:

```powershell
node scripts/generate-mental-map-audio.mjs --challenge lake-erie-all --force
node scripts/generate-mental-map-audio.mjs --force
```

Output is written to `assets/audio/mental-map/`. Commit the generated MP3 files along with registry or challenge-text changes. Never commit the API key.

After generation, require every registered file during validation:

```powershell
node scripts/check-mental-map-audio.mjs --require-files
```
