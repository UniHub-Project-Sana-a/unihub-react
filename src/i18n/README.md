# Multi-Language System Guide

## Overview
This project uses `react-i18next` for internationalization (i18n). The system is configured to support multiple languages with English as the default.

## Supported Languages
- English (en) - Default
- Arabic (ar)
- French (fr)

## File Structure
```
src/i18n/
├── config.ts           # i18n configuration
├── locales/
│   ├── en.json        # English translations
│   ├── ar.json        # Arabic translations (to be translated)
│   └── fr.json        # French translations (to be translated)
└── README.md          # This file
```

## How to Use Translations in Components

### 1. Import the useTranslation hook
```tsx
import { useTranslation } from 'react-i18next';
```

### 2. Use translations in your component
```tsx
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.welcome')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 3. Using translations with interpolation
```tsx
// In your translation file:
// "greeting": "Hello, {{name}}!"

const { t } = useTranslation();
return <p>{t('greeting', { name: 'John' })}</p>;
// Output: "Hello, John!"
```

## How to Add New Translations

### 1. Add the key-value pair to all language files
```json
// en.json
{
  "mySection": {
    "myKey": "My English text"
  }
}

// ar.json
{
  "mySection": {
    "myKey": "النص العربي الخاص بي"
  }
}

// fr.json
{
  "mySection": {
    "myKey": "Mon texte français"
  }
}
```

### 2. Use it in your component
```tsx
const { t } = useTranslation();
return <p>{t('mySection.myKey')}</p>;
```

## How to Add a New Language

### 1. Create a new JSON file in `src/i18n/locales/`
```
src/i18n/locales/es.json  // For Spanish
```

### 2. Copy the structure from `en.json` and translate
```json
{
  "app": {
    "title": "Portal de Administración UniHub",
    "welcome": "Bienvenido al Portal de Administración UniHub"
  }
  // ... rest of translations
}
```

### 3. Import and add to config.ts
```typescript
import es from './locales/es.json';

// In the resources object:
resources: {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
  es: { translation: es },  // Add this line
}
```

### 4. Add to LanguageSwitcher component
```typescript
// In src/components/layout/LanguageSwitcher.tsx
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },  // Add this line
];
```

## Language Switching
Users can switch languages using the language switcher in the top bar. The selected language is saved in localStorage and persists across sessions.

## RTL Support
The system automatically handles right-to-left (RTL) languages like Arabic by setting the document direction when the language is changed.

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
   ```tsx
   // ❌ Bad
   <button>Save</button>
   
   // ✅ Good
   <button>{t('common.save')}</button>
   ```

2. **Use nested keys for organization**
   ```json
   {
     "auth": {
       "login": "Login",
       "logout": "Logout"
     }
   }
   ```

3. **Keep keys descriptive**
   ```tsx
   // ❌ Bad
   t('btn1')
   
   // ✅ Good
   t('common.saveButton')
   ```

4. **Add all keys to all language files**
   Even if not translated yet, include the English text as a placeholder.

## Current Status
- ✅ i18n infrastructure set up
- ✅ English translations complete
- ⏳ Arabic translations pending (manual translation needed)
- ⏳ French translations pending (manual translation needed)

## Next Steps
1. Manually translate `ar.json` to Arabic
2. Manually translate `fr.json` to French
3. Replace hardcoded text in components with translation keys
4. Test language switching functionality
5. Add more languages as needed
