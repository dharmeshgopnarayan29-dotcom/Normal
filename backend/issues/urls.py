from django.urls import path
from .views import (
    IssueListCreateView, IssueDetailView, AnalyticsView, UserIssueListView,
    CommentListCreateView, UpvoteToggleView, FlagToggleView,
    FlaggedIssueListView, RestoreIssueView,
    TimelineListView, TimelineAddNoteView,
)

urlpatterns = [
    path('my/', UserIssueListView.as_view(), name='my-issues'),
    path('', IssueListCreateView.as_view(), name='issue-list-create'),
    path('flagged/', FlaggedIssueListView.as_view(), name='flagged-issues'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('<int:pk>/', IssueDetailView.as_view(), name='issue-detail'),
    path('<int:pk>/comments/', CommentListCreateView.as_view(), name='issue-comments'),
    path('<int:pk>/upvote/', UpvoteToggleView.as_view(), name='issue-upvote'),
    path('<int:pk>/flag/', FlagToggleView.as_view(), name='issue-flag'),
    path('<int:pk>/restore/', RestoreIssueView.as_view(), name='issue-restore'),
    path('<int:pk>/timeline/', TimelineListView.as_view(), name='issue-timeline'),
    path('<int:pk>/timeline/add/', TimelineAddNoteView.as_view(), name='issue-timeline-add'),
]
