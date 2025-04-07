function showLoading() {
    document.querySelector('.loading-overlay').classList.add('show');
}

function hideLoading() {
    document.querySelector('.loading-overlay').classList.remove('show');
}

// Interceptar cambios de sección
document.addEventListener('DOMContentLoaded', function() {
    // Para los enlaces de la barra lateral
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.getAttribute('href').includes('#')) {
                showLoading();
            }
        });
    });

    // Para los botones de volver
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-secondary') && e.target.textContent.includes('Volver')) {
            showLoading();
        }
    });
});

// Ocultar el loader cuando la página ha cargado completamente
window.addEventListener('load', hideLoading);

// Interceptar la navegación del navegador
window.addEventListener('beforeunload', showLoading);

// Para las funciones de cambio de vista
const originalDisplayCourses = displayCourses;
displayCourses = function() {
    showLoading();
    setTimeout(() => {
        originalDisplayCourses();
        hideLoading();
    }, 300);
};

const originalDisplayExams = displayExams;
displayExams = function() {
    showLoading();
    setTimeout(() => {
        originalDisplayExams();
        hideLoading();
    }, 300);
};

const originalDisplayCourseDetails = displayCourseDetails;
displayCourseDetails = function(courseId) {
    showLoading();
    setTimeout(() => {
        originalDisplayCourseDetails(courseId);
        hideLoading();
    }, 300);
};

const originalDisplayExamDetails = displayExamDetails;
displayExamDetails = function(examId, startTimer) {
    showLoading();
    setTimeout(() => {
        originalDisplayExamDetails(examId, startTimer);
        hideLoading();
    }, 300);
};