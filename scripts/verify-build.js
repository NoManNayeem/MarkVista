#!/usr/bin/env node

/**
 * Post-build verification script for GitHub Pages deployment
 * Verifies that CSS and JS files have correct paths with basePath
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'out');
const BASEPATH = '/MarkVista';

function findFiles(dir, extension) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findFiles(fullPath, extension));
    } else if (item.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

function verifyHTMLFiles() {
  console.log('🔍 Verifying HTML files...\n');
  
  const htmlFiles = findFiles(OUT_DIR, '.html');
  let issues = 0;
  
  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf8');
    const relativePath = path.relative(OUT_DIR, htmlFile);
    
    // Check for CSS references
    const cssMatches = content.match(/href=["']([^"']*\.css[^"']*)["']/g) || [];
    const jsMatches = content.match(/src=["']([^"']*\.js[^"']*)["']/g) || [];
    
    // Check if paths include basePath
    const missingBasePath = [
      ...cssMatches.filter(m => !m.includes(BASEPATH) && m.includes('_next')),
      ...jsMatches.filter(m => !m.includes(BASEPATH) && m.includes('_next'))
    ];
    
    if (missingBasePath.length > 0) {
      console.log(`❌ ${relativePath}: Missing basePath in ${missingBasePath.length} asset reference(s)`);
      issues++;
    } else if (cssMatches.length > 0 || jsMatches.length > 0) {
      console.log(`✅ ${relativePath}: All asset paths correct`);
    }
  }
  
  return issues;
}

function verifyCSSFiles() {
  console.log('\n🔍 Verifying CSS files exist...\n');
  
  const cssFiles = findFiles(path.join(OUT_DIR, '_next'), '.css');
  
  if (cssFiles.length === 0) {
    console.log('❌ No CSS files found in _next directory!');
    return false;
  }
  
  console.log(`✅ Found ${cssFiles.length} CSS file(s):`);
  cssFiles.slice(0, 5).forEach(file => {
    const relativePath = path.relative(OUT_DIR, file);
    const stats = fs.statSync(file);
    console.log(`   - ${relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
  
  if (cssFiles.length > 5) {
    console.log(`   ... and ${cssFiles.length - 5} more`);
  }
  
  return true;
}

function verifyNoJekyll() {
  console.log('\n🔍 Verifying .nojekyll file...\n');
  
  const nojekyllPath = path.join(OUT_DIR, '.nojekyll');
  
  if (fs.existsSync(nojekyllPath)) {
    console.log('✅ .nojekyll file exists');
    return true;
  } else {
    console.log('❌ .nojekyll file missing! Creating it...');
    fs.writeFileSync(nojekyllPath, '');
    console.log('✅ .nojekyll file created');
    return true;
  }
}

// Main execution
console.log('🚀 Starting build verification...\n');
console.log(`BasePath: ${BASEPATH}\n`);

const htmlIssues = verifyHTMLFiles();
const cssExists = verifyCSSFiles();
const nojekyllExists = verifyNoJekyll();

console.log('\n' + '='.repeat(50));
if (htmlIssues === 0 && cssExists && nojekyllExists) {
  console.log('✅ Build verification passed!');
  process.exit(0);
} else {
  console.log('⚠️  Build verification found issues:');
  if (htmlIssues > 0) console.log(`   - ${htmlIssues} HTML file(s) with incorrect paths`);
  if (!cssExists) console.log('   - CSS files missing');
  if (!nojekyllExists) console.log('   - .nojekyll file missing');
  console.log('\nPlease check the build output above.');
  process.exit(1);
}

