// Course management functions with WebSocket support
let sharedCourses = [];
let courseSocket;

// Initialize WebSocket connection for courses
function initializeCourseSocket() {
  const courseSocket = new WebSocket(
    "ws://" + window.location.host + "/ws/courses/"
  );

  courseSocket.onopen = function(e) {
    console.log("Course WebSocket connection established");
    // Request current courses when connection opens
    courseSocket.send(JSON.stringify({
      action: 'request_courses'
    }));
  };

  courseSocket.onclose = function(e) {
    console.log("Course WebSocket connection closed");
    // Attempt to reconnect after a delay
    setTimeout(initializeCourseSocket, 3000);
  };

  courseSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    
    switch(data.action) {
      case 'courses_update':
        sharedCourses = data.courses;
        displayCourses();
        break;
      case 'new_course':
        sharedCourses.push(data.course);
        displayCourses();
        break;
      case 'new_assignment':
        const courseIndex = sharedCourses.findIndex(course => course.id === data.courseId);
        if (courseIndex !== -1) {
          if (!sharedCourses[courseIndex].assignments) {
            sharedCourses[courseIndex].assignments = [];
          }
          sharedCourses[courseIndex].assignments.push(data.assignment);
          if (document.getElementById('currentView').textContent === sharedCourses[courseIndex].name) {
            displayCourseDetails(data.courseId);
          }
        }
        break;
    }
  };

  return courseSocket;
}

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

  courseSocket.send(JSON.stringify({
    action: 'new_course',
    course: course
  }));

  $('#createCourseModal').modal('hide');
  document.getElementById('createCourseForm').reset();
}

function createAssignment(courseId) {
  const title = document.getElementById('assignmentTitle').value;
  const description = document.getElementById('assignmentDescription').value;
  const dueDate = document.getElementById('assignmentDueDate').value;
  const points = document.getElementById('assignmentPoints').value;
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  const assignment = {
    id: Date.now(),
    title: title,
    description: description,
    dueDate: dueDate,
    points: points,
    status: 'active',
    created_at: new Date().toLocaleDateString(),
    creator: {
      name: currentUser,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&size=64&background=random`
    }
  };

  courseSocket.send(JSON.stringify({
    action: 'new_assignment',
    courseId: courseId,
    assignment: assignment
  }));

  $('#createAssignmentModal').modal('hide');
  document.getElementById('createAssignmentForm').reset();
}

function displayCourses() {
  const coursesList = document.getElementById('coursesList');
  const currentView = document.getElementById('currentView');
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  if (currentView) {
    currentView.textContent = 'Todos los Cursos';
  }

  if (sharedCourses.length === 0) {
    coursesList.innerHTML = '<p class="text-center">No hay cursos disponibles.</p>';
    return;
  }

  // Sort courses by creation date (newest first)
  const sortedCourses = [...sharedCourses].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  coursesList.innerHTML = `
    <div class="row">
      ${sortedCourses.map(course => `
        <div class="col-md-4 mb-4">
          <div class="card course-card h-100" onclick="displayCourseDetails(${course.id})">
            <div class="course-header ${course.subject}-header"></div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="card-title">${course.name}</h5>
                  <h6 class="card-subtitle mb-2 text-muted">
                    ${course.subject === 'programming' ? 'Programación' :
                      course.subject === 'math' ? 'Matemáticas' : 'Inglés'}
                  </h6>
                </div>
                ${course.creator.name === currentUser ? 
                  '<span class="badge badge-primary">Creador</span>' : ''}
              </div>
              <p class="card-text">${course.description}</p>
              <p class="card-text">
                <small class="text-muted">Sala: ${course.room}</small>
              </p>
              <p class="card-text">
                <small class="text-muted">
                  Tareas: ${course.assignments ? course.assignments.length : 0}
                </small>
              </p>
            </div>
            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <img src="${course.creator.avatar}" alt="${course.creator.name}" 
                       class="rounded-circle mr-2" style="width: 24px; height: 24px;">
                  <small class="text-muted">
                    ${course.creator.name}
                  </small>
                </div>
                <small class="text-muted">${course.created_at}</small>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function displayCourseDetails(courseId) {
  const course = sharedCourses.find(c => c.id === courseId);
  const coursesList = document.getElementById('coursesList');
  const currentView = document.getElementById('currentView');
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');
  const isCreator = course.creator.name === currentUser;

  if (!course) return;

  if (currentView) {
    currentView.textContent = course.name;
  }

  // Sort assignments by due date (closest first)
  const sortedAssignments = [...(course.assignments || [])].sort((a, b) => {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  coursesList.innerHTML = `
    <div class="course-detail">
      <div class="mb-4">
        <button class="btn btn-secondary mb-3" onclick="displayCourses()">
          <i class="fas fa-arrow-left"></i> Volver a Cursos
        </button>
        ${isCreator ? `
          <button class="btn btn-primary mb-3 ml-2" data-toggle="modal" data-target="#createAssignmentModal" 
                  onclick="prepareAssignmentModal(${courseId})">
            <i class="fas fa-plus"></i> Crear Tarea
          </button>
        ` : ''}
      </div>
      
      <div class="course-info mb-4">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h3>${course.name}</h3>
            <p class="text-muted">
              ${course.subject === 'programming' ? 'Programación' :
                course.subject === 'math' ? 'Matemáticas' : 'Inglés'}
            </p>
          </div>
          ${isCreator ? '<span class="badge badge-primary">Creador del Curso</span>' : ''}
        </div>
        <p>${course.description}</p>
        <p><small class="text-muted">Sala: ${course.room}</small></p>
        <div class="creator-info mt-3">
          <div class="d-flex align-items-center">
            <img src="${course.creator.avatar}" alt="${course.creator.name}" 
                 class="rounded-circle mr-2" style="width: 32px; height: 32px;">
            <div>
              <p class="mb-0"><strong>Creador:</strong> ${course.creator.name}</p>
              <small class="text-muted">Creado el ${course.created_at}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="assignments-section">
        <h4>Tareas (${sortedAssignments.length})</h4>
        ${sortedAssignments.length > 0 ? `
          <div class="row">
            ${sortedAssignments.map(assignment => `
              <div class="col-md-6 mb-3">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <h5 class="card-title">${assignment.title}</h5>
                      ${assignment.creator.name === currentUser ? 
                        '<span class="badge badge-info">Creador</span>' : ''}
                    </div>
                    <p class="card-text">${assignment.description}</p>
                    <div class="assignment-details">
                      <p><strong>Puntos:</strong> ${assignment.points}</p>
                      <p><strong>Fecha de entrega:</strong> ${assignment.dueDate}</p>
                      <p><strong>Estado:</strong> 
                        <span class="badge badge-${assignment.status === 'active' ? 'warning' : 
                                                 assignment.status === 'submitted' ? 'success' : 'danger'}">
                          ${assignment.status === 'active' ? 'Pendiente' :
                            assignment.status === 'submitted' ? 'Entregado' : 'Atrasado'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center">
                        <img src="${assignment.creator.avatar}" alt="${assignment.creator.name}" 
                             class="rounded-circle mr-2" style="width: 24px; height: 24px;">
                        <small class="text-muted">
                          ${assignment.creator.name}
                        </small>
                      </div>
                      <small class="text-muted">${assignment.created_at}</small>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p>No hay tareas asignadas.</p>'}
      </div>
    </div>
  `;
}

function prepareAssignmentModal(courseId) {
  const course = sharedCourses.find(c => c.id === courseId);
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');
  
  if (course.creator.name !== currentUser) {
    alert('Solo el creador del curso puede añadir tareas.');
    return;
  }
  
  const modal = document.getElementById('createAssignmentModal');
  const form = document.getElementById('createAssignmentForm');
  
  modal.setAttribute('data-course-id', courseId);
  if (form) form.reset();
}

// Initialize WebSocket connection and display courses when the page loads
if (window.location.pathname === '/chat/Sala/') {
  courseSocket = initializeCourseSocket();
}