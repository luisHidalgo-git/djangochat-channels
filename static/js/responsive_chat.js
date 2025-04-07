function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

function toggleFilter(button, filterType, value) {
    const input = document.getElementById(filterType);
    
    // Si el botón ya está activo, desactivarlo
    if (button.classList.contains('active')) {
        button.classList.remove('active');
        input.value = '';
    } else {
        // Desactivar otros botones del mismo tipo
        const buttons = document.querySelectorAll(`[onclick*="toggleFilter(this, '${filterType}'"]`);
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Activar el botón actual y establecer el valor
        button.classList.add('active');
        input.value = value;
    }

    // Enviar el formulario
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