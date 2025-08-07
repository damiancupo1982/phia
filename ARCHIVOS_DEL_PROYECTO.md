# 📁 PHIA RENTAL MIAMI - TODOS LOS ARCHIVOS

## 🗂️ ESTRUCTURA DEL PROYECTO:

```
phia-rental-miami/
├── package.json
├── package-lock.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── netlify.toml
├── README.md
├── DEPLOYMENT.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── types.ts
    ├── data/
    │   └── initialInventory.ts
    └── components/
        ├── CarManagement.tsx
        ├── BudgetGenerator.tsx
        ├── BudgetHistory.tsx
        └── FileImporter.tsx
```

---

## 📄 ARCHIVOS PRINCIPALES:

### 1. **package.json**
```json
{
  "name": "vite-react-typescript-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "export": "npm run build && echo 'Project ready for ZIP export! Upload the dist folder to Netlify.'"
  },
  "dependencies": {
    "html2canvas": "^1.4.1",
    "html2pdf.js": "^0.10.3",
    "lucide-react": "^0.344.0",
    "pdfjs-dist": "^5.3.93",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
```

### 2. **index.html**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Phia Rental Miami - Sistema de Gestión</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3. **vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

### 4. **tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          500: '#FF6B6B',
          600: '#FF5252',
        }
      }
    },
  },
  plugins: [],
};
```

### 5. **netlify.toml**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🚀 INSTRUCCIONES DE INSTALACIÓN:

1. **Crear carpeta del proyecto:**
   ```bash
   mkdir phia-rental-miami
   cd phia-rental-miami
   ```

2. **Copiar todos los archivos** mostrados arriba

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

6. **Subir a Netlify:**
   - Sube la carpeta `dist` generada

---

## ⚠️ IMPORTANTE:
- Copia TODOS los archivos en la estructura exacta mostrada
- No olvides las carpetas `src/components/` y `src/data/`
- Ejecuta `npm install` antes de `npm run build`

¿Necesitas que te muestre algún archivo específico en detalle?