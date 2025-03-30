let selectedFiles = new Map(); // Para almacenar los archivos seleccionados temporalmente

function handleFileSelection(assignmentId, fileInput) {
  const file = fileInput.files[0];
  if (file) {
    // Verificar el tipo de archivo
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Por favor, seleccione un archivo válido.');
      fileInput.value = '';
      return;
    }

    // Almacenar el archivo seleccionado
    selectedFiles.set(assignmentId, file);
    
    // Actualizar la etiqueta del archivo
    const label = fileInput.nextElementSibling;
    label.textContent = file.name;
    
    // Mostrar el botón de envío
    const submitButton = document.querySelector(`#submit-assignment-${assignmentId}`);
    submitButton.style.display = 'block';
  }
}

function submitAssignment(assignmentId) {
  const file = selectedFiles.get(assignmentId);
  if (!file) {
    alert('Por favor seleccione un archivo primero.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const fileData = e.target.result;
    courseSocket.send(JSON.stringify({
      action: 'submit_assignment',
      assignmentId: assignmentId,
      student: document.getElementById('user_username').textContent.replace(/"/g, ''),
      file: fileData
    }));
  };
  reader.readAsDataURL(file);
  
  // Limpiar el archivo seleccionado después del envío
  selectedFiles.delete(assignmentId);
  
  // Resetear el input de archivo y ocultar el botón de envío
  const fileInput = document.querySelector(`#submission-${assignmentId}`);
  fileInput.value = '';
  fileInput.nextElementSibling.textContent = 'Elegir archivo';
  document.querySelector(`#submit-assignment-${assignmentId}`).style.display = 'none';
}

function createAssignment(courseId) {
  const title = document.getElementById('assignmentTitle').value;
  const description = document.getElementById('assignmentDescription').value;
  const dueDate = document.getElementById('assignmentDueDate').value;
  const points = document.getElementById('assignmentPoints').value;
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  const assignment = {
    title: title,
    description: description,
    dueDate: dueDate,
    points: points,
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

function gradeSubmission(submissionId, grade, feedback) {
  courseSocket.send(JSON.stringify({
    action: 'grade_submission',
    submissionId: submissionId,
    grade: grade,
    feedback: feedback
  }));
}

function updateSubmissionInUI(assignmentId, submission) {
  const assignmentElement = document.querySelector(`[data-assignment-id="${assignmentId}"]`);
  if (assignmentElement) {
    const submissionsContainer = assignmentElement.querySelector('.submissions-list');
    if (submissionsContainer) {
      const submissionElement = createSubmissionElement(submission);
      submissionsContainer.appendChild(submissionElement);
    }
  }
}

function updateGradingInUI(submissionId, grading) {
  const submissionElement = document.querySelector(`[data-submission-id="${submissionId}"]`);
  if (submissionElement) {
    const gradeElement = submissionElement.querySelector('.grade');
    const feedbackElement = submissionElement.querySelector('.feedback');
    if (gradeElement) gradeElement.textContent = `Grade: ${grading.grade}`;
    if (feedbackElement) feedbackElement.textContent = `Feedback: ${grading.feedback}`;
    
    // Update passing status
    submissionElement.classList.toggle('passing', grading.is_passing);
    submissionElement.classList.toggle('not-passing', !grading.is_passing);

    // Hide file upload section for this assignment
    const assignmentCard = submissionElement.closest('.card');
    if (assignmentCard) {
      const fileUploadSection = assignmentCard.querySelector('.submission-section');
      if (fileUploadSection) {
        fileUploadSection.style.display = 'none';
      }
    }
  }
}

function submitGrade(submissionId, button) {
  const container = button.closest('.grading-section');
  const grade = parseInt(container.querySelector('.grade-input').value);
  const feedback = container.querySelector('.feedback-input').value;

  if (isNaN(grade) || grade < 0 || grade > 100) {
    alert('Por favor ingrese una calificación válida entre 0 y 100');
    return;
  }

  gradeSubmission(submissionId, grade, feedback);
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
            ${sortedAssignments.map(assignment => {
              // Buscar si el usuario actual tiene una entrega calificada
              const userSubmission = assignment.submissions?.find(sub => 
                sub.student.name === currentUser && sub.grade !== null
              );
              
              return `
              <div class="col-md-6 mb-3">
                <div class="card" data-assignment-id="${assignment.id}">
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

                    ${!isCreator && !userSubmission ? `
                      <div class="submission-section mt-3">
                        <h6>Enviar Tarea</h6>
                        <div class="custom-file mb-2">
                          <input type="file" class="custom-file-input" id="submission-${assignment.id}"
                                 accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png"
                                 onchange="handleFileSelection(${assignment.id}, this)">
                          <label class="custom-file-label" for="submission-${assignment.id}">Elegir archivo</label>
                        </div>
                        <button id="submit-assignment-${assignment.id}" 
                                class="btn btn-primary btn-sm" 
                                style="display: none;"
                                onclick="submitAssignment(${assignment.id})">
                          Enviar Tarea
                        </button>
                        <small class="form-text text-muted">
                          Formatos aceptados: Word, Excel, PowerPoint, PDF e imágenes
                        </small>
                      </div>
                    ` : ''}

                    ${assignment.submissions && assignment.submissions.length > 0 ? `
                      <div class="submissions-list mt-3">
                        <h6>Entregas (${assignment.submissions.length})</h6>
                        ${assignment.submissions.map(submission => `
                          <div class="submission-item p-2 border rounded mb-2 ${submission.is_passing ? 'passing' : 'not-passing'}"
                               data-submission-id="${submission.id}">
                            <div class="d-flex align-items-center">
                              <img src="${submission.student.avatar}" alt="${submission.student.name}"
                                   class="rounded-circle mr-2" style="width: 24px; height: 24px;">
                              <div>
                                <strong>${submission.student.name}</strong>
                                <small class="text-muted d-block">
                                  Enviado: ${submission.submitted_at}
                                </small>
                              </div>
                            </div>
                            <div class="mt-2">
                              <p class="mb-1">
                                <i class="fas fa-file"></i> ${submission.file_name}
                                <a href="/download/${submission.id}/" 
                                   class="btn btn-sm btn-outline-primary ml-2" download>
                                  Descargar
                                </a>
                              </p>
                              ${submission.grade !== null ? `
                                <p class="mb-1 grade">Calificación: ${submission.grade}/100 
                                  <span class="badge badge-${submission.is_passing ? 'success' : 'danger'}">
                                    ${submission.is_passing ? 'Aprobado' : 'No Aprobado'}
                                  </span>
                                </p>
                                <p class="mb-1 feedback">Retroalimentación: ${submission.feedback || 'Sin comentarios'}</p>
                              ` : ''}
                              ${isCreator && submission.grade === null ? `
                                <div class="grading-section mt-2">
                                  <div class="form-group">
                                    <input type="number" class="form-control form-control-sm grade-input"
                                           placeholder="Calificación (0-100)" min="0" max="100">
                                  </div>
                                  <div class="form-group">
                                    <textarea class="form-control form-control-sm feedback-input"
                                              placeholder="Retroalimentación"></textarea>
                                  </div>
                                  <button class="btn btn-sm btn-primary" onclick="submitGrade(${submission.id}, this)">
                                    Calificar
                                  </button>
                                </div>
                              ` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
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
            `}).join('')}
          </div>
        ` : '<p>No hay tareas asignadas.</p>'}
      </div>
    </div>
  `;

  // Initialize file input labels
  document.querySelectorAll('.custom-file-input').forEach(input => {
    input.addEventListener('change', function(e) {
      const fileName = e.target.files[0].name;
      const label = e.target.nextElementSibling;
      label.textContent = fileName;
    });
  });
}