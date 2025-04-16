// Language switching functionality
function toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'en';
    const newLang = currentLang === 'en' ? 'es' : 'en';
    
    localStorage.setItem('language', newLang);
    updateLanguageIcon();
    translatePage(newLang);
}

function updateLanguageIcon() {
    const langIcons = document.querySelectorAll('.language-toggle i');
    const langTexts = document.querySelectorAll('.language-toggle span');
    const currentLang = localStorage.getItem('language') || 'en';
    
    langIcons.forEach(icon => {
        icon.classList.toggle('fa-language');
        icon.classList.toggle('fa-globe');
    });

    langTexts.forEach(text => {
        text.textContent = currentLang.toUpperCase();
    });
}

function translatePage(lang) {
    const translations = {
        en: {
            // Header & Navigation
            schoolMoodle: "School Moodle",
            home: "Home",
            login: "Login",
            signup: "Signup",
            logout: "Logout",

            // Index Page
            aboutApp: "About the Application",
            technologies: "Technologies",
            howToUse: "How to Use",
            realTimeMsg: "Real-time messaging with delivery confirmation",
            userPresence: "User presence status (Online/Offline)",
            advancedSearch: "Advanced message search and filters",
            secureAuth: "Secure authentication system",
            academicSystem: "Academic system for students and teachers",
            examSystem: "Evaluation exam system",
            backendTech: "Django for backend",
            jwtAuth: "JWT Authentication",
            responsiveDesign: "Bootstrap for responsive design",
            database: "PostgreSQL Database",
            staticFiles: "Static files for frontend",
            cloneRepo: "Clone GitHub repository",
            activateEnv: "Activate virtual environment",
            installDep: "Install required dependencies",
            runServer: "Run development server",

            // Login Page
            username: "Username",
            emailLabel: "Email",
            passwordLabel: "Password",
            confirmPassword: "Confirm Password",
            enterEmail: "Enter your email",
            enterPassword: "Enter your password",
            reenterPassword: "Re-enter your password",
            forgotPassword: "Forgot Password?",
            noAccount: "Don't have an account? Register",
            hasAccount: "Already have an account? Login",
            loginBtn: "Login",
            signupBtn: "Sign Up",
            verifyNotRobot: "Please verify that you are not a robot",

            // Chat Interface
            courses: "Available Courses",
            exams: "Available Exams",
            chats: "Chats",
            searchUsers: "Search users...",
            createAssignment: "Create Assignment",
            createCourse: "Create Course",
            createExam: "Create Exam",
            noMessages: "No Messages",
            typeMessage: "Type a message...",
            send: "Send",
            backToCourses: "Back to Courses",
            backToExams: "Back to Exams",

            // Course Management
            assignmentTitle: "Assignment Title",
            courseName: "Course Name",
            subject: "Subject",
            description: "Description",
            room: "Room",
            programming: "Programming",
            mathematics: "Mathematics",
            english: "English",
            creator: "Creator",
            createdAt: "Created at",
            assignments: "Assignments",
            noAssignments: "No assignments yet",
            dueDate: "Due Date",
            points: "Points",
            status: "Status",
            pending: "Pending",
            submitted: "Submitted",
            late: "Late",
            supportMaterial: "Support Material",
            submit: "Submit",
            download: "Download",
            chooseFile: "Choose file",
            acceptedFormats: "Accepted formats: Word, Excel, PowerPoint, PDF and images",
            creatorOfCourse: "Course Creator",
            sendHomework: "Send Homework",
            acceptedFiles: "Accepted file formats: Word, Excel, PowerPoint, PDF and images",
            feedback: "Feedback:",

            // Exam System
            examTitle: "Exam Title",
            questionCount: "Number of Questions",
            questionType: "Question Type",
            singleChoice: "Single Choice",
            multipleChoice: "Multiple Choice",
            trueFalse: "True/False",
            questionText: "Question Text",
            options: "Options",
            addOption: "Add Option",
            correctAnswer: "Correct Answer",
            examSubmissions: "Student Submissions",
            score: "Score:",
            passed: "Passed",
            failed: "Failed",
            averageScore: "Average Score",
            reviewAnswers: "Review Answers",
            timeRemaining: "Time Remaining",
            submitExam: "Submit Exam",
            examInstructions: "Exam Instructions",
            startExam: "Start Exam",
            examStats: "Exam Statistics",
            totalSubmissions: "Total Submissions",
            passedCount: "Passed",
            failedCount: "Failed",
            averageGrade: "Average Grade",
            studentAnswers: "Student Answers",
            correct: "Correct!",
            incorrect: "Incorrect",
            viewAnswers: "View Answers",
            examCompleted: "Exam Completed",
            yourGrade: "Your Grade",
            submittedOn: "Submitted on",
            examTimeLimit: "Exam Time Limit",

            // Messages & Alerts
            urgentMessage: "Urgent Message",
            messageDetails: "Message Details",
            timestamp: "Date and Time",
            messageType: "Message Type",
            normal: "Normal",
            urgent: "Urgent",
            selectSubject: "Select Subject",
            imagePreview: "Image Preview",
            sent: "Sent",
            read: "Read",
            received: "Received",
            address: "Address",
            searchMessages: "Search messages...",
            addCaption: "Add a caption (optional)...",
            imageSizeError: "Image size should not exceed 5MB",
            selectImageError: "Please select an image file",
            answerAllQuestions: "Please answer all questions before submitting the exam",
            activeSession: "Active Session Detected",
            sessionMessage: "You already have an active session in another browser. What would you like to do?",

            // Profile
            profile: "Profile",
            profileInfo: "Your profile information",
            updatePhoto: "Click the camera icon to update your photo",

            // Buttons & Actions
            cancel: "Cancel",
            create: "Create",
            update: "Update",
            delete: "Delete",
            save: "Save",
            close: "Close",
            verify: "Verify Account",
            newPassword: "New Password"
        },
        es: {
            // Header & Navigation
            schoolMoodle: "Módulo Escolar",
            home: "Inicio",
            login: "Iniciar Sesión",
            signup: "Registrarse",
            logout: "Cerrar Sesión",

            // Index Page
            aboutApp: "Acerca de la Aplicación",
            technologies: "Tecnologías",
            howToUse: "Cómo Usar",
            realTimeMsg: "Mensajería en tiempo real con confirmación de entrega",
            userPresence: "Estado de presencia de usuarios (En línea/Desconectado)",
            advancedSearch: "Búsqueda avanzada de mensajes y filtros",
            secureAuth: "Sistema de autenticación seguro",
            academicSystem: "Sistema académico para alumnos y maestros",
            examSystem: "Sistema de exámenes de evaluación",
            backendTech: "Django para el backend",
            jwtAuth: "Autenticación JWT",
            responsiveDesign: "Bootstrap para diseño responsivo",
            database: "Base de Datos PostgreSQL",
            staticFiles: "Archivos estáticos para frontend",
            cloneRepo: "Clonar repositorio de GitHub",
            activateEnv: "Activar entorno virtual",
            installDep: "Instalar dependencias requeridas",
            runServer: "Ejecutar servidor de desarrollo",

            // Login Page
            username: "Nombre de usuario",
            emailLabel: "Correo Electrónico",
            passwordLabel: "Contraseña",
            confirmPassword: "Confirmar Contraseña",
            enterEmail: "Ingrese su correo electrónico",
            enterPassword: "Ingrese su contraseña",
            reenterPassword: "Vuelva a ingresar su contraseña",
            forgotPassword: "¿Olvidó su Contraseña?",
            noAccount: "¿No tiene cuenta? Regístrese",
            hasAccount: "¿Ya tiene cuenta? Inicie Sesión",
            loginBtn: "Iniciar Sesión",
            signupBtn: "Registrarse",
            verifyNotRobot: "Por favor verifique que no es un robot",

            // Chat Interface
            courses: "Cursos Disponibles",
            exams: "Exámenes Disponibles",
            chats: "Chats",
            searchUsers: "Buscar usuarios...",
            createAssignment: "Crear Tarea",
            createCourse: "Crear Curso",
            createExam: "Crear Examen",
            noMessages: "Sin Mensajes",
            typeMessage: "Escribe un mensaje...",
            send: "Enviar",
            backToCourses: "Volver a Cursos",
            backToExams: "Volver a Exámenes",

            // Course Management
            assignmentTitle: "Título de la Tarea",
            courseName: "Nombre del Curso",
            subject: "Materia",
            description: "Descripción",
            room: "Sala",
            programming: "Programación",
            mathematics: "Matemáticas",
            english: "Inglés",
            creator: "Creador",
            createdAt: "Creado el",
            assignments: "Tareas",
            noAssignments: "No hay tareas asignadas",
            dueDate: "Fecha de Entrega",
            points: "Puntos",
            status: "Estado",
            pending: "Pendiente",
            submitted: "Entregado",
            late: "Atrasado",
            supportMaterial: "Material de Apoyo",
            submit: "Entregar",
            download: "Descargar",
            chooseFile: "Elegir archivo",
            acceptedFormats: "Formatos aceptados: Word, Excel, PowerPoint, PDF e imágenes",
            creatorOfCourse: "Creador del Curso",
            sendHomework: "Enviar Tarea",
            acceptedFiles: "Formatos de archivo aceptados: Word, Excel, PowerPoint, PDF e imágenes",
            feedback: "Retroalimentacion:",

            // Exam System
            examTitle: "Título del Examen",
            questionCount: "Número de Preguntas",
            questionType: "Tipo de Pregunta",
            singleChoice: "Opción Única",
            multipleChoice: "Opción Múltiple",
            trueFalse: "Verdadero/Falso",
            questionText: "Texto de la Pregunta",
            options: "Opciones",
            addOption: "Añadir Opción",
            correctAnswer: "Respuesta Correcta",
            examSubmissions: "Entregas de Alumnos",
            score: "Calificación:",
            passed: "Aprobado",
            failed: "No Aprobado",
            averageScore: "Promedio General",
            reviewAnswers: "Revisar Respuestas",
            timeRemaining: "Tiempo Restante",
            submitExam: "Enviar Examen",
            examInstructions: "Instrucciones del Examen",
            startExam: "Comenzar Examen",
            examStats: "Estadísticas del Examen",
            totalSubmissions: "Total de Entregas",
            passedCount: "Aprobados",
            failedCount: "Reprobados",
            averageGrade: "Promedio General",
            studentAnswers: "Respuestas del Alumno",
            correct: "¡Correcto!",
            incorrect: "Incorrecto",
            viewAnswers: "Ver Respuestas",
            examCompleted: "Examen Completado",
            yourGrade: "Tu Calificación",
            submittedOn: "Enviado el",
            examTimeLimit: "Límite de Tiempo del Examen",

            // Messages & Alerts
            urgentMessage: "Mensaje Urgente",
            messageDetails: "Detalles del Mensaje",
            timestamp: "Fecha y Hora",
            messageType: "Tipo de Mensaje",
            normal: "Normal",
            urgent: "Urgente",
            selectSubject: "Seleccionar Materia",
            imagePreview: "Vista previa de imagen",
            sent: "Enviado",
            read: "Leído",
            received: "Recibido",
            address: "Dirección",
            searchMessages: "Buscar mensajes...",
            addCaption: "Agregar un título (opcional)...",
            imageSizeError: "El tamaño de la imagen no debe exceder 5MB",
            selectImageError: "Por favor seleccione un archivo de imagen",
            answerAllQuestions: "Por favor responda todas las preguntas antes de enviar el examen",
            activeSession: "Sesión Activa Detectada",
            sessionMessage: "Ya tiene una sesión activa en otro navegador. ¿Qué desea hacer?",

            // Profile
            profile: "Perfil",
            profileInfo: "Tu información de perfil",
            updatePhoto: "Haz clic en el ícono de la cámara para actualizar tu foto",

            // Buttons & Actions
            cancel: "Cancelar",
            create: "Crear",
            update: "Actualizar",
            delete: "Eliminar",
            save: "Guardar",
            close: "Cerrar",
            verify: "Verificar Cuenta",
            newPassword: "Nueva Contraseña"
        }
    };

    // Translate elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder) {
                    element.placeholder = translations[lang][key];
                }
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Update placeholders for specific elements
    const myInput = document.getElementById('my_input');
    if (myInput) {
        myInput.placeholder = translations[lang]['typeMessage'];
    }

    // Update all file input labels
    document.querySelectorAll('.custom-file-label').forEach(label => {
        if (label.textContent === 'Choose file' || label.textContent === 'Elegir archivo') {
            label.textContent = translations[lang]['chooseFile'];
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'en';
    translatePage(savedLang);
    updateLanguageIcon();
});