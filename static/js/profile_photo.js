let cropper;

document.getElementById('profilePhoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size too large. Maximum size is 2MB.');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            // Hide current photo and show preview container
            document.getElementById('currentPhoto').style.display = 'none';
            document.getElementById('previewContainer').style.display = 'block';
            document.getElementById('cropControls').style.display = 'block';

            // Set preview image
            const previewImage = document.getElementById('previewImage');
            previewImage.src = event.target.result;

            // Initialize cropper
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(previewImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                cropBoxResizable: true,
                cropBoxMovable: true,
                minCropBoxWidth: 200,
                minCropBoxHeight: 200,
                responsive: true,
                guides: true,
                center: true,
                highlight: false,
                background: true,
                modal: true,
                zoomable: true,
                scalable: false
            });
        };
        reader.readAsDataURL(file);
    }
});

function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('profilePhoto').value = '';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('cropControls').style.display = 'none';
    document.getElementById('currentPhoto').style.display = 'block';
}

function saveCrop() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas({
            width: 200,
            height: 200
        });

        canvas.toBlob(function(blob) {
            const formData = new FormData(document.getElementById('profilePhotoForm'));
            formData.set('profile_photo', blob, 'cropped_profile.jpg');

            fetch('/update-profile-photo/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            }).then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Error updating profile photo');
                }
            }).catch(error => {
                console.error('Error:', error);
                alert('Error updating profile photo');
            });
        }, 'image/jpeg', 0.9);
    }
}