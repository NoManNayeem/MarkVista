# Deployment Instructions

## Push to GitHub

```bash
git push -u origin main
```

If you get permission errors, you may need to:
1. Use SSH instead: `git remote set-url origin git@github.com:NoManNayeem/MarkVista.git`
2. Or authenticate with GitHub CLI: `gh auth login`

## Style Fixes Applied

To ensure styles work correctly on GitHub Pages, the following fixes were implemented:

### 1. Base Path Configuration
- Added `basePath: '/MarkVista'` for production
- Added `assetPrefix: '/MarkVista'` to ensure all assets load correctly
- Added `trailingSlash: true` for GitHub Pages compatibility

### 2. Static Export Settings
- Set `output: 'export'` for static site generation
- Set `images: { unoptimized: true }` required for static export
- Ensured `NODE_ENV=production` during build

### 3. Jekyll Configuration
- Added `.nojekyll` file creation in GitHub Actions workflow
- This prevents Jekyll from processing files and breaking asset paths

### 4. Build Script
- Updated `export` script to use `NODE_ENV=production`
- Ensures basePath is correctly set during build

## Enable GitHub Pages

You have two reliable options. Pick ONE of the following:

1) GitHub Actions (recommended)
- Go to Settings → Pages → Build and deployment → Source: GitHub Actions
- Push to `main` (or re-run the latest workflow under Actions → Deploy to GitHub Pages)
- The workflow uses the `out/` folder and creates `.nojekyll` automatically

2) Deploy from branch (`/docs` folder)
- Build and stage static files into `docs/` with:
  ```bash
  npm run export:docs
  git add docs && git commit -m "Deploy static export to docs" && git push
  ```
- Go to Settings → Pages → Build and deployment → Source: Deploy from a branch
- Set Branch: `main`, Folder: `/docs`

Notes:
- `.nojekyll` is created for both methods to allow serving the `_next` assets
- With Actions, no files are committed to the repo; with `/docs`, the built site is committed

## Verify Styles Are Loading

After deployment, check:
1. CSS files load from `/MarkVista/_next/static/css/`
2. JavaScript files load from `/MarkVista/_next/static/chunks/`
3. Fonts and images load correctly
4. Tailwind styles are applied

If styles are still missing:
1. Check browser console for 404s under `/MarkVista/_next/...`
2. Verify Pages Source is set to “GitHub Actions” (or to `main /docs` if using the branch method)
3. Confirm `.nojekyll` exists in the deployed root (Actions does this; `/docs` script adds it)
4. Verify `basePath` equals your repository name exactly (see `next.config.ts`)
5. Clear browser cache and hard refresh (Cmd/Ctrl+Shift+R)
