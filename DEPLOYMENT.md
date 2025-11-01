# Deployment Instructions

## Push to GitHub

Since there was an authentication issue, you'll need to push manually:

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

After pushing:

1. Go to repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. The workflow will automatically deploy on every push to main

## Verify Styles Are Loading

After deployment, check:
1. CSS files load from `/MarkVista/_next/static/css/`
2. JavaScript files load from `/MarkVista/_next/static/chunks/`
3. Fonts and images load correctly
4. Tailwind styles are applied

If styles are still missing:
1. Check browser console for 404 errors
2. Verify basePath matches your repository name exactly
3. Ensure `.nojekyll` file exists in the `out/` directory
4. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

