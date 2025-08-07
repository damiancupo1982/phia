# Phia Rental Miami - Deployment Guide

## 🚀 Ready for Netlify Deployment

This project is fully prepared for deployment on Netlify.

### Quick Deploy Options:

#### Option 1: Drag & Drop (Recommended)
1. Download the `dist` folder from this project
2. Go to [Netlify](https://app.netlify.com)
3. Drag the `dist` folder to the deploy area
4. Your site will be live instantly!

#### Option 2: Git Integration
1. Push this project to GitHub/GitLab
2. Connect repository to Netlify
3. Build settings are pre-configured:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 📦 What's Included:

✅ **Complete Car Rental Management System**
- 30+ vehicles in inventory
- Advanced filtering system
- PDF budget generation
- WhatsApp sharing
- Excel/PDF import functionality

✅ **Production-Ready Build**
- Optimized assets in `dist/` folder
- Minified CSS and JavaScript
- Responsive design
- Modern UI with Tailwind CSS

✅ **Pre-configured for Netlify**
- `netlify.toml` configuration file
- Proper redirects for SPA
- Build optimization

### 🎯 Features:

- **Vehicle Management**: Complete inventory with seasonal pricing
- **Budget Generation**: Professional PDF quotes
- **Advanced Filters**: Search by type, fuel, price, seats
- **History Tracking**: Complete budget history with statistics
- **File Import**: Excel and PDF import capabilities
- **Social Sharing**: WhatsApp integration
- **Responsive Design**: Works on all devices

### 📱 Technical Stack:

- React 18 + TypeScript
- Tailwind CSS
- Vite build system
- html2pdf.js for PDF generation
- xlsx for Excel import
- pdfjs-dist for PDF parsing

### 🔧 Local Development:

```bash
npm install
npm run dev
```

### 🌐 Production Build:

```bash
npm run build
```

The `dist` folder contains all production-ready files.

---

**Developed for Phia Rental Miami 🚗🌴**