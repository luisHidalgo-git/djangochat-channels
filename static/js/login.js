{% if show_session_modal %}
$(document).ready(function () {
    $('#activeSessionModal').modal('show');

    // Store credentials for potential force login
    window.loginCredentials = {
        username: "{{ username }}",
        password: "{{ password }}"
    };
});
{% endif %}

$('#forceLogin').click(function () {
    fetch('/force-login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify(window.loginCredentials)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            }
        });
});