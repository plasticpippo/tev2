# POS Application Instruction Manual

This directory contains a comprehensive instruction manual for the POS (Point of Sale) application. The manual provides detailed documentation for both end users (cashiers and staff) and administrators (managers and owners).

## Overview

The manual is a static HTML website with the following features:

- **Bilingual Support**: Full documentation in English and Italian
- **Responsive Design**: Works on desktop, tablet, and touchscreen devices
- **Navigation**: Sidebar navigation with breadcrumb trails
- **Language Switching**: Switch between English and Italian from any page
- **Search**: Placeholder for future search functionality

## Viewing the Manual

To view the manual:

1. Open `manual/index.html` in a web browser
2. Select your preferred language (English or Italian)
3. Navigate through the documentation using the sidebar

Alternatively, you can serve the manual using a local web server:

```bash
cd manual
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

## Directory Structure

```
manual/
├── index.html              # Landing page (language selection)
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   └── main.js            # Navigation and interaction scripts
├── images/
│   ├── diagrams/          # Architecture diagrams (SVG)
│   └── screenshots/       # Screenshot placeholders
│       ├── en/            # English screenshots
│       └── it/            # Italian screenshots
├── en/                    # English documentation
│   ├── index.html         # English landing page
│   ├── getting-started/   # Getting started guides
│   ├── user-guide/        # End user documentation
│   ├── admin-guide/       # Administrator documentation
│   ├── reference/         # Reference materials
│   └── appendix/          # Appendix (empty)
└── it/                    # Italian documentation
    ├── index.html         # Italian landing page
    ├── getting-started/   # Guida per iniziare
    ├── user-guide/        # Guida utente
    ├── admin-guide/       # Guida amministratore
    ├── reference/        # Riferimenti
    └── appendix/          # Appendice (empty)
```

## Content Structure

### English Documentation (`en/`)

- **Getting Started**: Introduction, system requirements, first-time setup, quick start guide
- **User Guide**: Logging in, POS interface, taking orders, managing tables, processing payments, working with tabs, virtual keyboard, end of shift
- **Administrator Guide**: Admin panel overview, dashboard, product management, category management, stock items, inventory, user management, till management, table/room management, transaction history, analytics, daily closing, settings
- **Reference**: Keyboard shortcuts, glossary, FAQ, troubleshooting

### Italian Documentation (`it/`)

Full translation of all English content:
- **Per Iniziare**: Introduzione, requisiti di sistema, configurazione iniziale, guida rapida
- **Guida Utente**: Accesso, interfaccia POS, effettuare ordini, gestione tavoli, elaborazione pagamenti, lavorare con conti aperti, tastiera virtuale, fine turno
- **Guida Amministratore**: Panoramica pannello admin, dashboard, gestione prodotti, categorie, articoli di magazzino, inventario, gestione utenti, gestione casse, gestione tavoli e sale, storico transazioni, analisi, chiusura giornaliera, impostazioni
- **Riferimenti**: Scorciatoie da tastiera, glossario, FAQ, risoluzione problemi

## Replacing Screenshot Placeholders

The manual currently uses placeholder divs for screenshots. To add actual screenshots:

1. Create or capture screenshots of the POS application
2. Save them as PNG or SVG files
3. Place them in the appropriate folder:
   - English: `manual/images/screenshots/en/`
   - Italian: `manual/images/screenshots/it/`
4. Update the HTML to reference the actual images

Example screenshot placeholders exist for:
- Login screen
- Main POS interface
- Product grid
- Order panel
- Payment modal
- Dashboard
- Admin panels

## Adding New Content

### Adding a New Page

1. Create a new HTML file in the appropriate section folder (e.g., `en/user-guide/`)
2. Use the standard page template with sidebar navigation
3. Add the page to the navigation in `js/main.js` by updating the `NAVIGATION` object

### Adding a New Section

1. Create a new folder in both `en/` and `it/` directories
2. Add pages to the new folder
3. Update the `NAVIGATION` object in `js/main.js` to include the new section

### Navigation Configuration

The navigation is defined in `js/main.js` in the `NAVIGATION` object:

```javascript
const NAVIGATION = {
    en: {
        'section-folder': {
            title: 'Section Title',
            pages: {
                'page-filename': 'Page Title',
                // ... more pages
            }
        },
        // ... more sections
    },
    it: {
        // Italian translation
    }
};
```

## Technical Details

- **HTML5**: Semantic HTML with accessibility in mind
- **CSS3**: Modern CSS with responsive design
- **JavaScript**: Vanilla JavaScript for navigation and interactivity
- **No Build Required**: Plain HTML/CSS/JS, no bundler needed

## Browser Compatibility

The manual is designed to work with all modern browsers:
- Chrome / Edge
- Firefox
- Safari

## License

This documentation is part of the POS Application project.
