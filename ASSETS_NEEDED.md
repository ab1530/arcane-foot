# 🎨 ASSETS NÉCESSAIRES POUR LA PRODUCTION

**Date:** 28 Octobre 2025
**Status:** À créer
**Priorité:** Moyenne (pour PWA complet)

---

## 📱 ICÔNES PWA (Progressive Web App)

Pour que le PWA fonctionne complètement, les icônes suivantes doivent être créées et placées dans `/web/public/`:

### **Fichiers requis:**

1. **`icon-192x192.png`**
   - Dimensions: 192x192 pixels
   - Format: PNG
   - Fond: Transparent ou #080C1D (dark)
   - Usage: Android small icon, notifications

2. **`icon-512x512.png`**
   - Dimensions: 512x512 pixels
   - Format: PNG
   - Fond: Transparent ou #080C1D (dark)
   - Usage: Android splash screen, iOS save to home screen

3. **`favicon.ico`**
   - Dimensions: 32x32 ou 16x16 pixels
   - Format: ICO
   - Usage: Favicon navigateur (onglet)

4. **`favicon-16x16.png`**
   - Dimensions: 16x16 pixels
   - Format: PNG
   - Usage: Favicon petit format

5. **`apple-touch-icon.png`**
   - Dimensions: 180x180 pixels
   - Format: PNG
   - Usage: iOS Safari "Add to Home Screen"

---

## 🖼️ IMAGES SEO & PARTAGE SOCIAL

6. **`og-image.png`** (Open Graph)
   - Dimensions: 1200x630 pixels
   - Format: PNG ou JPG
   - Usage: Aperçu lorsque le lien est partagé sur Facebook, LinkedIn, Twitter
   - Contenu suggéré: Logo ARCANE + slogan "AI-Powered Football Scouting"
   - Palette: Dark background (#080C1D) + accent yellow (#E4FF3B)

---

## 📸 SCREENSHOTS (pour PWA manifest)

7. **`screenshot-1.png`** (Dashboard)
   - Dimensions: 1280x720 pixels
   - Format: PNG
   - Capture d'écran du Dashboard (`/dashboard`)

8. **`screenshot-2.png`** (Player Analytics)
   - Dimensions: 1280x720 pixels
   - Format: PNG
   - Capture d'écran de la page Player Detail avec analytics

---

## 🎨 DESIGN GUIDELINES

### **Logo ARCANE:**
- Le logo doit être vectoriel (SVG de préférence)
- Fond sombre (#080C1D) ou transparent
- Accent principal: Jaune néon (#E4FF3B)
- Style moderne, futuriste, tech

### **Palette de couleurs:**
```css
/* Primary */
Dark Background: #080C1D
Accent Yellow: #E4FF3B

/* Secondary */
Grey: #8B92A8
Light Grey: #E5E7EB

/* Glassmorphism */
Glass BG: rgba(139, 146, 168, 0.05)
Glass Border: rgba(139, 146, 168, 0.2)
```

### **Typographie:**
- Titres: Inter, Montserrat, ou Poppins (Bold/Black)
- Corps: Inter ou Roboto (Regular/Medium)

---

## 🛠️ OUTILS DE GÉNÉRATION D'ICÔNES

Si vous n'avez pas de designer, utilisez ces outils pour générer rapidement les icônes:

### **1. Favicon Generator**
- https://realfavicongenerator.net/
- Upload un logo 512x512 et il génère tous les formats

### **2. PWA Icon Generator**
- https://www.pwabuilder.com/
- Génère automatiquement toutes les tailles d'icônes PWA

### **3. Figma/Canva**
- Créer les icons manuellement avec les bonnes dimensions
- Export en PNG haute résolution

### **4. AI Image Generator**
- DALL-E, Midjourney, Stable Diffusion
- Prompt: "Modern football scouting app logo, dark background, yellow neon accent, futuristic, tech"

---

## 📦 FICHIERS ACTUELLEMENT RÉFÉRENCÉS

Ces fichiers sont référencés dans le code mais **n'existent pas encore**:

### **Dans `manifest.json`:**
```json
"icons": [
  { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
]
```

### **Dans `metadata.ts`:**
```typescript
openGraph: {
  images: [{ url: '/og-image.png', width: 1200, height: 630 }]
}

icons: {
  icon: '/favicon.ico',
  shortcut: '/favicon-16x16.png',
  apple: '/apple-touch-icon.png',
}
```

---

## ⚡ WORKAROUND TEMPORAIRE (Pour la démo)

Si vous n'avez pas le temps de créer les icônes avant la démo, utilisez des placeholders:

### **Option 1: Icône texte simple**
Créez une image carrée avec le texte "ARCANE" stylisé:
- Fond dark (#080C1D)
- Texte jaune néon (#E4FF3B)
- Font bold type Montserrat ou Inter

### **Option 2: Utiliser un outil en ligne rapide**
- https://favicon.io/favicon-generator/
- Entrez "ARCANE" et choisissez les couleurs

### **Option 3: Emoji (très rapide)**
Utilisez ⚡ ou ⚽ comme placeholder icon

---

## 🚨 IMPACT SUR LA DÉMO

**Impact FAIBLE pour la démo de demain:**
- ✅ L'application fonctionne 100% sans les icônes
- ✅ Le PWA peut être testé mais sans installation mobile optimale
- ✅ Les partages sociaux fonctionnent mais sans aperçu image
- ⚠️ Les onglets navigateur n'auront pas de favicon
- ⚠️ Pas d'installation PWA sur mobile

**Conseil:** Mentionnez au client que les assets visuels finaux seront ajoutés avant le déploiement production.

---

## ✅ CHECKLIST DE CRÉATION

- [ ] `icon-192x192.png` créé et placé dans `/web/public/`
- [ ] `icon-512x512.png` créé et placé dans `/web/public/`
- [ ] `favicon.ico` créé et placé dans `/web/public/`
- [ ] `favicon-16x16.png` créé et placé dans `/web/public/`
- [ ] `apple-touch-icon.png` créé et placé dans `/web/public/`
- [ ] `og-image.png` créé et placé dans `/web/public/`
- [ ] `screenshot-1.png` créé et placé dans `/web/public/`
- [ ] `screenshot-2.png` créé et placé dans `/web/public/`
- [ ] Tester PWA sur mobile (installation)
- [ ] Tester partage social (Open Graph preview)

---

## 📝 NOTES SUPPLÉMENTAIRES

Une fois les icônes créées:
1. Placer tous les fichiers dans `/web/public/`
2. Redémarrer le serveur Next.js (`npm run dev`)
3. Tester le PWA dans Chrome DevTools > Application > Manifest
4. Tester l'installation sur mobile (Android: "Add to Home Screen")
5. Valider Open Graph avec: https://www.opengraph.xyz/

---

**Créé par:** ARCANE Football Team
**Dernière mise à jour:** 28 Octobre 2025
