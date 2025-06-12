// Explorador de Anteproyectos - Frontend Only
class ExploradorManager {
    constructor() {
        this.anteproyectos = this.loadAnteproyectos();
        this.currentTab = 'abiertos';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderAnteproyectos();
        this.loadSampleData();
    }

    bindEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = idx === 0 ? 'abiertos' : 'cerrados';
                this.renderAnteproyectos();
            });
        });
    }

    loadAnteproyectos() {
        const saved = localStorage.getItem('mawi_anteproyectos');
        return saved ? JSON.parse(saved) : [];
    }

    saveAnteproyectos() {
        localStorage.setItem('mawi_anteproyectos', JSON.stringify(this.anteproyectos));
    }

    loadSampleData() {
        if (this.anteproyectos.length === 0) {
            const sampleData = [
                {
                    id: 1,
                    titulo: 'Sistema de Riego Inteligente',
                    descripcion: 'Proyecto de IoT para optimizar el uso de agua en agricultura.',
                    fechaCreacion: '2025-06-01',
                    fechaLimite: '2025-12-31',
                    estado: 'abierto'
                },
                {
                    id: 2,
                    titulo: 'Plataforma de Telemedicina',
                    descripcion: 'Solución digital para consultas médicas remotas.',
                    fechaCreacion: '2025-01-15',
                    fechaLimite: '2025-05-30',
                    estado: 'cerrado'
                }
            ];
            this.anteproyectos = sampleData;
            this.saveAnteproyectos();
            this.renderAnteproyectos();
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
            `;
            container.appendChild(card);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new ExploradorManager();
});