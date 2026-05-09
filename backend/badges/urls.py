from django.urls import path
from .views import MyBadgesView

urlpatterns = [
    path('mine/', MyBadgesView.as_view(), name='my-badges'),
]
