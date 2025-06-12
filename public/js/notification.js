/**
 * Sistema de Notificaciones Unificado para MAWI
 * Reemplaza alerts nativos con toasts modernos y consistentes
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.idCounter = 0;
        this.init();
    }

    init() {
        // Crear container solo si no existe
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    /**
     * Mostrar notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms (0 = no auto-close)
     * @param {Object} options - Opciones adicionales
     */
    show(message, type = 'info', duration = 4000, options = {}) {
        const id = ++this.idCounter;
        const notification = this.createNotification(id, message, type, options);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Animación de entrada
        requestAnimationFrame(() => {
            notification.classList.add('notification-show');
        });

        // Auto-close si duration > 0
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    createNotification(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.dataset.id = id;

        const icon = this.getIcon(type);
        const title = options.title || this.getDefaultTitle(type);
        const showClose = options.showClose !== false;

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-body">
                    ${title ? `<div class="notification-title">${title}</div>` : ''}
                    <div class="notification-message">${message}</div>
                </div>
                ${showClose ? '<button class="notification-close" onclick="notifications.hide(' + id + ')">&times;</button>' : ''}
            </div>
            <div class="notification-progress"></div>
        `;

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        return icons[type] || icons.info;
    }

    getDefaultTitle(type) {
        const titles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información',
            loading: 'Cargando...'
        };
        return titles[type] || '';
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }

    // Métodos de conveniencia
    success(message, duration = 4000, options = {}) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration = 6000, options = {}) {
        return this.show(message, 'error', duration, options);
    }

    warning(message, duration = 5000, options = {}) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration = 4000, options = {}) {
        return this.show(message, 'info', duration, options);
    }

    loading(message = 'Cargando...', options = {}) {
        return this.show(message, 'loading', 0, options);
    }

    // Limpiar todas las notificaciones
    clear() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    // Confirmar con notificación personalizada
    async confirm(message, title = '¿Estás seguro?', options = {}) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'notification-modal';
            modal.innerHTML = `
                <div class="notification-modal-content">
                    <div class="notification-modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="notification-modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="notification-modal-actions">
                        <button class="admin-btn admin-btn-secondary" data-action="cancel">
                            ${options.cancelText || 'Cancelar'}
                        </button>
                        <button class="admin-btn admin-btn-danger" data-action="confirm">
                            ${options.confirmText || 'Confirmar'}
                        </button>
                    </div>
                </div>
            `;

            modal.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'confirm') {
                    document.body.removeChild(modal);
                    resolve(true);
                } else if (e.target.dataset.action === 'cancel' || e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });

            document.body.appendChild(modal);
        });
    }
}

// Instancia global
const notifications = new NotificationSystem();

// Funciones globales para compatibilidad
function showNotification(message, type = 'info', duration = 4000) {
    return notifications.show(message, type, duration);
}

function showSuccess(message, duration = 4000) {
    return notifications.success(message, duration);
}

function showError(message, duration = 6000) {
    return notifications.error(message, duration);
}

function showWarning(message, duration = 5000) {
    return notifications.warning(message, duration);
}

function showInfo(message, duration = 4000) {
    return notifications.info(message, duration);
}

function showLoading(message = 'Cargando...') {
    return notifications.loading(message);
}

function hideNotification(id) {
    return notifications.hide(id);
}

function confirmAction(message, title) {
    return notifications.confirm(message, title);
}

// Reemplazar alert global (opcional)
window.originalAlert = window.alert;
window.alert = function(message) {
    return notifications.info(message);
};

// Reemplazar confirm global (opcional)
window.originalConfirm = window.confirm;
window.confirm = function(message) {
    return notifications.confirm(message);
};