# Portfolio Setup Guide - Step by Step

## What You Have Now

I've created a complete project with these files:
- `index.html` - Your portfolio (HTML only, no CSS/JS embedded)
- `style.css` - All your styling separated
- `script.js` - All your JavaScript separated
- `package.json` - Tells npm what to install
- `.gitignore` - Tells Git what not to upload
- `README.md` - Documentation for GitHub
- `reports/` - Folder with your security report

## Step 1: Download the Project

1. Download the `portfolio-project` folder from the outputs
2. Save it somewhere on your computer (e.g., `~/Documents/portfolio-project`)

## Step 2: Set Up Local Development

### Install Node.js (if you don't have it)

1. Go to https://nodejs.org/
2. Download the LTS version (Long Term Support)
3. Install it (default settings are fine)
4. Verify installation by opening Terminal and running:
   ```bash
   node --version
   npm --version
   ```
   Both should show version numbers

### Start Your Local Server

1. Open Terminal/Command Prompt
2. Navigate to your project folder:
   ```bash
   cd ~/Documents/portfolio-project
   ```

3. Install dependencies (this downloads Vite):
   ```bash
   npm install
   ```
   This creates a `node_modules/` folder (don't worry about it, Git ignores it)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. You'll see something like:
   ```
   VITE v5.0.0  ready in 234 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

6. Open your browser to `http://localhost:5173`
7. **Your portfolio is now running locally!**

### What Just Happened?

- Vite created a local web server
- It's watching your files for changes
- When you edit `index.html`, `style.css`, or `script.js`, the browser will automatically refresh
- This is called "hot reload" - super helpful for development

### Try It Out

1. With the server running, open `style.css` in a text editor
2. Find the line with `--accent-primary: #00c5e0;`
3. Change it to `--accent-primary: #ff0000;` (red)
4. Save the file
5. Watch your browser - the colors change instantly without refreshing!
6. Change it back to `#00c5e0`

## Step 3: Create GitHub Repository

### Option A: Using GitHub Website (Easier)

1. Go to https://github.com
2. Click the **+** icon (top right) → **New repository**
3. Repository name: `portfolio`
4. Description: "Cybersecurity Portfolio"
5. Make it **Public**
6. **DO NOT** check "Add a README" (we already have one)
7. Click **Create repository**

### Option B: Using Git Command Line

1. In Terminal, navigate to your project:
   ```bash
   cd ~/Documents/portfolio-project
   ```

2. Initialize Git:
   ```bash
   git init
   ```

3. Add all files:
   ```bash
   git add .
   ```

4. Create first commit:
   ```bash
   git commit -m "Initial portfolio commit"
   ```

5. Add your GitHub repository as remote:
   ```bash
   git branch -M main
   git remote add origin https://github.com/BR4Dgg/portfolio.git
   ```

6. Push to GitHub:
   ```bash
   git push -u origin main
   ```

## Step 4: Deploy to Vercel

### Set Up Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub

### Deploy Your Portfolio

1. Once logged in, click **Add New** → **Project**
2. You'll see a list of your GitHub repositories
3. Find `portfolio` and click **Import**
4. Vercel will detect it's a Vite project automatically
5. Settings should show:
   - **Framework Preset:** Vite
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
6. Click **Deploy**
7. Wait 30-60 seconds... ☕
8. **Your site is live!**

Vercel will give you a URL like: `https://portfolio-br4dgg.vercel.app`

### Update the Latest Report Link

1. Go to your GitHub repository
2. Click on `reports/seo-poisoning-edu-compromise.md`
3. Copy the URL (it will be like: `https://github.com/BR4Dgg/portfolio/blob/main/reports/seo-poisoning-edu-compromise.md`)
4. Open `index.html` in your editor
5. Find: `<a href="#" id="latest-report-link"`
6. Change to: `<a href="YOUR_GITHUB_REPORT_URL" id="latest-report-link"`
7. Save the file
8. Commit and push:
   ```bash
   git add index.html
   git commit -m "Update latest report link"
   git push
   ```
9. Vercel will automatically redeploy (in ~30 seconds)

## Step 5: Ongoing Workflow

### Making Changes

1. Edit files locally (HTML, CSS, JS)
2. Test in browser at `http://localhost:5173`
3. When happy with changes:
   ```bash
   git add .
   git commit -m "Description of what you changed"
   git push
   ```
4. Vercel automatically deploys the new version in ~30 seconds
5. Your live site updates!

### Adding New Reports

1. Create a new `.md` file in the `reports/` folder
2. Update the latest report banner in `index.html`
3. Commit and push
4. Auto-deploys!

## Troubleshooting

### "npm: command not found"
- Node.js isn't installed. Go back to Step 2 and install it.

### "Port 5173 is already in use"
- Another server is running. Close it or use:
  ```bash
  npm run dev -- --port 3000
  ```

### Changes don't show up
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Check the terminal - Vite shows errors there

### Vercel deployment failed
- Check your `package.json` is in the root directory
- Make sure you pushed all files to GitHub
- Check Vercel's error logs in the deployment dashboard

## What You've Accomplished

✅ Professional portfolio with separated HTML/CSS/JS
✅ Local development server with hot reload
✅ Version control with Git
✅ GitHub repository
✅ Automatic deployment to Vercel
✅ Live website that auto-updates when you push code

## Next Steps

- Add more security reports to the `reports/` folder
- Update your homelab section as you complete projects
- Add your actual GitHub projects
- Consider adding a custom domain (Vercel makes this easy)

---

Need help? Common commands:

- **Start server:** `npm run dev`
- **Stop server:** Ctrl+C in Terminal
- **Build production:** `npm run build`
- **Check status:** `git status`
- **Push changes:** `git add . && git commit -m "message" && git push`
