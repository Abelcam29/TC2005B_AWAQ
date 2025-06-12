/**
 * Sistema de Validación de Formularios para MAWI
 * Validación en tiempo real con mensajes inline y indicadores
 */

class FormValidationSystem {
    constructor() {
        this.validators = new Map();
        this.forms = new Map();
        this.init();
    }

    init() {
        // Auto-inicializar formularios con data-validate
        document.addEventListener('DOMContentLoaded', () => {
            this.autoInitForms();
        });

        // Observer para formularios dinámicos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const forms = node.querySelectorAll?.('form[data-validate]') || 
                                     (node.matches?.('form[data-validate]') ? [node] : []);
                        forms.forEach(form => this.initForm(form));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    autoInitForms() {
        document.querySelectorAll('form[data-validate]').forEach(form => {
            this.initForm(form);
        });
    }

    /**
     * Inicializar validación en un formulario
     * @param {HTMLFormElement} form - Elemento del formulario
     * @param {Object} options - Opciones de configuración
     */
    initForm(form, options = {}) {
        if (!(form instanceof HTMLFormElement)) {
            form = document.querySelector(form);
        }
        if (!form) return;

        const formId = form.id || 'form_' + Date.now();
        if (!form.id) form.id = formId;

        const config = {
            realTime: options.realTime !== false,
            showIcons: options.showIcons !== false,
            submitOnValid: options.submitOnValid !== false,
            resetOnSubmit: options.resetOnSubmit !== false,
            ...options
        };

        this.forms.set(formId, { form, config, errors: new Map() });

        // Agregar clase CSS
        form.classList.add('form-validated');

        // Marcar campos requeridos
        this.markRequiredFields(form);

        // Bind eventos
        this.bindFormEvents(form, formId);

        // Validar campos existentes con valor
        this.validateAllFields(formId);

        console.log(`✅ Form validation initialized: ${formId}`);
    }

    markRequiredFields(form) {
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            const container = this.getFieldContainer(field);
            if (container) {
                container.classList.add('field-required');
                
                // Agregar asterisco si no existe
                const label = container.querySelector('label') || 
                             form.querySelector(`label[for="${field.id}"]`);
                if (label && !label.querySelector('.required-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'required-indicator';
                    indicator.textContent = ' *';
                    label.appendChild(indicator);
                }
            }
        });
    }

    bindFormEvents(form, formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        // Validación en tiempo real
        if (formData.config.realTime) {
            form.addEventListener('input', (e) => {
                if (this.isValidatableField(e.target)) {
                    this.validateField(e.target, formId);
                }
            });

            form.addEventListener('blur', (e) => {
                if (this.isValidatableField(e.target)) {
                    this.validateField(e.target, formId);
                }
            });
        }

        // Submit handler
        form.addEventListener('submit', (e) => {
            this.handleSubmit(e, formId);
        });
    }

    isValidatableField(field) {
        const validTypes = ['input', 'textarea', 'select'];
        return validTypes.includes(field.tagName.toLowerCase()) && 
               field.type !== 'submit' && 
               field.type !== 'button' &&
               field.type !== 'reset';
    }

    /**
     * Validar un campo específico
     */
    validateField(field, formId) {
        const fieldName = field.name || field.id;
        const value = field.value.trim();
        const formData = this.forms.get(formId);
        
        if (!formData) return false;

        const errors = [];
        
        // Validación de campo requerido
        if (field.required && !value) {
            errors.push('Este campo es obligatorio');
        }

        // Validación por tipo
        if (value) {
            switch (field.type) {
                case 'email':
                    if (!this.validateEmail(value)) {
                        errors.push('Ingresa un email válido');
                    }
                    break;
                    
                case 'password':
                    const passwordErrors = this.validatePassword(value, field);
                    errors.push(...passwordErrors);
                    break;
                    
                case 'tel':
                    if (!this.validatePhone(value)) {
                        errors.push('Ingresa un teléfono válido');
                    }
                    break;
                    
                case 'url':
                    if (!this.validateURL(value)) {
                        errors.push('Ingresa una URL válida');
                    }
                    break;
                    
                case 'number':
                    const numberErrors = this.validateNumber(value, field);
                    errors.push(...numberErrors);
                    break;
            }
        }

        // Validaciones personalizadas
        const customValidation = field.dataset.validate;
        if (customValidation && value) {
            const customErrors = this.runCustomValidation(customValidation, value, field);
            errors.push(...customErrors);
        }

        // Validación de confirmación (ej: confirmar contraseña)
        const confirmField = field.dataset.confirm;
        if (confirmField && value) {
            const confirmTarget = formData.form.querySelector(`[name="${confirmField}"], #${confirmField}`);
            if (confirmTarget && value !== confirmTarget.value) {
                errors.push('Los campos no coinciden');
            }
        }

        // Actualizar estado del campo
        this.updateFieldState(field, errors, formData);
        
        // Guardar errores
        if (errors.length > 0) {
            formData.errors.set(fieldName, errors);
        } else {
            formData.errors.delete(fieldName);
        }

        return errors.length === 0;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password, field) {
        const errors = [];
        const minLength = parseInt(field.minLength) || 8;
        
        if (password.length < minLength) {
            errors.push(`Mínimo ${minLength} caracteres`);
        }
        
        const requireStrong = field.dataset.strongPassword === 'true';
        if (requireStrong) {
            if (!/[A-Z]/.test(password)) {
                errors.push('Debe contener al menos una mayúscula');
            }
            if (!/[a-z]/.test(password)) {
                errors.push('Debe contener al menos una minúscula');
            }
            if (!/\d/.test(password)) {
                errors.push('Debe contener al menos un número');
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errors.push('Debe contener al menos un carácter especial');
            }
        }
        
        return errors;
    }

    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    validateNumber(value, field) {
        const errors = [];
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            errors.push('Debe ser un número válido');
            return errors;
        }
        
        if (field.min !== '' && num < parseFloat(field.min)) {
            errors.push(`Valor mínimo: ${field.min}`);
        }
        
        if (field.max !== '' && num > parseFloat(field.max)) {
            errors.push(`Valor máximo: ${field.max}`);
        }
        
        return errors;
    }

    runCustomValidation(validationType, value, field) {
        const errors = [];
        
        switch (validationType) {
            case 'no-spaces':
                if (/\s/.test(value)) {
                    errors.push('No se permiten espacios');
                }
                break;
                
            case 'alphanumeric':
                if (!/^[a-zA-Z0-9]+$/.test(value)) {
                    errors.push('Solo letras y números');
                }
                break;
                
            case 'letters-only':
                if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                    errors.push('Solo se permiten letras');
                }
                break;
                
            case 'numbers-only':
                if (!/^\d+$/.test(value)) {
                    errors.push('Solo se permiten números');
                }
                break;
        }
        
        return errors;
    }

    updateFieldState(field, errors, formData) {
        const container = this.getFieldContainer(field);
        if (!container) return;

        // Remover clases existentes
        container.classList.remove('field-valid', 'field-error', 'field-validating');
        
        // Remover mensajes de error anteriores
        const existingError = container.querySelector('.field-error-message');
        if (existingError) {
            existingError.remove();
        }

        if (errors.length > 0) {
            // Campo con errores
            container.classList.add('field-error');
            
            // Mostrar primer error
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            errorElement.textContent = errors[0];
            container.appendChild(errorElement);
            
            // Icono de error
            if (formData.config.showIcons) {
                this.updateFieldIcon(container, 'error');
            }
        } else if (field.value.trim()) {
            // Campo válido
            container.classList.add('field-valid');
            
            // Icono de éxito
            if (formData.config.showIcons) {
                this.updateFieldIcon(container, 'success');
            }
        }
    }

    updateFieldIcon(container, type) {
        // Remover icono anterior
        const existingIcon = container.querySelector('.field-icon');
        if (existingIcon) {
            existingIcon.remove();
        }

        const icon = document.createElement('span');
        icon.className = 'field-icon';
        
        switch (type) {
            case 'success':
                icon.innerHTML = '✓';
                icon.classList.add('field-icon-success');
                break;
            case 'error':
                icon.innerHTML = '✗';
                icon.classList.add('field-icon-error');
                break;
            case 'loading':
                icon.innerHTML = '⏳';
                icon.classList.add('field-icon-loading');
                break;
        }
        
        container.appendChild(icon);
    }

    getFieldContainer(field) {
        // Buscar contenedor más cercano
        return field.closest('.form-group') || 
               field.closest('.field-container') || 
               field.closest('.admin-input-group') ||
               field.parentElement;
    }

    validateAllFields(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return false;

        const fields = formData.form.querySelectorAll('input, textarea, select');
        let allValid = true;

        fields.forEach(field => {
            if (this.isValidatableField(field)) {
                const isValid = this.validateField(field, formId);
                if (!isValid) allValid = false;
            }
        });

        return allValid;
    }

    handleSubmit(event, formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        const isValid = this.validateAllFields(formId);
        
        if (!isValid) {
            event.preventDefault();
            
            // Mostrar notificación de error
            const errorCount = formData.errors.size;
            showError(`Por favor corrige ${errorCount} error${errorCount > 1 ? 'es' : ''} en el formulario`);
            
            // Scroll al primer error
            this.scrollToFirstError(formData.form);
            
            return false;
        }

        // Formulario válido
        if (formData.config.submitOnValid) {
            // Permitir envío normal
            showSuccess('Formulario válido, enviando...');
        }

        return true;
    }

    scrollToFirstError(form) {
        const firstError = form.querySelector('.field-error');
        if (firstError) {
            firstError.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Focus en el campo con error
            const field = firstError.querySelector('input, textarea, select');
            if (field) {
                setTimeout(() => field.focus(), 300);
            }
        }
    }

    // API pública
    getFormErrors(formId) {
        const formData = this.forms.get(formId);
        return formData ? formData.errors : new Map();
    }

    isFormValid(formId) {
        const formData = this.forms.get(formId);
        return formData ? formData.errors.size === 0 : false;
    }

    resetForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        formData.form.reset();
        formData.errors.clear();
        
        // Limpiar estados visuales
        const containers = formData.form.querySelectorAll('.field-container, .form-group, .admin-input-group');
        containers.forEach(container => {
            container.classList.remove('field-valid', 'field-error');
            const errorMsg = container.querySelector('.field-error-message');
            const icon = container.querySelector('.field-icon');
            if (errorMsg) errorMsg.remove();
            if (icon) icon.remove();
        });
    }
}

// Instancia global
const formValidation = new FormValidationSystem();

// Funciones globales para compatibilidad
function initFormValidation(formSelector, options = {}) {
    return formValidation.initForm(formSelector, options);
}

function validateForm(formId) {
    return formValidation.validateAllFields(formId);
}

function isFormValid(formId) {
    return formValidation.isFormValid(formId);
}

function resetFormValidation(formId) {
    return formValidation.resetForm(formId);
}

function getFormErrors(formId) {
    return formValidation.getFormErrors(formId);
}