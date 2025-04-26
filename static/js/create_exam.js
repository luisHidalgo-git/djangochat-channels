// Course management functions with WebSocket support
let examSocket;
let sharedExams = [];
let examTimer;
let examEndTime;

function initializeExamSocket() {
    const examSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/exams/"
    );

    examSocket.onopen = function (e) {
        console.log("Exam WebSocket connection established");
        examSocket.send(JSON.stringify({
            action: 'request_exams'
        }));
    };

    examSocket.onclose = function (e) {
        console.log("Exam WebSocket connection closed");
        setTimeout(initializeExamSocket, 3000);
    };

    examSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);

        switch (data.action) {
            case 'exams_update':
                sharedExams = data.exams;
                displayExams();
                break;
            case 'new_exam':
                sharedExams.push(data.exam);
                displayExams();
                break;
            case 'exam_submitted':
                updateExamSubmission(data.examId, data.submission);
                break;
        }
    };

    return examSocket;
}

function startExamTimer() {
    if (examTimer) {
        clearInterval(examTimer);
    }

    examEndTime = new Date().getTime() + (60 * 60 * 1000);

    function updateTimer() {
        const timerDisplay = document.getElementById('examTimer');
        if (!timerDisplay) return;

        const now = new Date().getTime();
        const distance = examEndTime - now;

        if (distance <= 0) {
            clearInterval(examTimer);
            timerDisplay.innerHTML = '<div class="alert alert-danger">TIEMPO TERMINADO</div>';
            autoSubmitExam();
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerDisplay.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-clock mr-2"></i>
                Tiempo restante: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}
            </div>
        `;
    }

    updateTimer();
    examTimer = setInterval(updateTimer, 1000);
}

function autoSubmitExam() {
    const examForm = document.querySelector('.exam-form');
    if (examForm) {
        const submitButton = examForm.querySelector('button[type="button"]');
        if (submitButton) {
            submitButton.click();
        }
    }
}

function showExamInstructions(examId) {
    const modalHtml = `
    <div class="modal fade" id="examInstructionsModal" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" data-translate="examInstructions">Instrucciones del Examen</h5>
            <button type="button" class="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <h6><i class="fas fa-exclamation-triangle"></i> <span data-translate="important">Importante:</span></h6>
              <ul>
                <li data-translate="examTimeLimit">Una vez que inicies el examen, tendrás exactamente 1 hora para completarlo.</li>
                <li data-translate="examAutoSubmit">El examen se enviará automáticamente cuando el tiempo termine.</li>
                <li data-translate="examNoTimer">No podrás pausar el temporizador una vez iniciado.</li>
                <li data-translate="examInternet">Asegúrate de tener una conexión estable a internet.</li>
              </ul>
            </div>
            <p data-translate="examReadyStart">¿Estás listo para comenzar el examen?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" data-translate="cancel">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="startExam(${examId})" data-translate="startExam">
              Comenzar Examen
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    const existingModal = document.getElementById('examInstructionsModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    $('#examInstructionsModal').modal('show');
}

function startExam(examId) {
    $('#examInstructionsModal').modal('hide');
    displayExamDetails(examId, true);
    startExamTimer();
}

function createExam() {
    const title = document.getElementById('examTitle').value;
    const description = document.getElementById('examDescription').value;
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const questionsToAnswer = parseInt(document.getElementById('questionsToAnswer').value);
    const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');

    if (questionsToAnswer > questionCount) {
        alert('El número de preguntas a responder no puede ser mayor que el total de preguntas.');
        return;
    }

    const questions = [];
    for (let i = 1; i <= questionCount; i++) {
        const questionType = document.getElementById(`questionType${i}`).value;
        const questionText = document.getElementById(`questionText${i}`).value;

        let choices = [];
        if (questionType === 'true_false') {
            choices = [
                { text: 'Verdadero', is_correct: document.querySelector(`input[name="correct${i}"][value="true"]`).checked },
                { text: 'Falso', is_correct: document.querySelector(`input[name="correct${i}"][value="false"]`).checked }
            ];
        } else {
            const choiceInputs = document.querySelectorAll(`#questionChoices${i} input[type="text"]`);
            const correctChoices = document.querySelectorAll(`#questionChoices${i} input[type="checkbox"]:checked, #questionChoices${i} input[type="radio"]:checked`);

            choiceInputs.forEach((input, index) => {
                if (input.value.trim() !== '') {
                    choices.push({
                        text: input.value,
                        is_correct: Array.from(correctChoices).some(checkbox => checkbox.value === index.toString())
                    });
                }
            });
        }

        questions.push({
            text: questionText,
            type: questionType === 'true_false' ? 'single' : questionType,
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
        questions: questions,
        total_points: 100,
        questions_to_answer: questionsToAnswer
    };

    examSocket.send(JSON.stringify({
        action: 'new_exam',
        exam: exam
    }));

    $('#createExamModal').modal('hide');
    document.getElementById('createExamForm').reset();
}

function addChoice(questionNum) {
    const choicesContainer = document.querySelector(`#questionChoices${questionNum} .choice-inputs`);
    const choiceCount = choicesContainer.children.length;
    const newChoice = document.createElement('div');
    newChoice.className = 'input-group mb-2';

    const questionType = document.getElementById(`questionType${questionNum}`).value;
    const inputType = questionType === 'single' ? 'radio' : 'checkbox';

    newChoice.innerHTML = `
        <div class="input-group-prepend">
            <div class="input-group-text">
                <input type="${inputType}" name="correct${questionNum}" value="${choiceCount}">
            </div>
        </div>
        <input type="text" class="form-control" placeholder="Opción ${choiceCount + 1}" required>
        <div class="input-group-append">
            <button class="btn btn-danger" type="button" onclick="removeChoice(this)">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `;

    choicesContainer.appendChild(newChoice);
}

function removeChoice(button) {
    const choiceElement = button.closest('.input-group');
    const choicesContainer = choiceElement.parentElement;

    if (choicesContainer.children.length > 2) {
        choiceElement.remove();

        const choices = choicesContainer.children;
        Array.from(choices).forEach((choice, index) => {
            const input = choice.querySelector('input[type="radio"], input[type="checkbox"]');
            input.value = index.toString();
            choice.querySelector('input[type="text"]').placeholder = `Opción ${index + 1}`;
        });
    }
}

function updateQuestionForm() {
    const count = parseInt(document.getElementById('questionCount').value);
    const container = document.getElementById('questionsContainer');
    const questionsToAnswerInput = document.getElementById('questionsToAnswer');
    
    // Actualizar el máximo de preguntas a responder
    questionsToAnswerInput.max = count;
    if (parseInt(questionsToAnswerInput.value) > count) {
        questionsToAnswerInput.value = count;
    }

    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="question-section mb-4">
                <h5 data-translate="question">Pregunta ${i}</h5>
                <div class="form-group">
                    <label data-translate="questionType">Tipo de Pregunta</label>
                    <select class="form-control" id="questionType${i}" onchange="updateChoiceInputs(${i})">
                        <option value="single" data-translate="singleAnswer">Respuesta Única</option>
                        <option value="multiple" data-translate="multipleAnswer">Respuesta Múltiple</option>
                        <option value="true_false" data-translate="trueOrFalse">Verdadero/Falso</option>
                    </select>
                </div>
                <div class="form-group">
                    <label data-translate="questionText">Texto de la Pregunta</label>
                    <input type="text" class="form-control" id="questionText${i}" required>
                </div>
                <div id="questionChoices${i}">
                    <div class="form-group">
                        <label data-translate="options">Opciones</label>
                        <div class="choice-inputs">
                            <div class="input-group mb-2">
                                <div class="input-group-prepend">
                                    <div class="input-group-text">
                                        <input type="radio" name="correct${i}" value="0">
                                    </div>
                                </div>
                                <input type="text" class="form-control" data-translate="option" placeholder="Opción 1" required>
                                <div class="input-group-append">
                                    <button class="btn btn-danger" type="button" onclick="removeChoice(this)">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="input-group mb-2">
                                <div class="input-group-prepend">
                                    <div class="input-group-text">
                                        <input type="radio" name="correct${i}" value="1">
                                    </div>
                                </div>
                                <input type="text" class="form-control" data-translate="option" placeholder="Opción 2" required>
                                <div class="input-group-append">
                                    <button class="btn btn-danger" type="button" onclick="removeChoice(this)">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-success btn-sm mt-2" onclick="addChoice(${i})" data-translate="addNewOption">
                            <i class="fas fa-plus"></i> Añadir Opción
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

function updateChoiceInputs(questionNum) {
    const type = document.getElementById(`questionType${questionNum}`).value;
    const container = document.getElementById(`questionChoices${questionNum}`);

    if (type === 'true_false') {
        container.innerHTML = `
            <div class="form-group">
                <label data-translate="selectCorrectAnswer">Seleccione la respuesta correcta:</label>
                <div class="custom-control custom-radio mb-2">
                    <input type="radio" id="true${questionNum}" name="correct${questionNum}" value="true" class="custom-control-input" required>
                    <label class="custom-control-label" for="true${questionNum}" data-translate="true">Verdadero</label>
                </div>
                <div class="custom-control custom-radio">
                    <input type="radio" id="false${questionNum}" name="correct${questionNum}" value="false" class="custom-control-input" required>
                    <label class="custom-control-label" for="false${questionNum}" data-translate="false">Falso</label>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="form-group">
                <label data-translate="options">Opciones</label>
                <div class="choice-inputs">
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text">
                                <input type="${type === 'single' ? 'radio' : 'checkbox'}" name="correct${questionNum}" value="0">
                            </div>
                        </div>
                        <input type="text" class="form-control" data-translate="option" placeholder="Opción 1" required>
                        <div class="input-group-append">
                            <button class="btn btn-danger" type="button" onclick="removeChoice(this)" data-translate="removeOption">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="input-group mb-2">
                        <div class="input-group-prepend">
                            <div class="input-group-text">
                                <input type="${type === 'single' ? 'radio' : 'checkbox'}" name="correct${questionNum}" value="1">
                            </div>
                        </div>
                        <input type="text" class="form-control" data-translate="option" placeholder="Opción 2" required>
                        <div class="input-group-append">
                            <button class="btn btn-danger" type="button" onclick="removeChoice(this)" data-translate="removeOption">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn-success btn-sm mt-2" onclick="addChoice(${questionNum})" data-translate="addNewOption">
                    <i class="fas fa-plus"></i> Añadir Opción
                </button>
            </div>
        `;
    }
}

function submitExam(examId) {
    const exam = sharedExams.find(e => e.id === examId);
    if (!exam) return;

    const answers = [];
    const questions = document.querySelectorAll('.question');
    let allQuestionsAnswered = true;

    questions.forEach(question => {
        const questionId = parseInt(question.dataset.questionId);
        const selectedInputs = question.querySelectorAll('input:checked');
        if (selectedInputs.length === 0) {
            allQuestionsAnswered = false;
        }
        const selectedChoices = Array.from(selectedInputs).map(input => parseInt(input.value));
        answers.push({
            questionId: questionId,
            selectedChoices: selectedChoices
        });
    });

    if (!allQuestionsAnswered) {
        alert('Por favor responde todas las preguntas antes de enviar el examen.');
        return;
    }

    if (examTimer) {
        clearInterval(examTimer);
    }

    examSocket.send(JSON.stringify({
        action: 'submit_exam',
        examId: examId,
        student: document.getElementById('user_username').textContent.replace(/"/g, ''),
        answers: answers
    }));
}

function updateSubmissionInUI(examId, submission) {
    const exam = sharedExams.find(e => e.id === examId);
    if (!exam) return;

    if (!exam.submissions) {
        exam.submissions = [];
    }

    const existingSubmissionIndex = exam.submissions.findIndex(s => s.id === submission.id);
    if (existingSubmissionIndex !== -1) {
        exam.submissions[existingSubmissionIndex] = submission;
    } else {
        exam.submissions.push(submission);
    }

    displayExamDetails(examId);
}

function showSubmissionDetails(examId, studentName) {
    const exam = sharedExams.find(e => e.id === examId);
    const submission = exam.submissions.find(s => s.student.name === studentName);

    const modalHtml = `
        <div class="modal fade" id="submissionDetailsModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Respuestas de ${studentName}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert ${submission.score >= 60 ? 'alert-success' : 'alert-danger'}">
                            <h4>Calificación Final: ${submission.score}%</h4>
                            <p>Fecha de entrega: ${submission.submitted_at}</p>
                        </div>
                        
                        ${exam.questions.map((question, index) => {
                            const answer = submission.answers.find(a => a.question_id === question.id);
                            if (!answer) return ''; // Skip questions that weren't assigned to this student
                            return `
                                <div class="question-review mb-4">
                                    <h6>Pregunta ${index + 1}: ${question.text}</h6>
                                    <div class="choices">
                                        ${question.choices.map(choice => `
                                            <div class="form-check">
                                                <input class="form-check-input" type="${question.question_type === 'single' ? 'radio' : 'checkbox'}"
                                                       ${answer.selected_choices.includes(choice.id) ? 'checked' : ''} disabled>
                                                <label class="form-check-label ${choice.is_correct ? 'text-success font-weight-bold' : ''}">
                                                    ${choice.text}
                                                    ${choice.is_correct ? '<i class="fas fa-check text-success ml-2"></i>' : ''}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="alert ${answer.is_correct ? 'alert-success' : 'alert-danger'} mt-2">
                                        ${answer.is_correct ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('submissionDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    $('#submissionDetailsModal').modal('show');
}

function displayExams() {
    const examsList = document.getElementById('examsList');
    const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');
    const currentView = document.getElementById('currentView');

    if (currentView) {
        currentView.textContent = 'Exámenes Disponibles';
    }

    if (!examsList) return;

    if (sharedExams.length === 0) {
        examsList.innerHTML = '<p class="text-center empty-message">No hay exámenes disponibles.</p>';
        return;
    }

    const sortedExams = [...sharedExams].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    examsList.innerHTML = `
        <div class="row">
            ${sortedExams.map(exam => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100" style="cursor: pointer;" onclick="${exam.creator.name !== currentUser && !exam.submission ? `showExamInstructions(${exam.id})` : `displayExamDetails(${exam.id})`}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${exam.title}</h5>
                            ${exam.creator.name === currentUser ?
                                '<span class="badge badge-primary" data-translate="creator">Creador</span>' : ''}
                        </div>
                        <div class="card-body">
                            <p class="card-text">${exam.description}</p>
                            <p><small class="text-muted">
                                <span data-translate="totalScore">Puntos totales:</span> 
                                <span>${exam.total_points}</span>
                            </small></p>
                            <p><small class="text-muted">
                                <span data-translate="questionsToAnswer">Preguntas a responder:</span> 
                                <span>${exam.questions_to_answer} de ${exam.questions.length}</span>
                            </small></p>
                            ${exam.creator.name === currentUser ? `
                                <p><small class="text-muted">
                                    <span data-translate="examSubmissions">Entregas:</span>
                                    <span>${exam.submissions ? exam.submissions.length : 0}</span>
                                </small></p>
                                ${exam.submissions && exam.submissions.length > 0 ? `
                                    <div class="mt-2">
                                        <small class="text-muted">
                                            Aprobados: ${exam.submissions.filter(s => s.score >= 60).length} |
                                            Reprobados: ${exam.submissions.filter(s => s.score < 60).length}
                                        </small>
                                    </div>
                                ` : ''}
                            ` : exam.submission ? `
                                <div class="alert ${exam.submission.score >= 60 ? 'alert-success' : 'alert-danger'} mb-0">
                                    <strong>Tu Calificación: ${exam.submission.score}%</strong>
                                </div>
                            ` : `
                                <div class="alert alert-warning mb-0">
                                    <strong>Examen pendiente por realizar</strong>
                                </div>
                            `}
                        </div>
                        <div class="card-footer">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <img src="/media/profile_photos/${exam.creator.name}.jpg" 
                                         onerror="this.onerror=null; this.src='${exam.creator.avatar}'"
                                         alt="${exam.creator.name}" 
                                         class="rounded-circle mr-2" 
                                         style="width: 24px; height: 24px; object-fit: cover;">
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

function displayExamDetails(examId, startTimer = false) {
    const exam = sharedExams.find(e => e.id === examId);
    const examsList = document.getElementById('examsList');
    const currentUser = document.getElementById('user_username').textContent.replace(/"/g, '');
    const currentView = document.getElementById('currentView');
    const isCreator = exam.creator.name === currentUser;

    if (!exam) return;

    if (currentView) {
        currentView.textContent = exam.title;
    }

    // Si el usuario no es el creador y no ha enviado el examen, obtener preguntas aleatorias
    let questionsToShow = exam.questions;
    if (!isCreator && !exam.submission) {
        const allQuestions = [...exam.questions];
        questionsToShow = [];
        const numQuestions = exam.questions_to_answer;
        
        // Seleccionar preguntas aleatorias
        for (let i = 0; i < numQuestions; i++) {
            const randomIndex = Math.floor(Math.random() * allQuestions.length);
            questionsToShow.push(allQuestions[randomIndex]);
            allQuestions.splice(randomIndex, 1);
        }
    }

    examsList.innerHTML = `
        <div class="mb-4">
            <button class="btn btn-secondary" onclick="displayExams()">
                <i class="fas fa-arrow-left"></i> Volver a Exámenes
            </button>
        </div>

        ${!isCreator ? `
            <div id="examTimer" class="alert alert-info text-center mb-4" style="font-size: 1.2rem; font-weight: bold;">
                ${startTimer ? 'Iniciando examen...' : ''}
            </div>
        ` : ''}

        <div class="card" data-exam-id="${exam.id}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">${exam.title}</h5>
                ${isCreator ? '<span class="badge badge-primary" data-translate="creator">Creador</span>' : ''}
            </div>
            <div class="card-body">
                <p class="card-text">${exam.description}</p>
                <p><small class="text-muted">
                    <span data-translate="totalScore">Puntos totales:</span> 
                    <span>${exam.total_points}</span>
                </small>
                </p>
                
                ${isCreator ? `
                    <div class="submissions-list mt-4">
                        <h5 data-translate="examSubmissions">Entregas de Alumnos</h5>
                        ${exam.submissions && exam.submissions.length > 0 ? `
                            <div class="exam-stats mb-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="mb-3">
                                            <i class="fas fa-chart-bar text-primary mr-2"></i>
                                            Estadísticas del Examen
                                        </h6>
                                        <div class="row">
                                            <div class="col-md-3">
                                                <div class="text-center">
                                                    <i class="fas fa-users text-info mb-2" style="font-size: 24px;"></i>
                                                    <h4>${exam.submissions.length}</h4>
                                                    <small class="text-muted">Total de Entregas</small>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="text-center">
                                                    <i class="fas fa-check-circle text-success mb-2" style="font-size: 24px;"></i>
                                                    <h4>${exam.submissions.filter(s => s.score >= 60).length}</h4>
                                                    <small class="text-muted">Aprobados</small>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="text-center">
                                                    <i class="fas fa-times-circle text-danger mb-2" style="font-size: 24px;"></i>
                                                    <h4>${exam.submissions.filter(s => s.score < 60).length}</h4>
                                                    <small class="text-muted">Reprobados</small>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="text-center">
                                                    <i class="fas fa-chart-line text-primary mb-2" style="font-size: 24px;"></i>
                                                    <h4>${Math.round(exam.submissions.reduce((acc, s) => acc + s.score, 0) / exam.submissions.length)}%</h4>
                                                    <small class="text-muted">Promedio General</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="progress mt-4" style="height: 25px;">
                                            <div class="progress-bar bg-success" role="progressbar" 
                                                style="width: ${(exam.submissions.filter(s => s.score >= 60).length / exam.submissions.length) * 100}%">
                                                Aprobados
                                            </div>
                                            <div class="progress-bar bg-danger" role="progressbar" 
                                                style="width: ${(exam.submissions.filter(s => s.score < 60).length / exam.submissions.length) * 100}%">
                                                Reprobados
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                            </div>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="thead-light">
                                        <tr>
                                            <th>Alumno</th>
                                            <th>Fecha de Entrega</th>
                                            <th>Calificación</th>
                                            <th>Estado</th>
                                            <th>Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${exam.submissions.map(submission => `
                                            <tr>
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <img src="${submission.student.avatar}" alt="${submission.student.name}"
                                                             class="rounded-circle mr-2" style="width: 32px; height: 32px;">
                                                        <span>${submission.student.name}</span>
                                                    </div>
                                                </td>
                                                <td>${submission.submitted_at}</td>
                                                <td>
                                                    <span class="badge badge-${submission.score >= 60 ? 'success' : 'danger'} p-2">
                                                        ${submission.score}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="badge badge-${submission.score >= 60 ? 'success' : 'danger'}">
                                                        ${submission.score >= 60 ? 'Aprobado' : 'No Aprobado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-info" onclick="showSubmissionDetails(${exam.id}, '${submission.student.name}')">
                                                        <i class="fas fa-eye mr-1"></i>
                                                        Ver Respuestas
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<div class="alert alert-info" data-translate="noExams">Aún no hay entregas para este examen.</div>'}
                    </div>
                ` : exam.submission ? `
                    <div class="submission-section">
                        <div class="alert ${exam.submission.score >= 60 ? 'alert-success' : 'alert-danger'}">
                            <h4>Tu Calificación: ${exam.submission.score}%</h4>
                            <p>Enviado: ${exam.submission.submitted_at}</p>
                        </div>
                        <h5 class="mt-4">Revisión de tus Respuestas:</h5>
                        ${questionsToShow.map((question, index) => {
                            const userAnswer = exam.submission.answers.find(a => a.question_id === question.id);
                            if (!userAnswer) return ''; // Skip questions that weren't assigned to this student
                            return `
                                <div class="question mb-4" data-question-id="${question.id}">
                                    <h6>Pregunta ${index + 1}: ${question.text}</h6>
                                    <div class="choices">
                                        ${question.choices.map(choice => `
                                            <div class="form-check">
                                                <input class="form-check-input" type="${question.question_type === 'single' ? 'radio' : 'checkbox'}"
                                                       ${userAnswer?.selected_choices.includes(choice.id) ? 'checked' : ''} disabled>
                                                <label class="form-check-label">
                                                    ${choice.text}
                                                    ${choice.is_correct ? '<i class="fas fa-check text-success ml-2"></i>' : ''}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="alert ${userAnswer?.is_correct ? 'alert-success' : 'alert-danger'} mt-2">
                                        ${userAnswer?.is_correct ? '¡Correcto!' : 'Incorrecto'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <form class="exam-form">
                        ${questionsToShow.map((question, index) => `
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
    `;
}

// Initialize WebSocket connection when on the exams page
if (window.location.pathname === '/chat/Sala/') {
    examSocket = initializeExamSocket();
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#assignmentSupportFile').addEventListener('change', function (e) {
        const fileName = e.target.files[0]?.name || 'Elegir archivo';
        e.target.nextElementSibling.textContent = fileName;
    });
});