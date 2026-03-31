# PDF Library Integration - Font Licensing

This directory contains fonts used for PDF generation in the receipt/invoicing system.

## Font Licensing Requirements

All fonts in this directory must be licensed for commercial use and embedding in PDF documents.

### Recommended Open-Source Fonts

The following fonts are recommended and freely available under open-source licenses:

1. **Inter** (Recommended)
   - License: SIL Open Font License 1.1
   - Source: https://rsms.me/inter/
   - Usage: Excellent for receipt text, supports many languages

2. **Roboto**
   - License: Apache License 2.0
   - Source: https://fonts.google.com/specimen/Roboto
   - Usage: Good alternative, widely available

### Font Files Required

For the default configuration, the following font files are expected:

- `Inter-Regular.ttf` - Regular weight (400)
- `Inter-Bold.ttf` - Bold weight (700)

Or alternatively with Roboto:
- `Roboto-Regular.ttf`
- `Roboto-Bold.ttf`

### Downloading Fonts

**Inter:**
```bash
# Download from https://github.com/rsms/inter/releases
# Extract and copy Inter-Regular.ttf and Inter-Bold.ttf here
```

**Roboto:**
```bash
# Download from https://fonts.google.com/specimen/Roboto
# Or use: wget https://github.com/googlefonts/roboto/releases
```

### Licensing Compliance

- SIL Open Font License 1.1 allows:
  - Commercial use
  - Embedding in PDF documents
  - Modification and redistribution
  
- Apache License 2.0 allows:
  - Commercial use
  - Embedding in PDF documents
  - Modification with attribution

### Adding Custom Fonts

To use custom fonts:

1. Ensure the font license permits commercial use and PDF embedding
2. Add the font files to this directory
3. Update `backend/src/config/fonts.ts` with the new font configuration
4. Set `PDF_DEFAULT_FONT` environment variable to the font name

### Font Verification

Before deploying, verify fonts are properly embedded:
1. Generate a test PDF
2. Open in a PDF reader
3. Check document properties for embedded fonts
