// Course management functions
function createCourse() {
    const name = document.getElementById('courseName').value;
    const subject = document.getElementById('courseSubject').value;
    const description = document.getElementById('courseDescription').value;
    const room = document.getElementById('courseRoom').value;

    const course = {
        id: Date.now(), // Temporary ID
        name: name,
        subject: subject,
        description: description,
        room: room,
        creator: {
            name: document.getElementById('user_username').textContent.replace(/"/g, ''),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(document.getElementById('user_username').textContent.replace(/"/g, ''))}&size=64&background=random`
        },
        created_at: new Date().toLocaleDateString()
    };

    // Store in localStorage (temporary solution)
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    courses.push(course);
    localStorage.setItem('courses', JSON.stringify(courses));

    displayCourses();
    $('#createCourseModal').modal('hide');
    document.getElementById('createCourseForm').reset();
}

function displayCourses() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const coursesList = document.getElementById('coursesList');

    if (courses.length === 0) {
        coursesList.innerHTML = '<p class="text-center">No hay cursos disponibles.</p>';
        return;
    }

    coursesList.innerHTML = `
      <div class="row">
        ${courses.map(course => `
          <div class="col-md-4 mb-4">
            <div class="card course-card h-100">
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

// Display courses when the page loads
if (window.location.pathname === '/chat/Sala/') {
    displayCourses();
}