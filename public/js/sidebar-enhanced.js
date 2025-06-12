/**
 * Sistema de Sidebar Mejorado para MAWI
 * Incluye persistencia, mejores animaciones y fix del toggle duplicado
 */

class SidebarSystem {
    constructor() {
        this.isInitialized = false;
        this.currentState = 'collapsed'; // collapsed, expanded
        this.sidebarElement = null;
        this.toggleButton = null;
        this.mainContent = null;
        this.overlay = null;
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createOverlay();
        this.loadSavedState();
        this.bindEvents();
        this.handleResize();
        this.isInitialized = true;
        
        console.log('🎯 Sidebar system initialized');
    }

    createOverlay() {
        if (!document.getElementById('sidebar-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'sidebar-overlay';
            this.overlay.className = 'sidebar-overlay';
            this.overlay.addEventListener('click', () => this.close());
            document.body.appendChild(this.overlay);
        } else {
            this.overlay = document.getElementById('sidebar-overlay');
        }
    }    loadSavedState() {
        const savedState = localStorage.getItem('mawi_sidebar_state');
        if (savedState) {
            this.currentState = savedState;
        } else {
            // Estado por defecto según el tamaño de pantalla
            this.currentState = this.isMobile ? 'collapsed' : 'expanded';
        }
    }

    saveState() {
        localStorage.setItem('mawi_sidebar_state', this.currentState);
    }

    bindEvents() {
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentState === 'expanded' && this.isMobile) {
                this.close();
            }
        });

        // Detectar cuando se carga el sidebar dinámicamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const sidebar = node.querySelector?.('.admin-sidebar') || 
                                      (node.classList?.contains('admin-sidebar') ? node : null);
                        const toggleBtn = node.querySelector?.('.sidebar-toggle') || 
                                        (node.classList?.contains('sidebar-toggle') ? node : null);
                        
                        if (sidebar) this.registerSidebar(sidebar);
                        if (toggleBtn) this.registerToggleButton(toggleBtn);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Registrar elementos existentes
        this.findAndRegisterElements();
    }

    findAndRegisterElements() {
        // Buscar sidebar
        const sidebar = document.querySelector('.admin-sidebar, .sidebar');
        if (sidebar) this.registerSidebar(sidebar);

        // Buscar toggle buttons y eliminar duplicados
        const toggleButtons = document.querySelectorAll('.sidebar-toggle, #sidebarToggle');
        toggleButtons.forEach((btn, index) => {
            if (index === 0) {
                this.registerToggleButton(btn);
            } else {
                // Remover botones duplicados
                console.warn('🔧 Removing duplicate sidebar toggle button');
                btn.remove();
            }
        });

        // Buscar main content
        this.mainContent = document.querySelector('.admin-main-content, .main-content');
    }

    registerSidebar(sidebar) {
        if (this.sidebarElement === sidebar) return;
        
        this.sidebarElement = sidebar;
        this.applySidebarState();
        
        console.log('📋 Sidebar registered');
    }

    registerToggleButton(button) {
        if (this.toggleButton === button) return;
        
        // Remover listener anterior si existe
        if (this.toggleButton) {
            this.toggleButton.removeEventListener('click', this.toggleHandler);
        }
        
        this.toggleButton = button;
        this.toggleHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        };
        
        this.toggleButton.addEventListener('click', this.toggleHandler);
        this.updateToggleButton();
        
        console.log('🔘 Toggle button registered');
    }

    toggle() {
        if (this.currentState === 'expanded') {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.currentState = 'expanded';
        this.applySidebarState();
        this.saveState();
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('sidebarOpened'));
    }

    close() {
        this.currentState = 'collapsed';
        this.applySidebarState();
        this.saveState();
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('sidebarClosed'));
    }

    applySidebarState() {
        if (!this.sidebarElement) return;

        // Remover clases existentes
        this.sidebarElement.classList.remove('sidebar-expanded', 'sidebar-collapsed');
        
        // Aplicar nueva clase
        this.sidebarElement.classList.add(`sidebar-${this.currentState}`);
        
        // Manejar overlay en mobile
        if (this.isMobile) {
            if (this.currentState === 'expanded') {
                this.overlay.classList.add('sidebar-overlay-active');
                document.body.classList.add('sidebar-open');
            } else {
                this.overlay.classList.remove('sidebar-overlay-active');
                document.body.classList.remove('sidebar-open');
            }
        } else {
            this.overlay.classList.remove('sidebar-overlay-active');
            document.body.classList.remove('sidebar-open');
        }        // Actualizar main content
        if (this.mainContent) {
            this.mainContent.classList.remove('sidebar-expanded', 'sidebar-collapsed');
            this.mainContent.classList.add(`sidebar-${this.currentState}`);
        } else {
            // Buscar main content si no se ha encontrado antes
            this.mainContent = document.querySelector('.admin-main-content');
            if (this.mainContent) {
                this.mainContent.classList.remove('sidebar-expanded', 'sidebar-collapsed');
                this.mainContent.classList.add(`sidebar-${this.currentState}`);
            }
        }

        // Actualizar header también
        const header = document.querySelector('.admin-header');
        if (header && window.innerWidth > 1024) {
            header.classList.remove('sidebar-expanded', 'sidebar-collapsed');
            header.classList.add(`sidebar-${this.currentState}`);
        } else if (header) {
            // En mobile, remover todas las clases de sidebar
            header.classList.remove('sidebar-expanded', 'sidebar-collapsed');
        }

        // Actualizar toggle button
        this.updateToggleButton();
    }

    updateToggleButton() {
        if (!this.toggleButton) return;

        this.toggleButton.classList.remove('sidebar-open', 'sidebar-closed');
        this.toggleButton.classList.add(`sidebar-${this.currentState === 'expanded' ? 'open' : 'closed'}`);
        
        // Actualizar aria-label
        const label = this.currentState === 'expanded' ? 'Cerrar menú lateral' : 'Abrir menú lateral';
        this.toggleButton.setAttribute('aria-label', label);
    }    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            // Cambió el modo mobile/desktop
            if (this.isMobile) {
                // Cambió a mobile: colapsar sidebar
                this.close();
            } else {
                // Cambió a desktop: expandir sidebar automáticamente
                this.open();
            }
        }
    }

    // API pública
    getState() {
        return this.currentState;
    }

    setState(state) {
        if (['expanded', 'collapsed'].includes(state)) {
            this.currentState = state;
            this.applySidebarState();
            this.saveState();
        }
    }

    isOpen() {
        return this.currentState === 'expanded';
    }

    isClosed() {
        return this.currentState === 'collapsed';
    }

    // Método para cargar sidebar dinámicamente (mejorado)
    async loadSidebarComponent(containerSelector, sidebarUrl = 'components/admin-sidebar.html') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Sidebar container not found:', containerSelector);
            return false;
        }

        try {
            // Mostrar loading
            const loadingId = showLoading(container, {
                type: 'skeleton',
                message: 'Cargando menú...'
            });

            const response = await fetch(sidebarUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sidebarHtml = await response.text();
            
            // Ocultar loading
            hideLoading(loadingId);
            
            container.innerHTML = sidebarHtml;
            
            // Buscar y registrar el nuevo sidebar
            setTimeout(() => {
                this.findAndRegisterElements();
                this.setActiveMenuItem();
            }, 100);

            return true;
        } catch (error) {
            console.error('Error loading sidebar:', error);
            hideLoading(loadingId);
            
            container.innerHTML = `
                <div class="sidebar-error">
                    <p>Error al cargar el menú</p>
                    <button onclick="sidebarSystem.loadSidebarComponent('${containerSelector}')" 
                            class="admin-btn admin-btn-sm admin-btn-outline">
                        Reintentar
                    </button>
                </div>
            `;
            
            return false;
        }
    }

    setActiveMenuItem() {
        if (!this.sidebarElement) return;

        const currentPage = document.body.dataset.page || 
                           window.location.pathname.split('/').pop().replace('.html', '');
        
        // Remover active de todos los items
        const menuItems = this.sidebarElement.querySelectorAll('.sidebar-item, .admin-nav-item');
        menuItems.forEach(item => item.classList.remove('active'));

        // Buscar y activar el item actual
        const activeItem = this.sidebarElement.querySelector(
            `[data-page="${currentPage}"], [href*="${currentPage}"]`
        );
        
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}

// Instancia global
const sidebarSystem = new SidebarSystem();

// Funciones globales para compatibilidad
function toggleSidebar() {
    return sidebarSystem.toggle();
}

function openSidebar() {
    return sidebarSystem.open();
}

function closeSidebar() {
    return sidebarSystem.close();
}

function loadSidebar(containerSelector, sidebarUrl) {
    return sidebarSystem.loadSidebarComponent(containerSelector, sidebarUrl);
}

// Mejorar la función setupSidebarToggle existente
function setupSidebarToggle() {
    // Esta función ahora es manejada automáticamente por el SidebarSystem
    console.log('✅ Sidebar toggle setup handled by SidebarSystem');
}

// Event listeners para funcionalidades adicionales
window.addEventListener('sidebarOpened', () => {
    console.log('📂 Sidebar opened');
});

window.addEventListener('sidebarClosed', () => {
    console.log('📁 Sidebar closed');
});