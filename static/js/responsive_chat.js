function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

function toggleFilter(element, filterType, value) {
    const input = document.getElementById(filterType);
    if (input) {
        input.value = value || '';
    }

    // Construir y actualizar la URL con los filtros activos
    const params = new URLSearchParams(window.location.search);
    ['search', 'messageType', 'subject', 'status', 'direction'].forEach(type => {
        const val = document.getElementById(type)?.value;
        if (val) {
            params.set(type === 'messageType' ? 'message_type' : type, val);
        } else {
            params.delete(type === 'messageType' ? 'message_type' : type);
        }
    });

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);

    // Actualizar el contenido del chat
    fetch(newUrl)
        .then(response => response.text())
        .then(html => {
            const newChatbox = new DOMParser().parseFromString(html, 'text/html').getElementById('chatbox');
            if (newChatbox) {
                document.getElementById('chatbox').innerHTML = newChatbox.innerHTML;
                scrollToBottom();
            }
        })
        .catch(error => console.error('Error al actualizar los mensajes:', error));
}

// Inicializar filtros activos al cargar la página
function initializeFilterStates() {
    const params = new URLSearchParams(window.location.search);
    ['message_type', 'subject', 'status', 'direction', 'search'].forEach(type => {
        const value = params.get(type);
        if (value) {
            const button = document.querySelector(`[data-filter-type="${type === 'message_type' ? 'messageType' : type}"][data-value="${value}"]`);
            if (button) button.classList.add('active');
            const input = document.getElementById(type === 'message_type' ? 'messageType' : type);
            if (input) input.value = value;
        }
    });
}

// Función para hacer scroll al final del chat
function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    if (chatbox) chatbox.scrollTop = chatbox.scrollHeight;
}

// Manejar la búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            toggleFilter(document.createElement('button'), 'search', this.value);
        });
    }
    initializeFilterStates();
});

// Cerrar sidebar al hacer clic en un enlace (en móvil)
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});