// Initialize variables
let cropper = null;
let originalImageUrl = null;

// Function to show image preview modal
function showImagePreview(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Store original image URL
            originalImageUrl = e.target.result;
            
            // Update preview image
            const previewImage = document.getElementById('previewImage');
            previewImage.src = e.target.result;
            
            // Initialize cropper
            if (cropper) {
                cropper.destroy();
            }
            
            cropper = new Cropper(previewImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                modal: true,
                guides: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
            
            // Show the preview modal
            $('#imagePreviewModal').modal('show');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Function to save cropped image
function saveCroppedImage() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    
    canvas.toBlob(function(blob) {
        // Create a new File object
        const croppedImage = new File([blob], 'profile_photo.jpg', { type: 'image/jpeg' });
        
        // Create FormData
        const formData = new FormData();
        formData.append('profile_photo', croppedImage);
        
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // Show loading state
        const saveButton = document.getElementById('saveCropButton');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;
        
        // Send request to server
        fetch('/update-profile-photo/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Close modal
                $('#imagePreviewModal').modal('hide');
                
                // Update profile photo in UI
                const profilePhotos = document.querySelectorAll('.profile-photo');
                profilePhotos.forEach(photo => {
                    photo.src = URL.createObjectURL(croppedImage);
                });
                
                // Show success message
                const toast = new bootstrap.Toast(document.getElementById('successToast'));
                toast.show();
                
                // Reload page to reflect changes
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const toast = new bootstrap.Toast(document.getElementById('errorToast'));
            toast.show();
        })
        .finally(() => {
            // Reset button state
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        });
    }, 'image/jpeg', 0.9);
}

// Event listener for file input change
document.getElementById('profilePhoto').addEventListener('change', function() {
    showImagePreview(this);
});

// Event listener for save button
document.getElementById('saveCropButton').addEventListener('click', saveCroppedImage);

// Reset cropper when modal is hidden
$('#imagePreviewModal').on('hidden.bs.modal', function () {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
});