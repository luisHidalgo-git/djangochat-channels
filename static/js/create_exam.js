let examSocket;

function initializeExamSocket() {
  const examSocket = new WebSocket(
    "ws://" + window.location.host + "/ws/exams/"
  );

  examSocket.onopen = function(e) {
    console.log("Exam WebSocket connection established");
    examSocket.send(JSON.stringify({
      action: 'request_exams'
    }));
  };

  examSocket.onclose = function(e) {
    console.log("Exam WebSocket connection closed");
    setTimeout(initializeExamSocket, 3000);
  };

  examSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    
    switch(data.action) {
      case 'exams_update':
        displayExams(data.exams);
        break;
      case 'new_exam':
        displayExams([data.exam]);
        break;
      case 'exam_submitted':
        updateExamSubmission(data.examId, data.submission);
        break;
    }
  };

  return examSocket;
}

function createExam() {
  const title = document.getElementById('examTitle').value;
  const description = document.getElementById('examDescription').value;
  const questionCount = parseInt(document.getElementById('questionCount').value);
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  const questions = [];
  for (let i = 1; i <= questionCount; i++) {
    const questionType = document.getElementById(`questionType${i}`).value;
    const questionText = document.getElementById(`questionText${i}`).value;
    const choiceInputs = document.querySelectorAll(`#questionChoices${i} input[type="text"]`);
    const correctChoices = document.querySelectorAll(`#questionChoices${i} input[type="checkbox"]:checked, #questionChoices${i} input[type="radio"]:checked`);

    const choices = [];
    choiceInputs.forEach((input, index) => {
      choices.push({
        text: input.value,
        is_correct: Array.from(correctChoices).some(checkbox => checkbox.value === index.toString())
      });
    });

    questions.push({
      text: questionText,
      type: questionType,
      choices: choices
    });
  }

  const exam = {
    title: title,
    description: description,
    creator: {
      name: currentUser,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&size=64&background=random`
    },
    questions: questions
  };

  examSocket.send(JSON.stringify({
    action: 'new_exam',
    exam: exam
  }));

  $('#createExamModal').modal('hide');
  document.getElementById('createExamForm').reset();
}

function submitExam(examId) {
  const answers = [];
  const questions = document.querySelectorAll(`[data-exam-id="${examId}"] .question`);
  
  questions.forEach(question => {
    const questionId = question.dataset.questionId;
    const selectedInputs = question.querySelectorAll('input:checked');
    const selectedChoices = Array.from(selectedInputs).map(input => parseInt(input.value));
    
    answers.push({
      questionId: parseInt(questionId),
      selectedChoices: selectedChoices
    });
  });

  examSocket.send(JSON.stringify({
    action: 'submit_exam',
    examId: examId,
    student: document.getElementById('user_username').textContent.replace(/"/g, ''),
    answers: answers
  }));
}

function updateExamSubmission(examId, submission) {
  const examElement = document.querySelector(`[data-exam-id="${examId}"]`);
  if (examElement) {
    const submissionSection = examElement.querySelector('.submission-section');
    if (submissionSection) {
      submissionSection.innerHTML = `
        <div class="alert ${submission.score >= 60 ? 'alert-success' : 'alert-danger'}">
          <h4>Score: ${submission.score}%</h4>
          <p>Submitted: ${submission.submitted_at}</p>
        </div>
      `;

      // Update question feedback
      submission.answers.forEach(answer => {
        const questionElement = examElement.querySelector(`[data-question-id="${answer.question_id}"]`);
        if (questionElement) {
          const feedback = document.createElement('div');
          feedback.className = `alert ${answer.is_correct ? 'alert-success' : 'alert-danger'} mt-2`;
          feedback.textContent = answer.is_correct ? 'Correct!' : 'Incorrect';
          questionElement.appendChild(feedback);
        }
      });
    }
  }
}

function displayExams(exams) {
  const examsList = document.getElementById('examsList');
  const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

  if (!examsList) return;

  if (exams.length === 0) {
    examsList.innerHTML = '<p class="text-center">No hay exámenes disponibles.</p>';
    return;
  }

  examsList.innerHTML = `
    <div class="row">
      ${exams.map(exam => `
        <div class="col-md-6 mb-4">
          <div class="card h-100" data-exam-id="${exam.id}">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">${exam.title}</h5>
              ${exam.creator.name === currentUser ? 
                '<span class="badge badge-primary">Creador</span>' : ''}
            </div>
            <div class="card-body">
              <p class="card-text">${exam.description}</p>
              <p><small class="text-muted">Puntos totales: ${exam.total_points}</small></p>
              
              ${exam.submission ? `
                <div class="submission-section">
                  <div class="alert ${exam.submission.score >= 60 ? 'alert-success' : 'alert-danger'}">
                    <h4>Calificación: ${exam.submission.score}%</h4>
                    <p>Enviado: ${exam.submission.submitted_at}</p>
                  </div>
                </div>
              ` : `
                <form class="exam-form">
                  ${exam.questions.map((question, index) => `
                    <div class="question mb-4" data-question-id="${question.id}">
                      <h6>Pregunta ${index + 1}: ${question.text}</h6>
                      <div class="choices">
                        ${question.choices.map(choice => `
                          <div class="form-check">
                            <input class="form-check-input" type="${question.question_type === 'single' ? 'radio' : 'checkbox'}"
                                   name="question_${question.id}" value="${choice.id}">
                            <label class="form-check-label">${choice.text}</label>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                  <button type="button" class="btn btn-primary" onclick="submitExam(${exam.id})">
                    Enviar Examen
                  </button>
                </form>
              `}
            </div>
            <div class="card-footer">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <img src="${exam.creator.avatar}" alt="${exam.creator.name}" 
                       class="rounded-circle mr-2" style="width: 24px; height: 24px;">
                  <small class="text-muted">${exam.creator.name}</small>
                </div>
                <small class="text-muted">${exam.created_at}</small>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function updateQuestionForm() {
  const count = parseInt(document.getElementById('questionCount').value);
  const container = document.getElementById('questionsContainer');
  
  container.innerHTML = '';
  
  for (let i = 1; i <= count; i++) {
    container.innerHTML += `
      <div class="question-section mb-4">
        <h5>Pregunta ${i}</h5>
        <div class="form-group">
          <label>Tipo de Pregunta</label>
          <select class="form-control" id="questionType${i}" onchange="updateChoiceInputs(${i})">
            <option value="single">Respuesta Única</option>
            <option value="multiple">Respuesta Múltiple</option>
          </select>
        </div>
        <div class="form-group">
          <label>Texto de la Pregunta</label>
          <input type="text" class="form-control" id="questionText${i}" required>
        </div>
        <div id="questionChoices${i}">
          <div class="form-group">
            <label>Opciones</label>
            <div class="choice-inputs">
              <div class="input-group mb-2">
                <div class="input-group-prepend">
                  <div class="input-group-text">
                    <input type="radio" name="correct${i}" value="0">
                  </div>
                </div>
                <input type="text" class="form-control" placeholder="Opción 1" required>
              </div>
              <div class="input-group mb-2">
                <div class="input-group-prepend">
                  <div class="input-group-text">
                    <input type="radio" name="correct${i}" value="1">
                  </div>
                </div>
                <input type="text" class="form-control" placeholder="Opción 2" required>
              </div>
              <div class="input-group mb-2">
                <div class="input-group-prepend">
                  <div class="input-group-text">
                    <input type="radio" name="correct${i}" value="2">
                  </div>
                </div>
                <input type="text" class="form-control" placeholder="Opción 3" required>
              </div>
              <div class="input-group mb-2">
                <div class="input-group-prepend">
                  <div class="input-group-text">
                    <input type="radio" name="correct${i}" value="3">
                  </div>
                </div>
                <input type="text" class="form-control" placeholder="Opción 4" required>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function updateChoiceInputs(questionNum) {
  const type = document.getElementById(`questionType${questionNum}`).value;
  const container = document.getElementById(`questionChoices${questionNum}`);
  const inputs = container.querySelectorAll('.input-group-text input');
  
  inputs.forEach(input => {
    input.type = type === 'single' ? 'radio' : 'checkbox';
    if (type === 'single') {
      input.name = `correct${questionNum}`;
    } else {
      input.name = `correct${questionNum}_${input.value}`;
    }
  });
}

// Initialize WebSocket connection when on the exams page
if (window.location.pathname === '/chat/Sala/') {
  examSocket = initializeExamSocket();
}