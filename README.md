<div align="center">
  <img width="800" alt="EternalSMP Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EternalSMP Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmarcellnw%2Feternalsmp-dashboard&env=GEMINI_API_KEY)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deploy-blue?logo=github)](https://github.com/marcellnw/eternalsmp-dashboard/actions/workflows/static.yml)

A high-fidelity, fantasy-themed administrative dashboard for EternalSMP. Features an AI-powered oracle, real-time webhook dispatcher, and advanced server monitoring tools.

## ✨ Features

- 🎭 **Fantasy Aesthetic:** Cinematic UI with particle effects and immersive animations.
- 🔮 **ETER AI ASSISTANT:** Powered by Gemini-3-Flash for intelligent server management assistance.
- 📡 **Webhook Dispatcher:** Multi-category Discord integration for announcements and quests.
- 📊 **Server Diagnostics:** Real-time (simulated) monitoring of TPS, players, and system load.
- 📜 **Mythic Reports:** Generate and export PDF diagnostic reports for the realm.

## 🛠️ Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Secrets:**
   Create a `.env` file or use `import.meta.env` and set:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. **Ignite the Server:**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Vercel (Recommended)
1. Push this repository to GitHub.
2. Connect to [Vercel](https://vercel.com).
3. Set `GEMINI_API_KEY` in Environment Variables.

### GitHub Pages
The project includes a GitHub Action in `.github/workflows/static.yml`.
1. Enable **GitHub Actions** in repository settings.
2. Set `GEMINI_API_KEY` in **Secrets > Actions**.

---
*Created with magic for the EternalSMP Community.*
