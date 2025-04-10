// Global variables and functions
let selectedImageData = null;

window.handleImageSelect = function(input) {
    const file = input.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should not exceed 5MB');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            selectedImageData = e.target.result;
            document.getElementById('selectedImage').src = selectedImageData;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('my_input').placeholder = 'Add a caption (optional)...';
        };
        reader.readAsDataURL(file);
    }
};

window.removeSelectedImage = function() {
    selectedImageData = null;
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('my_input').placeholder = 'Type a message...';
};

document.addEventListener("DOMContentLoaded", function () {
    const chatbox = document.querySelector("#chatbox");

    function scrollToBottom() {
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function createStatusIndicator(status) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'message-status';
        
        if (status === 'sent') {
            statusDiv.innerHTML = '<i class="fas fa-check text-secondary ml-2"></i>';
        } else if (status === 'delivered') {
            statusDiv.innerHTML = '<i class="fas fa-check-double text-secondary ml-2"></i>';
        } else if (status === 'read') {
            statusDiv.innerHTML = '<i class="fas fa-check-double text-primary ml-2"></i>';
        }
        
        return statusDiv;
    }

    function updateUnreadCount(sender, count) {
        const userItem = document.querySelector(`.list-group-item[href="/chat/${sender}/"]`);
        if (userItem) {
            let countBadge = userItem.querySelector('.unread-count');
            if (count > 0) {
                if (!countBadge) {
                    countBadge = document.createElement('span');
                    countBadge.className = 'badge badge-success unread-count';
                    const messageContainer = userItem.querySelector('.d-flex.justify-content-between.align-items-center');
                    messageContainer.appendChild(countBadge);
                }
                countBadge.textContent = count;
            } else if (countBadge) {
                countBadge.remove();
            }
        }
    }

    const userSearch = document.querySelector('#userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const userItems = document.querySelectorAll('.contacts .list-group-item');
            
            userItems.forEach(item => {
                const username = item.getAttribute('data-username').toLowerCase();
                if (username.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.closest('.contacts')) {
                document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                document.querySelector('.courses-section a').classList.remove('active');
                document.querySelector('.exams-section a').classList.remove('active');
            }
        });
    });

    function createMessageElement(data, userUsername) {
        const messageContainer = document.createElement("div");
        messageContainer.className = "chat-message " + (data.sender === userUsername ? "sender" : "receiver");
        messageContainer.dataset.timestamp = data.timestamp;
        messageContainer.dataset.status = data.status;
        messageContainer.dataset.type = data.message_type;
        messageContainer.dataset.subject = data.subject;
        messageContainer.dataset.messageId = data.message_id;

        const messageContent = document.createElement("div");
        messageContent.className = "d-flex align-items-center position-relative";

        if (data.sender === userUsername) {
            const dropdownHtml = `
                <div class="dropdown message-options">
                    <button class="btn btn-link text-muted dropdown-toggle" type="button" data-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item set-urgent" href="#">Mensaje Urgente</a>
                        <a class="dropdown-item set-subject" href="#">Materia</a>
                        <a class="dropdown-item show-details" href="#">Más detalles</a>
                    </div>
                </div>
            `;
            messageContent.innerHTML = dropdownHtml;
        }

        if (data.message_type === 'image') {
            const imageContainer = document.createElement("div");
            imageContainer.className = "message-image-container";
            const image = document.createElement("img");
            image.src = data.image_url;
            image.style.maxWidth = "200px";
            image.style.maxHeight = "200px";
            image.style.borderRadius = "8px";
            imageContainer.appendChild(image);
            messageContent.appendChild(imageContainer);

            if (data.message && data.message.trim() !== '') {
                const caption = document.createElement("p");
                caption.className = "mt-2 mb-0";
                caption.textContent = data.message;
                messageContainer.appendChild(caption);
            }
        } else {
            const messageText = document.createElement("span");
            messageText.textContent = data.message;
            messageContent.appendChild(messageText);
        }

        if (data.sender === userUsername) {
            messageContent.appendChild(createStatusIndicator(data.status));
        }

        messageContainer.appendChild(messageContent);

        if (data.message_type === 'urgent') {
            const urgentLabel = document.createElement("div");
            urgentLabel.className = "message-label urgent-label";
            urgentLabel.textContent = "Mensaje Urgente";
            messageContainer.appendChild(urgentLabel);
        }

        if (data.subject !== 'none') {
            const subjectLabel = document.createElement("div");
            subjectLabel.className = "message-label subject-label";
            subjectLabel.textContent = data.subject === 'programming' ? 'Programación' :
                                    data.subject === 'math' ? 'Matemáticas' :
                                    data.subject === 'english' ? 'Inglés' : data.subject;
            messageContainer.appendChild(subjectLabel);
        }

        return messageContainer;
    }

    scrollToBottom();

    const roomName = JSON.parse(document.getElementById("room_name").textContent);
    const userUsername = JSON.parse(document.getElementById("user_username").textContent);

    const chatSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/chat/" + roomName + "/"
    );

    chatSocket.onopen = function (e) {
        console.log("The connection was set up successfully!");
    };
    
    chatSocket.onclose = function (e) {
        console.log("Something unexpected happened!");
    };

    document.querySelector("#my_input").focus();
    document.querySelector("#my_input").onkeyup = function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            document.querySelector("#submit_button").click();
        }
    };

    $(document).on('click', '.set-urgent', function(e) {
        e.preventDefault();
        const messageContainer = $(this).closest('.chat-message');
        const messageId = messageContainer.data('messageId');
        
        chatSocket.send(JSON.stringify({
            action: 'update_message',
            message_id: messageId,
            message_type: 'urgent'
        }));
    });

    $(document).on('click', '.set-subject', function(e) {
        e.preventDefault();
        const messageContainer = $(this).closest('.chat-message');
        $('#subjectModal').modal('show');
        $('#subjectModal').data('messageContainer', messageContainer);
    });

    $('#subjectModal .list-group-item').click(function() {
        const subject = $(this).data('subject');
        const messageContainer = $('#subjectModal').data('messageContainer');
        const messageId = messageContainer.data('messageId');
        
        chatSocket.send(JSON.stringify({
            action: 'update_message',
            message_id: messageId,
            subject: subject
        }));
        
        $('#subjectModal').modal('hide');
    });

    $(document).on('click', '.show-details', function(e) {
        e.preventDefault();
        const messageContainer = $(this).closest('.chat-message');
        
        $('#messageTimestamp').text(messageContainer.data('timestamp'));
        $('#messageStatus').text(messageContainer.data('status'));
        $('#messageType').text(messageContainer.data('type') === 'urgent' ? 'Urgente' : 'Normal');
        
        const subject = messageContainer.data('subject');
        $('#messageSubject').text(
            subject === 'programming' ? 'Programación' :
            subject === 'math' ? 'Matemáticas' :
            subject === 'english' ? 'Inglés' :
            'Ninguna'
        );
        
        $('#messageDetailsModal').modal('show');
    });

    document.querySelector("#submit_button").onclick = function (e) {
        var messageInput = document.querySelector("#my_input").value;

        if (!messageInput && !selectedImageData) {
            alert("Please add a message or select an image!");
            return;
        }

        chatSocket.send(
            JSON.stringify({
                action: 'new_message',
                message: messageInput,
                username: userUsername,
                room_name: roomName,
                message_type: selectedImageData ? 'image' : 'normal',
                subject: 'none',
                image: selectedImageData
            })
        );

        document.querySelector("#my_input").value = "";
        if (selectedImageData) {
            window.removeSelectedImage();
        }
    };

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);

        if (data.type === 'status') {
            const userItems = document.querySelectorAll('.list-group-item');
            userItems.forEach(item => {
                if (item.querySelector('strong').textContent === data.user) {
                    const statusIndicator = item.querySelector('.status-indicator');
                    statusIndicator.style.backgroundColor = data.status === 'online' ? '#28a745' : '#dc3545';
                    
                    if (data.user === roomName) {
                        const statusText = document.querySelector('.text-muted');
                        if (statusText) {
                            statusText.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
                        }
                    }
                }
            });
            return;
        }

        if (data.action === 'message_updated') {
            const messageContainer = $(`.chat-message[data-message-id="${data.message_id}"]`);
            
            if (data.message_type) {
                messageContainer.attr('data-type', data.message_type);
                if (data.message_type === 'urgent') {
                    if (!messageContainer.find('.urgent-label').length) {
                        const label = $('<div class="message-label urgent-label">Mensaje Urgente</div>');
                        messageContainer.append(label);
                    }
                }
            }
            
            if (data.subject) {
                messageContainer.attr('data-subject', data.subject);
                messageContainer.find('.subject-label').remove();
                const subjectText = data.subject === 'programming' ? 'Programación' :
                                data.subject === 'math' ? 'Matemáticas' :
                                data.subject === 'english' ? 'Inglés' : data.subject;
                const label = $(`<div class="message-label subject-label">${subjectText}</div>`);
                messageContainer.append(label);
            }
            return;
        }

        if (data.message && data.sender) {
            const chatbox = document.querySelector("#chatbox");
            const noMessages = document.querySelector(".no-messages");
            if (noMessages) {
                noMessages.style.display = "none";
            }

            const messageElement = createMessageElement(data, userUsername);
            chatbox.appendChild(messageElement);
            scrollToBottom();

            if (data.sender !== userUsername) {
                updateUnreadCount(data.sender, data.unread_count);
            }

            const lastMessage = document.querySelector(
                ".list-group-item.active #last-message"
            );
            if (lastMessage) {
                lastMessage.innerHTML =
                    data.sender === userUsername
                        ? "You: " + data.message
                        : data.message;

                const timestamp = document.querySelector(".list-group-item.active small");
                const date = new Date().toUTCString();
                timestamp.innerHTML = date.slice(17, 22);

                const chats = document.querySelectorAll(".list-group-item");
                const chatsArray = Array.from(chats);
                const chatsSorted = chatsArray.sort((a, b) => {
                    const aTime = a.querySelector("small").innerHTML;
                    const bTime = b.querySelector("small").innerHTML;
                    return aTime < bTime ? 1 : -1;
                });

                const contacts = document.querySelector(".contacts");
                contacts.innerHTML = "";
                chatsSorted.forEach((chat) => {
                    contacts.appendChild(chat);
                });
            }
        }
    };

    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const params = new URLSearchParams(window.location.search);
            params.set('search', this.value);

            ['messageType', 'subject', 'status', 'direction'].forEach(type => {
                const value = document.getElementById(type)?.value;
                if (value) params.set(type === 'messageType' ? 'message_type' : type, value);
            });

            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({}, '', newUrl);

            fetch(newUrl)
                .then(response => response.text())
                .then(html => {
                    const newChatbox = new DOMParser().parseFromString(html, 'text/html').getElementById('chatbox');
                    if (newChatbox) {
                        chatbox.innerHTML = newChatbox.innerHTML;
                        scrollToBottom();
                    }
                })
                .catch(error => console.error('Error al buscar mensajes:', error));
        });
    }
});