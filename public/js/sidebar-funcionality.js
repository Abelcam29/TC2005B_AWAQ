// Sidebar Functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.mawi-main-content');

    // Initialize sidebar state
    function initializeSidebarState() {
        const savedState = localStorage.getItem('mawi_sidebar_collapsed');
        const isCollapsed = savedState === 'true';
        
        if (isCollapsed) {
            sidebar.classList.add('sidebar-collapsed');
            if (mainContent) {
                mainContent.classList.add('sidebar-collapsed');
            }
        }
    }

    // Toggle sidebar
    function toggleSidebar() {
        const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
        
        if (isCollapsed) {
            sidebar.classList.remove('sidebar-collapsed');
            if (mainContent) {
                mainContent.classList.remove('sidebar-collapsed');
            }
            localStorage.setItem('mawi_sidebar_collapsed', 'false');
        } else {
            sidebar.classList.add('sidebar-collapsed');
            if (mainContent) {
                mainContent.classList.add('sidebar-collapsed');
            }
            localStorage.setItem('mawi_sidebar_collapsed', 'true');
        }
    }

    // Bind toggle event
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Initialize on load
    initializeSidebarState();

    // Handle window resize
    function handleResize() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('sidebar-collapsed');
            if (mainContent) {
                mainContent.classList.add('sidebar-collapsed');
            }
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on initial load
});