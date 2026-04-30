from django.db import models
from django.conf import settings
from PIL import Image
import io
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

class Issue(models.Model):
    CATEGORY_CHOICES = (
        ('roads', 'Roads'),
        ('sanitation', 'Sanitation'),
        ('water', 'Water'),
        ('electricity', 'Electricity'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    photo = models.ImageField(upload_to='issues_photos/', blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_department = models.CharField(max_length=100, blank=True, null=True)
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reported_issues')
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.photo:
            # Check if photo has changed or is new
            try:
                # Only process if it's a new upload (UploadedFile instance)
                if hasattr(self.photo, 'file') and isinstance(self.photo.file, UploadedFile):
                    img = Image.open(self.photo)
                    
                    # Target Aspect Ratio 16:9
                    target_ratio = 16 / 9
                    width, height = img.size
                    current_ratio = width / height

                    if current_ratio > target_ratio:
                        # Too wide, crop sides
                        new_width = height * target_ratio
                        offset = (width - new_width) / 2
                        img = img.crop((offset, 0, width - offset, height))
                    elif current_ratio < target_ratio:
                        # Too tall, crop top and bottom
                        new_height = width / target_ratio
                        offset = (height - new_height) / 2
                        img = img.crop((0, offset, width, height - offset))
                    
                    # Resize to standard width (e.g., 800px)
                    if img.width > 800:
                        output_size = (800, int(800 / target_ratio))
                        img = img.resize(output_size, Image.Resampling.LANCZOS)

                    # Save the processed image back to the field
                    buffer = io.BytesIO()
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    img.save(buffer, format='JPEG', quality=85)
                    
                    filename = self.photo.name
                    self.photo.save(filename, ContentFile(buffer.getvalue()), save=False)
            except Exception as e:
                # Log error or handle silently
                pass

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Comment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.issue.title}"


class Upvote(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='upvotes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('issue', 'user')

    def __str__(self):
        return f"Upvote by {self.user.username} on {self.issue.title}"


class Flag(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='flags')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('issue', 'user')

    def __str__(self):
        return f"Flag by {self.user.username} on {self.issue.title}"


class TimelineEvent(models.Model):
    STEP_CHOICES = (
        ('submitted', 'Submitted'),
        ('verified', 'Verified'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )

    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='timeline_events')
    step = models.CharField(max_length=20, choices=STEP_CHOICES)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    note = models.TextField(blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.step} - {self.issue.title} at {self.created_at}"
