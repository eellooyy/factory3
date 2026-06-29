// common_ui.js
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    function toggleSidebar() {
        if (!hamburgerBtn || !sidebar || !backdrop) return;
        
        hamburgerBtn.classList.toggle('open');
        sidebar.classList.toggle('open');
        
        if (sidebar.classList.contains('open')) {
            backdrop.classList.add('show');
        } else {
            backdrop.classList.remove('show');
        }
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }
    
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    }
});