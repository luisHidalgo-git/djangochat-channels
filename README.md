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
- Desplegado en AWS

## Configuraciones de archivos local
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
### Ejecución del proyecto
```
python3 manage.py runserver
```
