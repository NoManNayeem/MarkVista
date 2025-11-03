# Export Issue Investigation

## Problem
Downloaded PDF and DOCX files are showing blank/white pages.

## Current Investigation

### What We Know:
1. Build is successful ✅
2. Original export functions are being used (jsPDF + html2canvas-pro for PDF, html-docx-js-typescript for DOCX)
3. Export functions properly find `#markdown-preview` element
4. Console logging has been added to track the export process

### Potential Causes:
1. **Dark mode styles** - Might be interfering with exports (dark text on dark background = invisible)
2. **Content selection** - PreviewRef points to wrapper div, but exports look for `#markdown-preview` inside
3. **Timing** - Content might not be fully rendered when export is triggered
4. **CSS styles** - Some Tailwind classes or dark mode overrides might not be captured properly

### Next Steps to Debug:

#### For User Testing:
1. **Test with Light Mode**:
   - Switch to light theme using the theme toggle
   - Try exporting PDF and DOCX
   - Check if content appears

2. **Check Browser Console**:
   - Open browser console (F12)
   - Click "Export PDF" or "Export DOCX"
   - Look for console logs showing:
     ```
     PDF export - Element passed: [className]
     PDF export - Found markdown preview: true/false
     PDF export - Target element: [id] [className]
     PDF export - Content length: [number]
     PDF export - Element dimensions: { width, height, scrollHeight, scrollWidth }
     Canvas generated: { width, height }
     PDF export completed successfully
     ```

3. **Test with Sample Content**:
   - Upload a simple markdown file with just:
     ```markdown
     # Test Title
     This is a test paragraph.
     ```
   - Try exporting
   - Check if this simple content exports correctly

#### Technical Fixes to Try:

**Fix 1: Force Light Background for Exports**
We need to ensure exports always use light backgrounds regardless of theme.

**Fix 2: Ensure Content Visibility**
Make sure all text has proper contrast and is visible in exports.

**Fix 3: Wait for Full Render**
Increase wait time before capturing content.

## Testing Instructions for User:

1. Start the dev server: `npm run dev`
2. Upload a markdown file
3. Check the theme (toggle between light/dark)
4. Open browser console (F12)
5. Click "Export PDF"
6. Share the console logs
7. Open the downloaded PDF - is it blank?

Please share:
- Current theme (light/dark)
- Console logs from the export attempt
- Whether light mode vs dark mode makes a difference
