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
    const timerDisplay = document.getElementById('examTimer');
    examEndTime = new Date().getTime() + (60 * 60 * 1000); // 1 hora en milisegundos

    examTimer = setInterval(() => {
        const now = new Date().getTime();
        const distance = examEndTime - now;

        if (distance <= 0) {
            clearInterval(examTimer);
            timerDisplay.innerHTML = "TIEMPO TERMINADO";
            autoSubmitExam();
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerDisplay.innerHTML = `Tiempo restante: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
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
                        <h5 class="modal-title">Instrucciones del Examen</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <h6><i class="fas fa-exclamation-triangle"></i> Importante:</h6>
                            <ul>
                                <li>Una vez que inicies el examen, tendrás exactamente 1 hora para completarlo.</li>
                                <li>El examen se enviará automáticamente cuando el tiempo termine.</li>
                                <li>No podrás pausar el temporizador una vez iniciado.</li>
                                <li>Asegúrate de tener una conexión estable a internet.</li>
                            </ul>
                        </div>
                        <p>¿Estás listo para comenzar el examen?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="startExam(${examId})">
                            Comenzar Examen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    const existingModal = document.getElementById('examInstructionsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar el modal
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
        questions: questions,
        total_points: 100
    };

    examSocket.send(JSON.stringify({
        action: 'new_exam',
        exam: exam
    }));

    $('#createExamModal').modal('hide');
    document.getElementById('createExamForm').reset();
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
                ${isCreator ? '<span class="badge badge-primary">Creador</span>' : ''}
            </div>
            <div class="card-body">
                <p class="card-text">${exam.description}</p>
                <p><small class="text-muted">Puntos totales: ${exam.total_points}</small></p>
                
                ${isCreator ? `
                    <div class="submissions-list mt-4">
                        <h5>Entregas de Alumnos</h5>
                        ${exam.submissions && exam.submissions.length > 0 ? `
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
                                                        Ver Respuestas
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-3">
                                <div class="alert alert-info">
                                    <h6 class="mb-2">Resumen de Resultados:</h6>
                                    <p class="mb-1">Total de entregas: ${exam.submissions.length}</p>
                                    <p class="mb-1">Aprobados: ${exam.submissions.filter(s => s.score >= 60).length}</p>
                                    <p class="mb-0">No aprobados: ${exam.submissions.filter(s => s.score < 60).length}</p>
                                </div>
                            </div>
                        ` : '<div class="alert alert-info">Aún no hay entregas para este examen.</div>'}
                    </div>
                ` : exam.submission ? `
                    <div class="submission-section">
                        <div class="alert ${exam.submission.score >= 60 ? 'alert-success' : 'alert-danger'}">
                            <h4>Tu Calificación: ${exam.submission.score}%</h4>
                            <p>Enviado: ${exam.submission.submitted_at}</p>
                        </div>
                        <h5 class="mt-4">Revisión de tus Respuestas:</h5>
                        ${exam.questions.map((question, index) => {
                            const userAnswer = exam.submission.answers.find(a => a.question_id === question.id);
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
    `;

    // Si el usuario no es el creador y no tiene una entrega, mostrar el modal de instrucciones
    if (!isCreator && !exam.submission && startTimer) {
        startExamTimer();
    }
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
        examsList.innerHTML = '<p class="text-center">No hay exámenes disponibles.</p>';
        return;
    }

    // Sort exams by creation date (newest first)
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
                                '<span class="badge badge-primary">Creador</span>' : ''}
                        </div>
                        <div class="card-body">
                            <p class="card-text">${exam.description}</p>
                            <p><small class="text-muted">Puntos totales: ${exam.total_points}</small></p>
                            ${exam.creator.name === currentUser ? `
                                <p><small class="text-muted">Entregas: ${exam.submissions ? exam.submissions.length : 0}</small></p>
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

function submitExam(examId) {
    const exam = sharedExams.find(e => e.id === examId);
    if (!exam) return;

    const answers = [];
    const questions = document.querySelectorAll('.question');
    let allQuestionsAnswered = true;

    questions.forEach(question => {
        const questionId = parseInt(question.dataset.questionId);
        const examQuestion = exam.questions.find(q => q.id === questionId);
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

    // Limpiar el temporizador si existe
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

// Initialize WebSocket connection when on the exams page
if (window.location.pathname === '/chat/Sala/') {
    examSocket = initializeExamSocket();
}