function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

function toggleFilter(button, filterType, value) {
    const input = document.getElementById(filterType);
    const currentValue = input.value;
    
    // Si el botón ya está activo o el valor es el mismo, desactivar el filtro
    if (button.classList.contains('active') || currentValue === value) {
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

// Función para mantener el estado activo de los filtros después de recargar
function initializeFilterStates() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar y activar los filtros según los parámetros de la URL
    const filterTypes = ['messageType', 'subject', 'status', 'direction'];
    
    filterTypes.forEach(type => {
        const value = urlParams.get(type === 'messageType' ? 'message_type' : type);
        if (value) {
            const buttons = document.querySelectorAll(`[onclick*="toggleFilter(this, '${type}'"]`);
            buttons.forEach(button => {
                if (button.onclick.toString().includes(`'${value}'`)) {
                    button.classList.add('active');
                }
            });
        }
    });
}

// Cerrar sidebar al hacer clic en un enlace (en móvil)
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});

// Inicializar estados de los filtros cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeFilterStates);