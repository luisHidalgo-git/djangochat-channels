function showExams(e) {
    e.preventDefault();
    window.location.href = '/chat/Sala/?view=exams';
    localStorage.setItem('currentView', 'exams');
    
    // Update active states
    document.querySelector('.courses-section a').classList.remove('active');
    document.querySelector('.exams-section a').classList.add('active');
    document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
}

function showCourses(e) {
    e.preventDefault();
    window.location.href = '/chat/Sala/?view=courses';
    localStorage.setItem('currentView', 'courses');
    
    // Update active states
    document.querySelector('.courses-section a').classList.add('active');
    document.querySelector('.exams-section a').classList.remove('active');
    document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
}

// Verificar la vista actual al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/chat/Sala/') {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        
        // Set current view based on URL parameter or default to 'courses'
        const currentView = viewParam || 'courses';
        localStorage.setItem('currentView', currentView);
        
        // Update active states based on current view
        if (currentView === 'exams') {
            document.querySelector('.courses-section a').classList.remove('active');
            document.querySelector('.exams-section a').classList.add('active');
            document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
            
            document.getElementById('currentView').textContent = 'Exámenes Disponibles';
            document.getElementById('coursesList').classList.add('d-none');
            document.getElementById('examsList').classList.remove('d-none');
            document.getElementById('createCourseBtn').classList.add('d-none');
            document.getElementById('createExamBtn').classList.remove('d-none');
            if (examSocket) {
                examSocket.send(JSON.stringify({ action: 'request_exams' }));
            }
        } else if (currentView === 'courses') {
            document.querySelector('.courses-section a').classList.add('active');
            document.querySelector('.exams-section a').classList.remove('active');
            document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
            
            document.getElementById('currentView').textContent = 'Cursos Disponibles';
            document.getElementById('coursesList').classList.remove('d-none');
            document.getElementById('examsList').classList.add('d-none');
            document.getElementById('createCourseBtn').classList.remove('d-none');
            document.getElementById('createExamBtn').classList.add('d-none');
            if (courseSocket) {
                courseSocket.send(JSON.stringify({ action: 'request_courses' }));
            }
        }
    }

    // Manejar clics en los enlaces de chat
    document.querySelectorAll('.contacts a').forEach(chatLink => {
        chatLink.addEventListener('click', function() {
            // Remover active de todos los elementos
            document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
            // Añadir active solo al elemento clickeado
            this.classList.add('active');
            // Asegurarse de que los enlaces de cursos y exámenes no estén activos
            document.querySelector('.courses-section a').classList.remove('active');
            document.querySelector('.exams-section a').classList.remove('active');
        });
    });
});