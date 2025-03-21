// Course and Assignment management functions
function createCourse() {
  const name = document.getElementById('courseName').value;
  const subject = document.getElementById('courseSubject').value;
  const description = document.getElementById('courseDescription').value;
  const room = document.getElementById('courseRoom').value;
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  const course = {
      id: Date.now(),
      name: name,
      subject: subject,
      description: description,
      room: room,
      creator: {
          name: currentUser,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&size=64&background=random`
      },
      created_at: new Date().toLocaleDateString(),
      assignments: []
  };

  const courses = JSON.parse(localStorage.getItem('courses') || '[]');
  courses.push(course);
  localStorage.setItem('courses', JSON.stringify(courses));

  displayCourses();
  $('#createCourseModal').modal('hide');
  document.getElementById('createCourseForm').reset();
}

function createAssignment(courseId) {
  const title = document.getElementById('assignmentTitle').value;
  const description = document.getElementById('assignmentDescription').value;
  const dueDate = document.getElementById('assignmentDueDate').value;
  const points = document.getElementById('assignmentPoints').value;

  const assignment = {
      id: Date.now(),
      title: title,
      description: description,
      dueDate: dueDate,
      points: points,
      status: 'active',
      submissions: []
  };

  const courses = JSON.parse(localStorage.getItem('courses') || '[]');
  const courseIndex = courses.findIndex(c => c.id === courseId);
  
  if (courseIndex !== -1) {
      if (!courses[courseIndex].assignments) {
          courses[courseIndex].assignments = [];
      }
      courses[courseIndex].assignments.push(assignment);
      localStorage.setItem('courses', JSON.stringify(courses));
  }

  displayCourseDetails(courseId);
  $('#createAssignmentModal').modal('hide');
  document.getElementById('createAssignmentForm').reset();
}

function displayCourses() {
  const courses = JSON.parse(localStorage.getItem('courses') || '[]');
  const coursesList = document.getElementById('coursesList');
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  if (courses.length === 0) {
      coursesList.innerHTML = '<p class="text-center">No hay cursos disponibles.</p>';
      return;
  }

  coursesList.innerHTML = `
    <div class="row">
      ${courses.map(course => `
        <div class="col-md-4 mb-4">
          <div class="card course-card h-100" onclick="displayCourseDetails(${course.id})">
            <div class="course-header ${course.subject}-header"></div>
            <div class="card-body">
              <h5 class="card-title">${course.name}</h5>
              <h6 class="card-subtitle mb-2 text-muted">
                ${course.subject === 'programming' ? 'Programación' :
                  course.subject === 'math' ? 'Matemáticas' : 'Inglés'}
              </h6>
              <p class="card-text">${course.description}</p>
              <p class="card-text"><small class="text-muted">Sala: ${course.room}</small></p>
            </div>
            <div class="card-footer bg-transparent">
              <div class="d-flex align-items-center">
                <img src="${course.creator.avatar}" alt="${course.creator.name}" 
                     class="rounded-circle mr-2" style="width: 24px; height: 24px;">
                <small class="text-muted">
                  ${course.creator.name} • ${course.created_at}
                </small>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function displayCourseDetails(courseId) {
  const courses = JSON.parse(localStorage.getItem('courses') || '[]');
  const course = courses.find(c => c.id === courseId);
  const coursesList = document.getElementById('coursesList');
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');
  const isCreator = course.creator.name === currentUser;

  if (!course) return;

  coursesList.innerHTML = `
      <div class="course-detail">
          <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                  <button class="btn btn-link p-0 mb-2" onclick="displayCourses()">
                      <i class="fas fa-arrow-left"></i> Volver a Cursos
                  </button>
                  <h2>${course.name}</h2>
              </div>
              ${isCreator ? `
                <button class="btn btn-primary" data-toggle="modal" data-target="#createAssignmentModal" 
                        onclick="setCurrentCourse(${courseId})">
                    <i class="fas fa-plus mr-2"></i>Crear Tarea
                </button>
              ` : ''}
          </div>

          <div class="assignments-list">
              ${course.assignments && course.assignments.length > 0 ? 
                  course.assignments.map(assignment => `
                      <div class="card mb-3">
                          <div class="card-body">
                              <div class="d-flex justify-content-between align-items-start">
                                  <div>
                                      <h5 class="card-title">
                                          <i class="fas fa-clipboard-list mr-2"></i>
                                          ${assignment.title}
                                      </h5>
                                      <p class="card-text">${assignment.description}</p>
                                      <div class="text-muted">
                                          <small>
                                              <i class="far fa-calendar mr-1"></i>
                                              Fecha de entrega: ${new Date(assignment.dueDate).toLocaleDateString()}
                                          </small>
                                          <small class="ml-3">
                                              <i class="fas fa-star mr-1"></i>
                                              ${assignment.points} puntos
                                          </small>
                                      </div>
                                  </div>
                                  <span class="badge badge-${getStatusBadgeClass(assignment.status)}">
                                      ${getStatusText(assignment.status)}
                                  </span>
                              </div>
                          </div>
                      </div>
                  `).join('') : 
                  '<p class="text-center">No hay tareas asignadas en este curso.</p>'
              }
          </div>
      </div>
  `;
}

function setCurrentCourse(courseId) {
  const courses = JSON.parse(localStorage.getItem('courses') || '[]');
  const course = courses.find(c => c.id === courseId);
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  if (course.creator.name !== currentUser) {
    alert('Solo el creador del curso puede añadir tareas.');
    return;
  }

  document.getElementById('createAssignmentForm').dataset.courseId = courseId;
}

function getStatusBadgeClass(status) {
  switch (status) {
      case 'active': return 'primary';
      case 'submitted': return 'success';
      case 'late': return 'warning';
      default: return 'secondary';
  }
}

function getStatusText(status) {
  switch (status) {
      case 'active': return 'Pendiente';
      case 'submitted': return 'Entregado';
      case 'late': return 'Atrasado';
      default: return 'Sin estado';
  }
}

// Initialize courses display when the page loads
if (window.location.pathname === '/chat/Sala/') {
  displayCourses();
}

// Handle assignment creation
document.addEventListener('DOMContentLoaded', function() {
  const assignmentForm = document.getElementById('createAssignmentForm');
  if (assignmentForm) {
      assignmentForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const courseId = parseInt(this.dataset.courseId);
          
          // Check if user is the course creator
          const courses = JSON.parse(localStorage.getItem('courses') || '[]');
          const course = courses.find(c => c.id === courseId);
          const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');
          
          if (course && course.creator.name === currentUser) {
              createAssignment(courseId);
          } else {
              alert('Solo el creador del curso puede añadir tareas.');
          }
      });
  }
});