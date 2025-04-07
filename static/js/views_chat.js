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
        const currentView = viewParam || 'courses';
        
        const currentViewElement = document.getElementById('currentView');
        const coursesListElement = document.getElementById('coursesList');
        const examsListElement = document.getElementById('examsList');
        const createCourseBtnElement = document.getElementById('createCourseBtn');
        const createExamBtnElement = document.getElementById('createExamBtn');
        
        function updateView() {
            if (currentView === 'exams') {
                currentViewElement.textContent = 'Exámenes Disponibles';
                coursesListElement.classList.add('d-none');
                examsListElement.classList.remove('d-none');
                createCourseBtnElement.classList.add('d-none');
                createExamBtnElement.classList.remove('d-none');
                
                document.querySelector('.courses-section a').classList.remove('active');
                document.querySelector('.exams-section a').classList.add('active');
                document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
                
                if (examSocket) {
                    examSocket.send(JSON.stringify({ action: 'request_exams' }));
                }
            } else {
                currentViewElement.textContent = 'Todos los Cursos';
                coursesListElement.classList.remove('d-none');
                examsListElement.classList.add('d-none');
                createCourseBtnElement.classList.remove('d-none');
                createExamBtnElement.classList.add('d-none');
                
                document.querySelector('.courses-section a').classList.add('active');
                document.querySelector('.exams-section a').classList.remove('active');
                document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
                
                if (courseSocket) {
                    courseSocket.send(JSON.stringify({ action: 'request_courses' }));
                }
            }
        }

        // Actualizar vista inicial
        updateView();

        // Observar cambios en el título
        const observer = new MutationObserver(() => {
            updateView();
        });

        observer.observe(currentViewElement, { 
            characterData: true,
            childList: true,
            subtree: true 
        });
    }
});