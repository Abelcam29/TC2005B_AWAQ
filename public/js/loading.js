/**
 * Sistema de Loading States Unificado para MAWI
 * Componentes reutilizables para estados de carga
 */

class LoadingSystem {
    constructor() {
        this.activeLoaders = new Map();
    }

    /**
     * Mostrar loading en un contenedor específico
     * @param {string|HTMLElement} container - Selector o elemento
     * @param {Object} options - Opciones de configuración
     */
    show(container, options = {}) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return null;

        const config = {
            message: options.message || 'Cargando...',
            type: options.type || 'spinner', // spinner, dots, bars, skeleton
            size: options.size || 'medium', // small, medium, large
            overlay: options.overlay !== false,
            preserveHeight: options.preserveHeight || false,
            className: options.className || ''
        };

        const loaderId = this.generateId();
        const loader = this.createLoader(loaderId, config);
        
        // Guardar estado original si es necesario
        if (config.overlay) {
            const originalContent = element.innerHTML;
            const originalHeight = config.preserveHeight ? element.offsetHeight : null;
            
            this.activeLoaders.set(loaderId, {
                element,
                originalContent,
                originalHeight,
                config
            });
            
            element.style.position = 'relative';
            if (originalHeight) element.style.minHeight = `${originalHeight}px`;
            element.appendChild(loader);
        } else {
            element.innerHTML = loader.outerHTML;
            this.activeLoaders.set(loaderId, { element, config });
        }

        return loaderId;
    }

    /**
     * Ocultar loading específico
     * @param {string} loaderId - ID del loader
     */
    hide(loaderId) {
        const loaderData = this.activeLoaders.get(loaderId);
        if (!loaderData) return;

        const { element, originalContent, originalHeight } = loaderData;
        const loader = element.querySelector(`[data-loader-id="${loaderId}"]`);
        
        if (loader) {
            loader.classList.add('loading-fade-out');
            setTimeout(() => {
                if (originalContent !== undefined) {
                    element.innerHTML = originalContent;
                    if (originalHeight) element.style.minHeight = '';
                } else {
                    loader.remove();
                }
                this.activeLoaders.delete(loaderId);
            }, 200);
        }
    }

    /**
     * Crear elemento loader
     */
    createLoader(id, config) {
        const loader = document.createElement('div');
        loader.className = `loading-component loading-${config.type} loading-${config.size} ${config.className}`;
        loader.dataset.loaderId = id;
        
        if (config.overlay) {
            loader.classList.add('loading-overlay');
        }

        loader.innerHTML = this.getLoaderHTML(config);
        return loader;
    }

    /**
     * Generar HTML según el tipo de loader
     */
    getLoaderHTML(config) {
        switch (config.type) {
            case 'spinner':
                return `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        ${config.message ? `<div class="loading-message">${config.message}</div>` : ''}
                    </div>
                `;
            
            case 'dots':
                return `
                    <div class="loading-content">
                        <div class="loading-dots">
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                        </div>
                        ${config.message ? `<div class="loading-message">${config.message}</div>` : ''}
                    </div>
                `;
            
            case 'bars':
                return `
                    <div class="loading-content">
                        <div class="loading-bars">
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                        </div>
                        ${config.message ? `<div class="loading-message">${config.message}</div>` : ''}
                    </div>
                `;
            
            case 'skeleton':
                return `
                    <div class="loading-skeleton">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text short"></div>
                    </div>
                `;
            
            case 'table':
                return `
                    <tr class="loading-table-row">
                        <td colspan="100%" class="loading-table-cell">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <div class="loading-message">${config.message}</div>
                            </div>
                        </td>
                    </tr>
                `;
            
            default:
                return this.getLoaderHTML({ ...config, type: 'spinner' });
        }
    }

    generateId() {
        return 'loader_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Métodos de conveniencia
    showSpinner(container, message = 'Cargando...', size = 'medium') {
        return this.show(container, { type: 'spinner', message, size });
    }

    showDots(container, message = 'Cargando...', size = 'medium') {
        return this.show(container, { type: 'dots', message, size });
    }

    showSkeleton(container) {
        return this.show(container, { type: 'skeleton', overlay: false });
    }

    showTableLoading(tbody, message = 'Cargando datos...') {
        if (typeof tbody === 'string') tbody = document.querySelector(tbody);
        if (!tbody) return null;
        
        const colCount = tbody.closest('table')?.querySelector('thead tr')?.children.length || 1;
        tbody.innerHTML = `
            <tr class="loading-table-row">
                <td colspan="${colCount}" class="loading-table-cell">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-message">${message}</div>
                    </div>
                </td>
            </tr>
        `;
        
        return 'table_loading';
    }

    hideTableLoading(tbody) {
        if (typeof tbody === 'string') tbody = document.querySelector(tbody);
        if (!tbody) return;
        
        const loadingRow = tbody.querySelector('.loading-table-row');
        if (loadingRow) {
            loadingRow.remove();
        }
    }

    // Limpiar todos los loaders
    clear() {
        this.activeLoaders.forEach((_, id) => this.hide(id));
    }
}

// Instancia global
const loadingSystem = new LoadingSystem();

// Funciones globales para compatibilidad
function showLoading(container, options = {}) {
    return loadingSystem.show(container, options);
}

function hideLoading(loaderId) {
    return loadingSystem.hide(loaderId);
}

function showSpinner(container, message = 'Cargando...', size = 'medium') {
    return loadingSystem.showSpinner(container, message, size);
}

function showTableLoading(tbody, message = 'Cargando datos...') {
    return loadingSystem.showTableLoading(tbody, message);
}

function hideTableLoading(tbody) {
    return loadingSystem.hideTableLoading(tbody);
}

function showSkeleton(container) {
    return loadingSystem.showSkeleton(container);
}

// Funciones específicas para formularios
function showFormLoading(form, message = 'Enviando...') {
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.innerHTML = `<span class="loading-spinner-small"></span> ${message}`;
    }
    return 'form_loading';
}

function hideFormLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn && submitBtn.dataset.originalText) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText;
        delete submitBtn.dataset.originalText;
    }
}