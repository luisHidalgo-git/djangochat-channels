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
        
        // Si no hay vista especificada en la URL, siempre mostrar cursos
        const currentView = viewParam === 'exams' ? 'exams' : 'courses';
        localStorage.setItem('currentView', currentView);
        
        const currentViewElement = document.getElementById('currentView');
        const coursesListElement = document.getElementById('coursesList');
        const examsListElement = document.getElementById('examsList');
        const createCourseBtnElement = document.getElementById('createCourseBtn');
        const createExamBtnElement = document.getElementById('createExamBtn');
        
        // Ensure the correct title and visibility are set immediately
        if (currentView === 'exams') {
            // Exam view settings
            if (currentViewElement) currentViewElement.textContent = 'Exámenes Disponibles';
            if (coursesListElement) coursesListElement.classList.add('d-none');
            if (examsListElement) examsListElement.classList.remove('d-none');
            if (createCourseBtnElement) createCourseBtnElement.classList.add('d-none');
            if (createExamBtnElement) createExamBtnElement.classList.remove('d-none');
            
            document.querySelector('.courses-section a').classList.remove('active');
            document.querySelector('.exams-section a').classList.add('active');
            document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
            
            if (examSocket) {
                examSocket.send(JSON.stringify({ action: 'request_exams' }));
            }
        } else {
            // Course view settings - default view
            if (currentViewElement) currentViewElement.textContent = 'Todos los Cursos';
            if (coursesListElement) coursesListElement.classList.remove('d-none');
            if (examsListElement) examsListElement.classList.add('d-none');
            if (createCourseBtnElement) createCourseBtnElement.classList.remove('d-none');
            if (createExamBtnElement) createExamBtnElement.classList.add('d-none');
            
            document.querySelector('.courses-section a').classList.add('active');
            document.querySelector('.exams-section a').classList.remove('active');
            document.querySelectorAll('.contacts a').forEach(a => a.classList.remove('active'));
            
            if (courseSocket) {
                courseSocket.send(JSON.stringify({ action: 'request_courses' }));
            }
        }
    }
});