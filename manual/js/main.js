/**
 * POS Application Instruction Manual - Main JavaScript
 * Handles navigation, language switching, and interactive features
 */

// ==========================================================================
// Configuration
// ==========================================================================

const CONFIG = {
    defaultLanguage: 'en',
    languages: ['en', 'it'],
    paths: {
        en: 'en/',
        it: 'it/'
    }
};

// ==========================================================================
// Navigation Data
// ==========================================================================

const NAVIGATION = {
    en: {
        'getting-started': {
            title: 'Getting Started',
            pages: {
                'introduction': 'Introduction',
                'system-requirements': 'System Requirements',
                'first-time-setup': 'First-Time Setup',
                'quick-start-guide': 'Quick Start Guide'
            }
        },
        'user-guide': {
            title: 'User Guide',
            pages: {
                'logging-in': 'Logging In',
                'pos-interface': 'POS Interface Overview',
                'taking-orders': 'Taking Orders',
                'managing-tables': 'Managing Tables',
                'processing-payments': 'Processing Payments',
                'working-with-tabs': 'Working with Tabs',
                'virtual-keyboard': 'Virtual Keyboard',
                'end-of-shift': 'End of Shift'
            }
        },
        'admin-guide': {
            title: 'Administrator Guide',
            pages: {
                'admin-panel-overview': 'Admin Panel Overview',
                'dashboard': 'Dashboard',
                'product-management': 'Product Management',
                'category-management': 'Category Management',
                'stock-items-management': 'Stock Items Management',
                'inventory-management': 'Inventory Management',
                'user-management': 'User Management',
                'till-management': 'Till Management',
                'table-room-management': 'Table & Room Management',
                'transaction-history': 'Transaction History',
                'analytics': 'Analytics',
                'daily-closing': 'Daily Closing',
                'itemised-consumption': 'Itemised Consumption',
                'settings': 'Settings'
            }
        },
        'reference': {
            title: 'Reference',
            pages: {
                'keyboard-shortcuts': 'Keyboard Shortcuts',
                'glossary': 'Glossary',
                'faq': 'FAQ',
                'troubleshooting': 'Troubleshooting'
            }
        },
        'appendix': {
            title: 'Appendix',
            pages: {
                'database-schema': 'Database Schema Overview',
                'api-endpoints': 'API Endpoints Reference',
                'release-notes': 'Release Notes'
            }
        }
    },
    it: {
        'getting-started': {
            title: 'Per Iniziare',
            pages: {
                'introduction': 'Introduzione',
                'system-requirements': 'Requisiti di Sistema',
                'first-time-setup': 'Configurazione Iniziale',
                'quick-start-guide': 'Guida Rapida'
            }
        },
        'user-guide': {
            title: 'Guida Utente',
            pages: {
                'logging-in': 'Accesso',
                'pos-interface': 'Panoramica Interfaccia POS',
                'taking-orders': 'Effettuare Ordini',
                'managing-tables': 'Gestione Tavoli',
                'processing-payments': 'Elaborazione Pagamenti',
                'working-with-tabs': 'Lavorare con i Conti Aperti',
                'virtual-keyboard': 'Tastiera Virtuale',
                'end-of-shift': 'Fine Turno'
            }
        },
        'admin-guide': {
            title: 'Guida Amministratore',
            pages: {
                'admin-panel-overview': 'Panoramica Pannello Admin',
                'dashboard': 'Dashboard',
                'product-management': 'Gestione Prodotti',
                'category-management': 'Gestione Categorie',
                'stock-items-management': 'Gestione Articoli di Magazzino',
                'inventory-management': 'Gestione Inventario',
                'user-management': 'Gestione Utenti',
                'till-management': 'Gestione Cassa',
                'table-room-management': 'Gestione Tavoli e Sale',
                'transaction-history': 'Storico Transazioni',
                'analytics': 'Analisi',
                'daily-closing': 'Chiusura Giornaliera',
                'itemised-consumption': 'Consumo Dettagliato',
                'settings': 'Impostazioni'
            }
        },
        'reference': {
            title: 'Riferimento',
            pages: {
                'keyboard-shortcuts': 'Scorciatoie da Tastiera',
                'glossary': 'Glossario',
                'faq': 'FAQ',
                'troubleshooting': 'Risoluzione Problemi'
            }
        },
        'appendix': {
            title: 'Appendice',
            pages: {
                'database-schema': 'Schema Database',
                'api-endpoints': 'Riferimento API',
                'release-notes': 'Note di Rilascio'
            }
        }
    }
};

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Get current language from URL path
 */
function getCurrentLanguage() {
    const path = window.location.pathname;
    if (path.includes('/it/')) return 'it';
    return 'en';
}

/**
 * Get current section from URL path
 */
function getCurrentSection() {
    const path = window.location.pathname;
    const sections = ['getting-started', 'user-guide', 'admin-guide', 'reference', 'appendix'];
    
    for (const section of sections) {
        if (path.includes(`/${section}/`)) {
            return section;
        }
    }
    return null;
}

/**
 * Get current page from URL path
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    // Get the last part (filename without extension)
    const filename = pathParts[pathParts.length - 1];
    if (filename && filename !== 'index.html') {
        return filename.replace('.html', '');
    }
    
    // Check for index pages
    if (pathParts.length >= 2) {
        const section = pathParts[1];
        if (section === 'en' || section === 'it') {
            return 'index';
        }
    }
    
    return 'index';
}

/**
 * Build navigation URL
 */
function buildUrl(language, section, page) {
    if (page === 'index') {
        return `${language}/index.html`;
    }
    return `${language}/${section}/${page}.html`;
}

// ==========================================================================
// Navigation Generation
// ==========================================================================

/**
 * Generate sidebar navigation
 */
function generateNavigation() {
    const language = getCurrentLanguage();
    const currentSection = getCurrentSection();
    const navData = NAVIGATION[language];
    
    const sidebar = document.getElementById('sidebar-nav');
    if (!sidebar) return;
    
    let navHtml = '';
    
    for (const [sectionKey, sectionData] of Object.entries(navData)) {
        const isActive = sectionKey === currentSection;
        
        navHtml += `
            <div class="nav-section">
                <div class="nav-section-title">${sectionData.title}</div>
        `;
        
        for (const [pageKey, pageTitle] of Object.entries(sectionData.pages)) {
            const isPageActive = currentSection === sectionKey && getCurrentPage() === pageKey;
            const pageUrl = buildUrl(language, sectionKey, pageKey);
            
            navHtml += `
                <a href="${pageUrl}" class="nav-item ${isPageActive ? 'active' : ''}">
                    ${pageTitle}
                </a>
            `;
        }
        
        navHtml += '</div>';
    }
    
    sidebar.innerHTML = navHtml;
}

/**
 * Generate breadcrumb navigation
 */
function generateBreadcrumb() {
    const language = getCurrentLanguage();
    const currentSection = getCurrentSection();
    const currentPage = getCurrentPage();
    const navData = NAVIGATION[language];
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    let breadcrumbHtml = `
        <li class="breadcrumb-item">
            <a href="${language}/index.html">${language === 'en' ? 'Home' : 'Home'}</a>
        </li>
    `;
    
    if (currentSection && navData[currentSection]) {
        breadcrumbHtml += `
            <li class="breadcrumb-item">
                <a href="${language}/index.html">${navData[currentSection].title}</a>
            </li>
        `;
        
        if (currentPage !== 'index' && navData[currentSection].pages[currentPage]) {
            breadcrumbHtml += `
                <li class="breadcrumb-item active">
                    ${navData[currentSection].pages[currentPage]}
                </li>
            `;
        }
    }
    
    breadcrumb.innerHTML = breadcrumbHtml;
}

/**
 * Generate table of contents for current page
 */
function generateTableOfContents() {
    const tocContainer = document.getElementById('page-toc');
    if (!tocContainer) return;
    
    // Get all h2 and h3 headings from content
    const content = document.getElementById('page-content');
    if (!content) return;
    
    const headings = content.querySelectorAll('h2, h3');
    if (headings.length === 0) {
        tocContainer.style.display = 'none';
        return;
    }
    
    let tocHtml = '<div class="toc"><div class="toc-title>Contents</div><ul class="toc-list">';
    
    headings.forEach((heading, index) => {
        // Add ID to heading if not present
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        const level = heading.tagName.toLowerCase();
        const indentClass = level === 'h3' ? 'toc-indent' : '';
        
        tocHtml += `
            <li class="${indentClass}">
                <a href="#${heading.id}">${heading.textContent}</a>
            </li>
        `;
    });
    
    tocHtml += '</ul></div>';
    tocContainer.innerHTML = tocHtml;
}

// ==========================================================================
// Language Switching
// ==========================================================================

/**
 * Update language switcher active state
 */
function updateLanguageSwitcher() {
    const language = getCurrentLanguage();
    const buttons = document.querySelectorAll('.language-btn');
    
    buttons.forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if (btnLang === language) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Handle language switch
 */
function switchLanguage(newLanguage) {
    const currentLanguage = getCurrentLanguage();
    const currentSection = getCurrentSection();
    const currentPage = getCurrentPage();
    
    if (newLanguage === currentLanguage) return;
    
    // Build new URL
    let newUrl;
    
    // Check if we're on the landing page
    if (window.location.pathname.includes('/manual/index.html') || 
        window.location.pathname === '/manual/' ||
        window.location.pathname === '/manual') {
        // On landing page, go to language index
        newUrl = `${newLanguage}/index.html`;
    } else if (currentSection) {
        // Try to find corresponding page in new language
        const navData = NAVIGATION[newLanguage];
        if (navData && navData[currentSection] && navData[currentSection].pages[currentPage]) {
            newUrl = buildUrl(newLanguage, currentSection, currentPage);
        } else {
            // Fall back to section index
            newUrl = `${newLanguage}/index.html`;
        }
    } else {
        newUrl = `${newLanguage}/index.html`;
    }
    
    window.location.href = newUrl;
}

// ==========================================================================
// Previous/Next Navigation
// ==========================================================================

/**
 * Generate previous/next page navigation
 */
function generatePageNavigation() {
    const language = getCurrentLanguage();
    const currentSection = getCurrentSection();
    const currentPage = getCurrentPage();
    const navData = NAVIGATION[language];
    
    const navContainer = document.getElementById('page-navigation');
    if (!navContainer) return;
    
    if (!currentSection || !navData[currentSection]) {
        navContainer.style.display = 'none';
        return;
    }
    
    const pages = Object.entries(navData[currentSection].pages);
    let prevPage = null;
    let nextPage = null;
    let foundCurrent = false;
    
    for (const [pageKey, pageTitle] of pages) {
        if (pageKey === currentPage) {
            foundCurrent = true;
            continue;
        }
        
        if (!foundCurrent) {
            prevPage = { key: pageKey, title: pageTitle };
        } else if (!nextPage) {
            nextPage = { key: pageKey, title: pageTitle };
            break;
        }
    }
    
    // If on index page, get first page as next
    if (currentPage === 'index' && pages.length > 0) {
        nextPage = { key: pages[0][0], title: pages[0][1] };
    }
    
    let navHtml = '';
    
    if (prevPage) {
        navHtml += `
            <a href="${buildUrl(language, currentSection, prevPage.key)}" class="nav-button prev">
                <span class="nav-button-label">Previous</span>
                <span class="nav-button-title">${prevPage.title}</span>
            </a>
        `;
    }
    
    if (nextPage) {
        navHtml += `
            <a href="${buildUrl(language, currentSection, nextPage.key)}" class="nav-button next">
                <span class="nav-button-title">${nextPage.title}</span>
                <span class="nav-button-label">Next</span>
            </a>
        `;
    }
    
    if (!navHtml) {
        navContainer.style.display = 'none';
        return;
    }
    
    navContainer.innerHTML = navHtml;
}

// ==========================================================================
// Search Functionality (Placeholder)
// ==========================================================================

/**
 * Initialize search (placeholder functionality)
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();
            if (query) {
                alert('Search functionality is coming soon! Searching for: ' + query);
            }
        }
    });
}

// ==========================================================================
// Mobile Navigation
// ==========================================================================

/**
 * Toggle mobile sidebar
 */
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

/**
 * Initialize mobile navigation toggle
 */
function initializeMobileNav() {
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleMobileSidebar);
    }
}

// ==========================================================================
// Scroll to Top
// ==========================================================================

/**
 * Scroll to top functionality
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// Initialize
// ==========================================================================

/**
 * Initialize all functionality on page load
 */
function initialize() {
    // Generate navigation
    generateNavigation();
    
    // Generate breadcrumb
    generateBreadcrumb();
    
    // Generate table of contents
    generateTableOfContents();
    
    // Generate page navigation
    generatePageNavigation();
    
    // Update language switcher
    updateLanguageSwitcher();
    
    // Initialize search
    initializeSearch();
    
    // Initialize mobile nav
    initializeMobileNav();
    
    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Export for global access
window.Manual = {
    switchLanguage,
    toggleMobileSidebar,
    scrollToTop
};
