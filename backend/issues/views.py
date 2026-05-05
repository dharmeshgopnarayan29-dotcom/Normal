from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Issue, Comment, Upvote, Flag, TimelineEvent
from .serializers import IssueSerializer, CommentSerializer, TimelineEventSerializer


class UserIssueListView(generics.ListAPIView):
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Issue.objects.filter(reported_by=self.request.user, is_flagged=False).order_by('-created_at')


class IssueListCreateView(generics.ListCreateAPIView):
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['category', 'status', 'reported_by']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = Issue.objects.all()

        # Hide flagged issues from non-admin users
        if not (self.request.user.is_staff or getattr(self.request.user, 'role', '') == 'admin'):
            qs = qs.filter(is_flagged=False)

        # Location filter
        location = self.request.query_params.get('location', '').strip()
        if location:
            qs = qs.filter(address__icontains=location)

        return qs

    def perform_create(self, serializer):
        issue = serializer.save(reported_by=self.request.user)
        # Auto-create "submitted" timeline event
        TimelineEvent.objects.create(
            issue=issue,
            step='submitted',
            performed_by=self.request.user,
            note='Complaint submitted by citizen',
        )


class IssueDetailView(generics.RetrieveUpdateAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        old_status = self.get_object().status
        issue = serializer.save()
        new_status = issue.status

        # Auto-create timeline event on status change
        if old_status != new_status:
            step_map = {
                'verified': ('verified', 'Verified by Admin'),
                'in_progress': ('in_progress', 'Work has started'),
                'resolved': ('resolved', 'Issue has been resolved'),
                'rejected': ('rejected', 'Complaint rejected by Admin'),
                'pending': ('submitted', 'Status reset to pending'),
            }
            step_info = step_map.get(new_status)
            if step_info:
                step, note = step_info
                TimelineEvent.objects.create(
                    issue=issue,
                    step=step,
                    performed_by=self.request.user,
                    note=note,
                    department=issue.assigned_department or '',
                )


class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_counts = Issue.objects.values('status').annotate(count=Count('id'))
        category_counts = Issue.objects.values('category').annotate(count=Count('id'))
        
        return Response({
            'status_counts': status_counts,
            'category_counts': category_counts,
        })


# ── Comment endpoints ──

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(issue_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        issue = Issue.objects.get(pk=self.kwargs['pk'])
        serializer.save(user=self.request.user, issue=issue)


# ── Upvote toggle ──

class UpvoteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        upvote, created = Upvote.objects.get_or_create(issue=issue, user=request.user)
        if not created:
            upvote.delete()
            return Response({'upvoted': False, 'upvote_count': issue.upvotes.count()})
        return Response({'upvoted': True, 'upvote_count': issue.upvotes.count()})


# ── Flag toggle ──

class FlagToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        existing_flag = Flag.objects.filter(issue=issue, user=request.user).first()
        if existing_flag:
            # Unflag — remove the flag
            existing_flag.delete()
            flag_count = issue.flags.count()
            # If below threshold, un-hide
            if flag_count < 5 and issue.is_flagged:
                issue.is_flagged = False
                issue.save(update_fields=['is_flagged'])
            return Response({'flagged': False, 'flag_count': flag_count})
        else:
            # Flag — create new
            Flag.objects.create(issue=issue, user=request.user)
            flag_count = issue.flags.count()
            # Auto-flag if 5+ unique users flagged
            if flag_count >= 5:
                issue.is_flagged = True
                issue.save(update_fields=['is_flagged'])
            return Response({'flagged': True, 'flag_count': flag_count})


# ── Admin: list flagged issues ──

class FlaggedIssueListView(generics.ListAPIView):
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Issue.objects.filter(is_flagged=True).order_by('-updated_at')


# ── Admin: restore a flagged issue ──

class RestoreIssueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only admin can restore
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Clear all flags and unflag the issue
        issue.flags.all().delete()
        issue.is_flagged = False
        issue.save(update_fields=['is_flagged'])

        return Response({'detail': 'Issue restored successfully.', 'is_flagged': False})


# ── Delete an issue (owner or admin) ──

class IssueDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.user.is_staff or getattr(request.user, 'role', '') == 'admin'
        is_owner = issue.reported_by == request.user

        if not (is_owner or is_admin):
            return Response({'detail': 'You do not have permission to delete this complaint.'}, status=status.HTTP_403_FORBIDDEN)

        issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Timeline endpoints ──

class TimelineListView(generics.ListAPIView):
    """List timeline events for a specific issue."""
    serializer_class = TimelineEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TimelineEvent.objects.filter(issue_id=self.kwargs['pk'])


class TimelineAddNoteView(APIView):
    """Admin: add a note to a specific timeline step for an issue."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'detail': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

        step = request.data.get('step', '')
        note = request.data.get('note', '')
        department = request.data.get('department', '')

        if not step:
            return Response({'detail': 'Step is required.'}, status=status.HTTP_400_BAD_REQUEST)

        event = TimelineEvent.objects.create(
            issue=issue,
            step=step,
            performed_by=request.user,
            note=note,
            department=department,
        )

        # If step is 'assigned' and department is provided, update issue
        if step == 'assigned' and department:
            issue.assigned_department = department
            issue.save(update_fields=['assigned_department'])

        return Response(TimelineEventSerializer(event).data, status=status.HTTP_201_CREATED)
