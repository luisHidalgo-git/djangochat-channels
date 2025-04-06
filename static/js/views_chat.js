function showExams(e) {
    e.preventDefault();
    window.location.href = '/chat/Sala/';
    localStorage.setItem('currentView', 'exams');
}

function showCourses(e) {
    e.preventDefault();
    window.location.href = '/chat/Sala/';
    localStorage.setItem('currentView', 'courses');
}

// Verificar la vista actual al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/chat/Sala/') {
        const currentView = localStorage.getItem('currentView');
        if (currentView === 'exams') {
            document.getElementById('currentView').textContent = 'Exámenes Disponibles';
            document.getElementById('coursesList').classList.add('d-none');
            document.getElementById('examsList').classList.remove('d-none');
            document.getElementById('createCourseBtn').classList.add('d-none');
            document.getElementById('createExamBtn').classList.remove('d-none');
            if (examSocket) {
                examSocket.send(JSON.stringify({ action: 'request_exams' }));
            }
        } else {
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
});