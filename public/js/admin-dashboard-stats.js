/**
 * MAWI Dashboard de Estadísticas - JavaScript
 * Maneja la carga de datos, gráficas y interacciones
 */

// Configuración global
const API_BASE_URL = '/Consultas/api';
let currentCharts = {};
let currentStats = null;

// Configuración de Chart.js con tema naranja
Chart.defaults.color = '#a0a8b3';
Chart.defaults.borderColor = '#333a44';
Chart.defaults.backgroundColor = 'rgba(255, 107, 53, 0.1)';

/**
 * Inicializar el dashboard
 */
async function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard de Estadísticas...');
    
    try {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        // Cargar sidebar
        await loadSidebar();
        
        // Cargar datos iniciales
        await loadAllStats();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Ocultar loading y mostrar contenido
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';
        
        console.log('✅ Dashboard inicializado exitosamente');
        
    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
        showError('Error cargando el dashboard');
    }
}

/**
 * Verificar autenticación
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() >= payload.exp * 1000;
        return !isExpired && (payload.rol === 3 || payload.rol === 4); // Admin o Super Admin
    } catch (error) {
        return false;
    }
}

/**
 * Cargar todas las estadísticas
 */
async function loadAllStats() {
    try {
        console.log('📊 Cargando estadísticas generales...');
        
        const response = await fetch(`${API_BASE_URL}/stats/general`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            currentStats = data.data;
            updateStatsCards(data.data.resumen);
            createCharts(data.data);
            await loadRecentActivity();
        } else {
            throw new Error(data.message || 'Error obteniendo estadísticas');
        }
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        showError('Error cargando las estadísticas del sistema');
    }
}

/**
 * Actualizar las tarjetas de estadísticas
 */
function updateStatsCards(resumen) {
    const animations = [
        { element: 'totalUsuarios', value: resumen.total_usuarios || 0 },
        { element: 'totalBiomos', value: resumen.total_biomos || 0 },
        { element: 'totalProyectos', value: resumen.total_proyectos || 0 },
        { element: 'totalEspecies', value: resumen.total_especies || 0 }
    ];

    animations.forEach(({ element, value }) => {
        animateCounter(element, value);
    });
}

/**
 * Animar contadores
 */
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const increment = targetValue / 50; // 50 pasos
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 30);
}

/**
 * Crear todas las gráficas
 */
function createCharts(data) {
    // Gráfica de usuarios por rol
    createUsersChart(data.usuarios);
    
    // Gráfica de proyectos por estado
    createProjectsChart(data.proyectos);
    
    // Gráfica de especies por reino
    createSpeciesChart(data.especies);
    
    // Gráfica de línea de tiempo
    createTimelineChart();
}

/**
 * Crear gráfica de usuarios
 */
function createUsersChart(usuarios) {
    const ctx = document.getElementById('usersChart');
    if (!ctx) return;

    // Destruir gráfica anterior si existe
    if (currentCharts.users) {
        currentCharts.users.destroy();
    }

    const data = {
        labels: usuarios.map(u => u.tipo_usuario),
        datasets: [{
            data: usuarios.map(u => u.cantidad),
            backgroundColor: usuarios.map(u => u.color),
            borderColor: usuarios.map(u => u.color),
            borderWidth: 2,
            hoverOffset: 4
        }]
    };

    currentCharts.users = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: '#a0a8b3'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crear gráfica de proyectos
 */
function createProjectsChart(proyectos) {
    const ctx = document.getElementById('projectsChart');
    if (!ctx) return;

    if (currentCharts.projects) {
        currentCharts.projects.destroy();
    }

    const data = {
        labels: proyectos.map(p => p.estado_nombre),
        datasets: [{
            data: proyectos.map(p => p.cantidad),
            backgroundColor: proyectos.map(p => p.color),
            borderColor: proyectos.map(p => p.color),
            borderWidth: 2
        }]
    };

    currentCharts.projects = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: '#a0a8b3'
                    }
                }
            }
        }
    });
}

/**
 * Crear gráfica de especies
 */
function createSpeciesChart(especies) {
    const ctx = document.getElementById('speciesChart');
    if (!ctx) return;

    if (currentCharts.species) {
        currentCharts.species.destroy();
    }

    const data = {
        labels: especies.map(e => e.reino),
        datasets: [{
            label: 'Especies',
            data: especies.map(e => e.cantidad),
            backgroundColor: especies.map(e => e.color + '80'), // Agregar transparencia
            borderColor: especies.map(e => e.color),
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false
        }]
    };

    currentCharts.species = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#333a44'
                    },
                    ticks: {
                        color: '#a0a8b3'
                    }
                },
                x: {
                    grid: {
                        color: '#333a44'
                    },
                    ticks: {
                        color: '#a0a8b3'
                    }
                }
            }
        }
    });
}

/**
 * Crear gráfica de línea de tiempo
 */
async function createTimelineChart() {
    try {
        const period = document.getElementById('timeRangeSelect').value;
        const response = await fetch(`${API_BASE_URL}/stats/timeseries?period=${period}&type=biomonitoreo`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }

        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        if (currentCharts.timeline) {
            currentCharts.timeline.destroy();
        }

        const chartData = {
            labels: data.data.map(item => item.fecha),
            datasets: [{
                label: 'Biomonitoreos',
                data: data.data.map(item => item.cantidad),
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FF6B35',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        };

        currentCharts.timeline = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#333a44'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: period === '7d' ? 'day' : period === '30d' ? 'day' : 'month'
                        },
                        grid: {
                            color: '#333a44'
                        },
                        ticks: {
                            color: '#a0a8b3'
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Error creando gráfica de timeline:', error);
    }
}

/**
 * Cargar actividad reciente (simplified - activity section removed)
 */
async function loadRecentActivity() {
    try {
        // Activity section was removed during cleanup
        // This function is kept for compatibility but no longer updates UI
        console.log('🔄 Activity check (UI section removed)');
        
    } catch (error) {
        console.error('❌ Error cargando actividad reciente:', error);
    }
}

/**
 * Mostrar actividad reciente (simplified - activity section removed)
 */
function displayRecentActivity(activities) {
    // Activity feed element no longer exists since activity sections were removed
    // This function is kept for compatibility but no longer updates UI
    console.log('📊 Activity data received but UI section removed during cleanup');
    return;
}

/**
 * Obtener icono de actividad
 */
function getActivityIcon(tipo) {
    const icons = {
        'biomonitoreo': '🌿',
        'anteproyecto': '📋',
        'usuario': '👤',
        'convocatoria': '📢'
    };
    return icons[tipo] || '📄';
}

/**
 * Calcular tiempo transcurrido
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Responsive sidebar
    window.addEventListener('resize', handleResize);
    handleResize(); // Llamar inicialmente
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.admin-main-content');
    const header = document.querySelector('.admin-header');
    
    if (sidebar && toggle && mainContent) {
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCurrentlyCollapsed) {
            // Opening sidebar
            sidebar.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.classList.add('with-sidebar');
            if (header) {
                header.classList.remove('sidebar-collapsed');
            }
        } else {
            // Closing sidebar
            sidebar.classList.add('collapsed');
            toggle.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
            mainContent.classList.remove('with-sidebar');
            if (header) {
                header.classList.add('sidebar-collapsed');
            }
        }
        
        console.log('Sidebar toggled:', !isCurrentlyCollapsed ? 'closed' : 'opened');
    }
}

/**
 * Manejar redimensionamiento
 */
function handleResize() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.admin-main-content');
    const header = document.querySelector('.admin-header');
    
    if (window.innerWidth <= 768) {
        // Mobile: sidebar collapsed
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
        if (toggle) toggle.classList.add('collapsed');
        if (mainContent) {
            mainContent.classList.add('sidebar-collapsed');
            mainContent.classList.remove('with-sidebar');
        }
        if (header) header.classList.add('sidebar-collapsed');
    } else {
        // Desktop: sidebar open by default for dashboard pages
        if (sidebar) {
            sidebar.classList.remove('collapsed');
        }
        if (toggle) toggle.classList.remove('collapsed');
        if (mainContent) {
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.classList.add('with-sidebar');
        }
        if (header) header.classList.remove('sidebar-collapsed');
    }
}

/**
 * Cargar sidebar
 */
async function loadSidebar() {
    try {
        const response = await fetch('components/admin-sidebar.html');
        const sidebarHTML = await response.text();
        
        const container = document.getElementById('sidebar-container');
        if (container) {
            container.innerHTML = sidebarHTML;
            
            // Marcar item activo
            setTimeout(() => {
                const activeItem = document.querySelector('.sidebar-item[data-page="dashboard-stats"]');
                if (activeItem) {
                    document.querySelectorAll('.sidebar-item').forEach(item => 
                        item.classList.remove('active'));
                    activeItem.classList.add('active');
                }
                
                // Inicializar estado de la sidebar
                initializeSidebarState();
            }, 100);
        }
    } catch (error) {
        console.error('❌ Error cargando sidebar:', error);
    }
}

/**
 * Inicializar estado de la sidebar
 */
function initializeSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.admin-main-content');
    const header = document.querySelector('.admin-header');
    
    if (sidebar && toggle && mainContent) {
        // En desktop, empezar con sidebar abierta para dashboard pages
        // En mobile, empezar collapsed
        if (window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.classList.add('with-sidebar');
            if (header) header.classList.remove('sidebar-collapsed');
            console.log('Sidebar initialized as open (desktop)');
        } else {
            sidebar.classList.add('collapsed');
            toggle.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
            mainContent.classList.remove('with-sidebar');
            if (header) header.classList.add('sidebar-collapsed');
            console.log('Sidebar initialized as closed (mobile)');
        }
    }
}

/**
 * Funciones públicas para botones
 */
window.refreshStats = async function() {
    document.getElementById('loadingIndicator').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
    
    await loadAllStats();
    
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
};

window.exportStats = function() {
    if (!currentStats) return;
    
    const data = {
        timestamp: new Date().toISOString(),
        ...currentStats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mawi-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.updateTimelineChart = function() {
    createTimelineChart();
};

window.toggleChartType = function(chartId) {
    // Implementar cambio de tipo de gráfica si es necesario
    console.log('Toggling chart type for:', chartId);
};

/**
 * Mostrar error
 */
function showError(message) {
    // Implementar notificación de error
    console.error('ERROR:', message);
    alert(message); // Temporal - debería ser una notificación más elegante
}