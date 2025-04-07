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

    // Obtener todos los valores de los filtros
    const searchQuery = document.querySelector('input[name="search"]').value;
    const messageType = document.getElementById('messageType').value;
    const subject = document.getElementById('subject').value;
    const status = document.getElementById('status').value;
    const direction = document.getElementById('direction').value;

    // Construir la URL con los parámetros activos
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (messageType) params.append('message_type', messageType);
    if (subject) params.append('subject', subject);
    if (status) params.append('status', status);
    if (direction) params.append('direction', direction);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    
    // Actualizar la URL sin recargar la página
    window.history.pushState({}, '', newUrl);
    
    // Realizar la búsqueda mediante fetch
    fetch(newUrl)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newChatbox = doc.getElementById('chatbox');
            if (newChatbox) {
                document.getElementById('chatbox').innerHTML = newChatbox.innerHTML;
                scrollToBottom();
            }
        });
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

// Función para hacer scroll al final del chat
function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    if (chatbox) {
        chatbox.scrollTop = chatbox.scrollHeight;
    }
}

// Manejar la búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const button = document.createElement('button');
            button.style.display = 'none';
            toggleFilter(button, 'search', this.value);
        });
    }
});

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