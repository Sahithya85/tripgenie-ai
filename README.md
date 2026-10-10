# TripGenie AI (Google Gemini version)

A form-based AI travel planner.

    Browser (public/index.html)  ->  Node.js server (server.js)  ->  Google Gemini API
                                      ^ your secret key lives only here (.env)

The browser never sees your API key. The server checks every input, builds the prompt, calls Gemini with the official `@google/genai` SDK, and sends the itinerary back.

## Windows setup (step by step)

1. **Install Node.js 20 or newer.** Go to https://nodejs.org, download the "LTS" version and install it with the default options. Then open Command Prompt and type `node -v`. You should see v20 or higher.
2. **Get a free Gemini key.** Open https://aistudio.google.com/apikey and click "Create API key". Copy it. You do not need to add a credit card or pay for anything.
3. **Open the project folder in Command Prompt.** Unzip the project, open the folder, click the address bar, type `cmd` and press Enter.
4. **Install the packages:**
       npm install
5. **Create your .env file** (if a `.env` already exists, delete it first):
       copy .env.example .env
       notepad .env
   Replace `your-gemini-api-key-here` with your real key. Do not add quotes or spaces. Save and close Notepad.
6. **Start the app:**
       npm start
   You should see: `TripGenie AI running at http://localhost:3000 (models: gemini-2.5-flash-lite -> gemini-3.1-flash-lite)`
7. **Open http://localhost:3000** in your browser, fill in the form and click Generate.

To stop the server, press `Ctrl + C` in Command Prompt.

## Easy start on Windows

After installing Node.js and getting your key, you can just double-click `start-windows.bat`. It installs packages, creates `.env`, opens it for your key, and starts the app.

## Which model?

The main model is `gemini-2.5-flash-lite`, which Google lists with a free tier. Google may retire the 2.5 models in October 2026, so the server also has a fallback: if the main model is unavailable or its free quota is used up, it automatically tries `gemini-3.1-flash-lite` (also free). You can change either model in `.env` and restart.

## Free-tier limits

The free tier has small per-minute and per-day limits. If you see "Gemini free-tier limit reached", wait one minute and try again. If it keeps happening, wait until the next day. Check your own limits at https://aistudio.google.com. On the free tier, Google may use your prompts to improve its products, so do not type private information into the form.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing GEMINI_API_KEY` | You skipped step 5, or the file is named `.env.txt`. It must be exactly `.env`. |
| "API key is invalid" | Re-copy the key from AI Studio into `.env`, then restart with `npm start`. |
| "Selected Gemini model is not available" | Set `GEMINI_MODEL=gemini-3.1-flash-lite` in `.env` and restart. |
| Still see an old "ANTHROPIC" message | You are running an old copy. Use a fresh folder, delete the old `.env`, `node_modules` and `package-lock.json`, then repeat the setup. |
| "Cannot reach the server" | The server is not running. Run `npm start`. |
| `npm` is not recognised | Close and reopen Command Prompt after installing Node.js. |
| Port 3000 already in use | Set `PORT=3001` in `.env` and open http://localhost:3001 |

## Security rules

- Never put your key in `index.html` or any file in the `public` folder.
- `.env` is listed in `.gitignore`, so Git will not upload it. Before pushing to GitHub, run `git status` and make sure `.env` is not listed.
- If you ever leak a key, delete it in AI Studio and create a new one.

## Files

    tripgenie-ai/
      public/index.html   website (same design and form)
      server.js           web server and Gemini call
      lib.js              input validation, prompt, error messages
      package.json        dependencies and the npm start command
      .env.example        template for your secrets
      .gitignore          keeps .env and node_modules out of Git
      start-windows.bat   optional one-click start on Windows
      README.md           this file
