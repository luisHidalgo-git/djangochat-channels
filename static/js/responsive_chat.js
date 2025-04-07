function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

function toggleFilter(button, filterType, value) {
    const input = document.getElementById(filterType);
    if (input.value === value) {
        input.value = '';
        button.classList.remove('active');
    } else {
        // Desactivar otros botones del mismo tipo
        if (filterType === 'messageType' || filterType === 'status' || filterType === 'direction') {
            document.querySelectorAll(`[onclick*="toggleFilter(this, '${filterType}'"]`).forEach(btn => {
                btn.classList.remove('active');
            });
        }
        input.value = value;
        button.classList.add('active');
    }
    button.closest('form').submit();
}

// Cerrar sidebar al hacer clic en un enlace (en móvil)
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});