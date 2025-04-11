# Django Chat de mensajes en tiempo real

## Características
- Websocket y Bootstrap
- Autenticación con JWT
- Verificación de usuarios con captcha
- Mensajes en tiempo real
- Filtro avanzado de busqueda de mensajes
- Validaciones de alertas y errores
- Visualización de mensajes
- Soporte de mensajes urgentes
- Soporte de mensajes por materia
- Sistema de cursos academicos con tareas
- Implementacion de cargar y descargar archivos academicos
- Desplegado en AWS

## Configuraciones de archivos local
### Crear Base de datos PostgreSQL "chat"
### Entrar en chat_app/settings.py y cambiar las variables de conexión de la base de datos
### Crear y configurar venv
```
python3 -m venv venv && source venv/bin/activate
```
### Instalar archivo requirements
```
pip install -r requirements.txt
```
### Crear migraciones .py
```
python3 manage.py makemigrations && python3 manage.py migrate
```
### Directorio Media
```
mkdir media && mkdir assignment_subimissions && mkdir assignment_support && mkdir chat_images && mkdir profile_photos
```
### Ejecución del proyecto
```
python3 manage.py runserver
```
