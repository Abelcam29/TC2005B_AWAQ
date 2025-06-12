// Explorador de Anteproyectos - Frontend Only
class ExploradorManager {
    constructor() {
        this.anteproyectos = [];
        this.currentTab = 'abiertos';
        this.init();
    }

    bindEvents() {
        // Event listeners para las tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover clase active de todos los botones
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                // Agregar clase active al botón clickeado
                e.target.classList.add('active');
                
                // Determinar qué tab está activa
                this.currentTab = e.target.textContent.toLowerCase() === 'abiertos' ? 'abiertos' : 'cerrados';
                this.renderAnteproyectos();
            });
        });
    }

    loadAnteproyectos() {
        const stored = localStorage.getItem('anteproyectos');
        if (stored) {
            this.anteproyectos = JSON.parse(stored);
        }
    }

    saveAnteproyectos() {
        localStorage.setItem('anteproyectos', JSON.stringify(this.anteproyectos));
    }

    loadSampleData() {
        if (this.anteproyectos.length === 0) {
            const sampleData = [
                {
                    id: 1,
                    titulo: "Sistema de Riego Inteligente",
                    descripcion: "Proyecto de IoT para optimizar el uso de agua en agricultura.",
                    fechaCreacion: "2025-06-01",
                    fechaLimite: "2025-12-31",
                    estado: "abierto"
                },
                {
                    id: 2,
                    titulo: "App de Gestión Educativa",
                    descripcion: "Aplicación móvil para gestionar actividades académicas.",
                    fechaCreacion: "2025-05-15",
                    fechaLimite: "2025-11-30",
                    estado: "cerrado"
                }
            ];
            this.anteproyectos = sampleData;
            this.saveAnteproyectos();
        }
    }

    renderAnteproyectos() {
        const container = document.querySelector('.projects-container');
        if (!container) return;
        
        container.innerHTML = '';
        const filtered = this.anteproyectos.filter(p =>
            this.currentTab === 'abiertos' ? p.estado === 'abierto' : p.estado === 'cerrado'
        );
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-msg">No hay anteproyectos en esta categoría.</div>';
            return;
        }
        
        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-content">
                    <h3 class="project-title">${p.titulo}</h3>
                    <p class="project-description">${p.descripcion}</p>
                    <div class="project-dates">
                        <span class="date-label">Fecha de creación: </span>
                        <span class="date">${p.fechaCreacion}</span>
                        <span class="date-label">Fecha límite: </span>
                        <span class="date">${p.fechaLimite}</span>
                    </div>
                </div>
                <div class="project-action">
                    <button class="circle-btn view-pdf-btn" data-id="${p.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="#30a046" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
        // Asignar eventos a los botones de ver PDF
        document.querySelectorAll('.view-pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                this.loadPdf(id);
                
                // Mostrar el PDF automáticamente cuando se hace clic en el botón +
                const pdfSide = document.querySelector('.pdf-side');
                const projectsSide = document.getElementById('projects-side');
                const sideResizer = document.getElementById('side-resizer');
                const togglePdfBtn = document.getElementById('toggle-pdf-btn');
                
                if (pdfSide && !pdfSide.classList.contains('visible')) {
                    pdfSide.classList.add('visible');
                    projectsSide.classList.add('with-pdf');
                    sideResizer.classList.add('visible');
                    togglePdfBtn.textContent = 'Ocultar PDF';
                    
                    // Actualizar la variable global
                    window.isPdfVisible = true;
                }
                
                // Marcar este proyecto como activo visualmente
                document.querySelectorAll('.project-card').forEach(card => {
                    card.classList.remove('active');
                });
                btn.closest('.project-card').classList.add('active');
            });
        });
    }
    
    init() {
        this.loadAnteproyectos();
        this.loadSampleData();
        this.bindEvents();
        this.setupSplitView();
        this.renderAnteproyectos();
    }
    
    setupSplitView() {
        const resizer = document.getElementById('side-resizer');
        const projectsSide = document.getElementById('projects-side');
        
        if (!resizer || !projectsSide) return;
        
        let startX, startWidth;
        
        resizer.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = projectsSide.getBoundingClientRect().width;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        const resize = (e) => {
            const width = startWidth + (e.clientX - startX);
            const containerWidth = document.querySelector('.split-view').getBoundingClientRect().width;
            const percentWidth = (width / containerWidth) * 100;
            
            if (percentWidth > 20 && percentWidth < 80) {
                projectsSide.style.width = `${percentWidth}%`;
                resizer.style.left = `${percentWidth}%`;
            }
        };
        
        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    loadPdf(id) {
        const pdfMap = {
            1: 'mock-pdfs/anteproyecto1.pdf',
            2: 'mock-pdfs/anteproyecto2.pdf'
        };
        const pdfUrl = pdfMap[id] || 'mock-pdfs/demo.pdf';
        const iframe = document.getElementById('pdfViewer');
        if (iframe) iframe.src = pdfUrl;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the manager
    new ExploradorManager();
    
    // Setup PDF viewer toggle functionality
    const togglePdfBtn = document.getElementById('toggle-pdf-btn');
    const pdfSide = document.querySelector('.pdf-side');
    const projectsSide = document.getElementById('projects-side');
    const sideResizer = document.getElementById('side-resizer');
    
    // Variable global para el estado del PDF
    window.isPdfVisible = false;
    
    if (togglePdfBtn) {
        togglePdfBtn.textContent = 'Mostrar PDF';
        
        togglePdfBtn.addEventListener('click', function() {
            window.isPdfVisible = !window.isPdfVisible;
            
            if (window.isPdfVisible) {
                pdfSide.classList.add('visible');
                projectsSide.classList.add('with-pdf');
                sideResizer.classList.add('visible');
                togglePdfBtn.textContent = 'Ocultar PDF';
            } else {
                pdfSide.classList.remove('visible');
                projectsSide.classList.remove('with-pdf');
                sideResizer.classList.remove('visible');
                togglePdfBtn.textContent = 'Mostrar PDF';
            }
        });
    }
});