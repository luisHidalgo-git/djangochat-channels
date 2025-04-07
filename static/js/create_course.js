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
    courseSocket.send(JSON.stringify({
      action: 'request_courses'
    }));
  };

  courseSocket.onclose = function(e) {
    console.log("Course WebSocket connection closed");
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
      case 'new_submission':
        updateSubmissionInUI(data.assignmentId, data.submission);
        break;
      case 'submission_graded':
        updateGradingInUI(data.submissionId, data.grading);
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
    name: name,
    subject: subject,
    description: description,
    room: room,
    creator: {
      name: currentUser,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&size=64&background=random`
    }
  };

  courseSocket.send(JSON.stringify({
    action: 'new_course',
    course: course
  }));

  $('#createCourseModal').modal('hide');
  document.getElementById('createCourseForm').reset();
}

function getPendingAssignmentsCount(course, currentUser) {
  if (!course.assignments) return 0;
  
  // Si el usuario es el creador del curso, no hay tareas pendientes
  if (course.creator.name === currentUser) return 0;
  
  return course.assignments.filter(assignment => {
    // Buscar si el usuario actual tiene una entrega para esta tarea
    const userSubmission = assignment.submissions?.find(sub => sub.student.name === currentUser);
    
    // Es una tarea pendiente si no hay entrega del usuario
    return !userSubmission;
  }).length;
}

function displayCourses() {
  const coursesList = document.getElementById('coursesList');
  const currentView = document.getElementById('currentView');
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  // Siempre establecer el título como "Todos los Cursos" cuando se muestran los cursos
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
      ${sortedCourses.map(course => {
        const pendingCount = getPendingAssignmentsCount(course, currentUser);
        return `
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
              <div class="d-flex justify-content-between align-items-center">
                <p class="card-text mb-0">
                  <small class="text-muted">
                    Tareas: ${course.assignments ? course.assignments.length : 0}
                  </small>
                </p>
                ${course.creator.name !== currentUser && pendingCount > 0 ? `
                  <span class="badge badge-warning">
                    ${pendingCount} tarea${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}
                  </span>
                ` : ''}
              </div>
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
      `}).join('')}
    </div>
  `;
}

// Initialize WebSocket connection and display courses when the page loads
if (window.location.pathname === '/chat/Sala/') {
  courseSocket = initializeCourseSocket();
}