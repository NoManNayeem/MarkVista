# MarkVista

A professional Markdown preview and export application built with Next.js 16, TypeScript, and Tailwind CSS. Transform your markdown files into beautifully formatted PDF and DOCX documents.

🔗 **Live Demo**: [https://nomannayeem.github.io/MarkVista](https://nomannayeem.github.io/MarkVista)

## ✨ Features

- 📝 **Rich Markdown Rendering**
  - GitHub Flavored Markdown (GFM) support
  - Tables, task lists, strikethrough
  - Syntax-highlighted code blocks
  - Math equations with KaTeX (LaTeX syntax)
  
- 📊 **Interactive Diagrams**
  - Mermaid.js support for flowcharts, sequence diagrams, mind maps, and more
  - Click diagrams to download as PNG images
  
- 📄 **Export Functionality**
  - Export to PDF with high fidelity
  - Export to DOCX with preserved formatting
  - Both formats maintain exact styling

## 🚀 Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Markdown:** react-markdown with remark/rehype plugins
- **Diagrams:** Mermaid.js
- **Syntax Highlighting:** react-syntax-highlighter
- **Export:** jsPDF + html2canvas-pro (PDF), html-docx-js-typescript (DOCX)

## 📦 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9+ or pnpm 8+ or yarn 1.22+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NoManNayeem/MarkVista.git
cd MarkVista
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 🌐 Deployment to GitHub Pages

This project is configured for GitHub Pages deployment.

### Setup GitHub Pages

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/NoManNayeem/MarkVista.git
   git push -u origin main
   ```

2. **Build and Export:**
   ```bash
   npm run export
   ```
   This creates a static export in the `out/` directory.

3. **Configure GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions" or upload the `out/` folder manually
   - The site will be available at `https://nomannayeem.github.io/MarkVista`

### Automated Deployment (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run export
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

## 📖 Usage

1. **Upload a Markdown File**
   - Drag and drop a `.md` or `.markdown` file on the upload page
   - Or click to browse and select a file
   - Maximum file size: 10MB

2. **Preview**
   - Your markdown will be rendered with full formatting
   - Diagrams will render automatically
   - Math equations will display beautifully
   - Click on Mermaid diagrams to download as PNG images

3. **Export**
   - Click "Export PDF" to download as PDF
   - Click "Export DOCX" to download as Word document
   - Both formats preserve your formatting and styles

## 📝 Markdown Best Practices & Styling Rules

### Supported Markdown Features

MarkVista supports GitHub Flavored Markdown (GFM) with the following features:

#### Text Formatting
- **Bold**: `**bold text**` or `__bold text__`
- *Italic*: `*italic text*` or `_italic text_`
- ***Bold Italic***: `***bold italic***`
- ~~Strikethrough~~: `~~strikethrough text~~`

#### Headings
- Use `#` for H1, `##` for H2, `###` for H3, etc.
- Headings automatically include proper spacing and borders

#### Lists
- **Unordered**: Use `-`, `*`, or `+`
- **Ordered**: Use numbers (e.g., `1.`, `2.`, `3.`)
- **Task Lists**: `- [x] completed` or `- [ ] incomplete`
- Support for nested lists

#### Code Blocks
- **Inline code**: Wrap with backticks: `` `code` ``
- **Code blocks**: Use triple backticks with language for syntax highlighting

#### Tables
- Use pipe syntax for tables
- Tables are automatically styled with borders and spacing

#### Mermaid Diagrams
- Use mermaid code blocks for diagrams
- Supported diagram types: Flowcharts, Sequence diagrams, Mind maps, Gantt charts, and more
- **Click on rendered diagrams to download as PNG images**

#### Math Equations
- **Inline**: Use single `$` - `$E = mc^2$`
- **Block**: Use double `$$` for centered equations

## 🎨 Features in Detail

### PDF Export
- Preserves all Tailwind CSS styles
- Converts to high-quality images
- Automatically handles large documents with scaling
- Maintains exact formatting and colors
- Uses html2canvas-pro for modern CSS color support

### DOCX Export
- Converts Tailwind classes to inline styles
- Preserves fonts, colors, and spacing
- Tables and lists are properly formatted
- SVG/Mermaid diagrams are replaced with placeholders (Word doesn't support SVG)

### Diagram Downloads
- Click any rendered Mermaid diagram to download as PNG
- High-resolution (2x) images
- Automatic file naming with timestamp

## 🧪 Testing

A sample markdown file is included at `public/test.md` for testing all features including:
- Text formatting
- Lists
- Tables
- Code blocks
- Mermaid diagrams
- Math equations

## 📁 Project Structure

```
markvista/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx             # Upload/Branding page
│   │   ├── preview/
│   │   │   └── page.tsx         # Preview page
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── MarkdownPreview.tsx # Main preview component
│   │   ├── Navbar.tsx           # Navigation bar
│   │   ├── Footer.tsx           # Footer component
│   │   └── GitHubStarModal.tsx # Star request modal
│   └── lib/
│       ├── exportPDF.ts         # PDF export logic
│       └── exportDOCX.ts         # DOCX export logic
└── public/
    └── test.md                  # Sample markdown file
```

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## ⭐ Show Your Support

If you find MarkVista useful, please consider giving it a star on GitHub!

---

Made with ❤️ by [NoManNayeem](https://github.com/NoManNayeem)
