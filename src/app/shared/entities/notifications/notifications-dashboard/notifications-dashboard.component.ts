// src/app/shared/entities/notifications/notifications-dashboard/notifications-dashboard.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Observable, Subscription, map } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import Swal from 'sweetalert2';

import {
  NotificationService,
  Notification,
  UserRole,
  NotificationStatus,
  NotificationType,
  ConversationParticipant,
  NotificationStats,
  NotificationWithLogs,
  NotificationLog,
  NotificationAction,
} from '../../../../services/notifications.service';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { StudentService, Student } from '../../../../services/student.service';
import { TeacherService, Teacher } from '../../../../services/teacher.service';
import {
  GuardianService,
  Guardian,
} from '../../../../services/guardian.service';
import { AdminService, Admin } from '../../../../services/admin.service';

@Component({
  selector: 'app-notifications-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgChartsModule,
  ],
  templateUrl: './notifications-dashboard.component.html',
  styleUrls: ['./notifications-dashboard.component.css'],
})
export class NotificationsDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('threadContainer') threadContainer!: ElementRef;

  // Data collections
  notifications: Notification[] = [];
  conversations: ConversationParticipant[] = [];
  sentNotifications: Notification[] = [];
  deletedNotifications: Notification[] = []; // For trash bin
  unreadCount = 0;
  totalNotifications = 0;
  totalSentNotifications = 0;
  stats: NotificationStats | null = null;

  // Reference data
  students: Student[] = [];
  teachers: Teacher[] = [];
  guardians: Guardian[] = [];
  admins: Admin[] = [];
  allRecipients: {
    id: string;
    name: string;
    role: UserRole;
    identifier: string;
  }[] = [];

  // Current user
  currentUserId: string;
  currentUserRole: UserRole;
  role$: Observable<RoleType | null>;
  RoleType = RoleType;
  UserRole = UserRole;
  NotificationStatus = NotificationStatus;
  NotificationType = NotificationType;
  NotificationAction = NotificationAction;

  // Selected items
  selectedNotification: Notification | null = null;
  selectedNotificationWithLogs: NotificationWithLogs | null = null;
  selectedConversation: ConversationParticipant | null = null;
  conversationThread: Notification[] = [];
  selectedRecipientType: 'student' | 'teacher' | 'guardian' | 'admin' =
    'teacher';
  selectedRecipientId: string | null = null;

  // UI State
  loading = false;
  loadingMore = false;
  loadingSent = false;
  loadingDeleted = false;
  loadingConversations = false;
  loadingThread = false;
  currentPage = 0;
  currentSentPage = 0;
  currentDeletedPage = 0;
  pageSize = 20;
  searchTerm = '';
  sentSearchTerm = '';
  deletedSearchTerm = '';
  dateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  activeTab: 'inbox' | 'sent' | 'compose' | 'stats' | 'deleted' = 'inbox';
  filterStatus: NotificationStatus | 'all' = 'all';
  filterType: NotificationType | 'all' = 'all';
  showDetailView = false;
  editWindowMs = 30 * 60 * 1000; // 30 minutes edit window

  private _searchTerm = '';

  // Modal controls
  showComposeModal = false;
  showReplyModal = false;
  showDeleteModal = false;
  showPermanentDeleteModal = false;
  showFilterModal = false;
  showLogsModal = false;
  showThreadModal = false;
  showEditModal = false;

  displayedNotifications: Notification[] = [];
  // Add this to your component class properties
  displayedSentNotifications: Notification[] = [];

  // Forms
  composeForm!: FormGroup;
  replyForm!: FormGroup;
  filterForm!: FormGroup;
  editForm!: FormGroup;

  // Chart data
  notificationChartData!: ChartData<'doughnut'>;
  timelineChartData!: ChartData<'line'>;
  statusDistributionData!: ChartData<'pie'>;
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };
  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Logs
  notificationLogs: NotificationLog[] = [];
  loadingLogs = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private guardianService: GuardianService,
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    const profile = this.authService.getProfileSync();
    this.currentUserId = profile?.id || '';
    this.currentUserRole =
      (profile?.role?.toLowerCase() as UserRole) || UserRole.ADMIN;
    this.role$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.role ?? null));
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadDashboardData();
    this.initForms();
    this.subscribeToProfile();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // -------------------- INITIALIZATION --------------------

  private initForms(): void {
    this.composeForm = this.fb.group({
      recipientType: ['teacher', Validators.required],
      recipientId: ['', Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(500)]],
      type: [NotificationType.MESSAGE, Validators.required],
      attachmentUrl: [''],
    });

    this.replyForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]],
    });

    this.editForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(500)]],
      attachmentUrl: [''],
    });

    this.filterForm = this.fb.group({
      status: ['all'],
      type: ['all'],
      startDate: [''],
      endDate: [''],
    });
  }

  private subscribeToProfile(): void {
    const sub = this.authService.getProfile$().subscribe((profile) => {
      if (profile) {
        this.currentUserId = profile.id;
        this.currentUserRole = profile.role?.toLowerCase() as UserRole;
        this.loadDashboardData();
      }
    });
    this.subscriptions.push(sub);
  }

  private loadReferenceData(): void {
    // Load students
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.students = res.data || [];
        this.buildAllRecipients();
      },
      error: () => this.showToast('error', 'Failed to load students'),
    });

    // Load teachers
    this.teacherService.getAll().subscribe({
      next: (res) => {
        this.teachers = res.data || [];
        this.buildAllRecipients();
      },
      error: () => this.showToast('error', 'Failed to load teachers'),
    });

    // Load guardians
    this.guardianService.getAll().subscribe({
      next: (res) => {
        this.guardians = res.data || [];
        this.buildAllRecipients();
      },
      error: () => this.showToast('error', 'Failed to load guardians'),
    });

    // Load admins
    if (
      this.currentUserRole === UserRole.ADMIN ||
      this.currentUserRole === UserRole.TEACHER
    ) {
      this.adminService.getAll().subscribe({
        next: (res) => {
          this.admins = res.data || [];
          this.buildAllRecipients();
        },
        error: () => this.showToast('error', 'Failed to load admins'),
      });
    }
  }

  private buildAllRecipients(): void {
    const recipients: {
      id: string;
      name: string;
      role: UserRole;
      identifier: string;
    }[] = [];

    // Add teachers
    this.teachers
      .filter((t): t is Teacher & { id: string } => !!t.id)
      .forEach((t) =>
        recipients.push({
          id: t.id,
          name: t.name,
          role: UserRole.TEACHER,
          identifier: t.email,
        }),
      );

    // Add guardians
    this.guardians
      .filter((g): g is Guardian & { id: string } => !!g.id)
      .forEach((g) =>
        recipients.push({
          id: g.id,
          name: g.name,
          role: UserRole.GUARDIAN,
          identifier: g.email,
        }),
      );

    // Add admins
    this.admins
      .filter((a): a is Admin & { id: string } => !!a.id)
      .forEach((a) =>
        recipients.push({
          id: a.id,
          name: a.name || a.email,
          role: UserRole.ADMIN,
          identifier: a.email,
        }),
      );

    this.allRecipients = recipients;
  }

  // -------------------- DASHBOARD DATA LOADING --------------------

  loadDashboardData(): void {
    this.loadNotifications();
    this.loadUnreadCount();
    this.loadConversations();
    this.loadSentNotifications();
    this.loadDeletedNotifications();
    this.loadStats();
  }

  loadNotifications(reset = false): void {
    if (!this.currentUserId) return;

    if (reset) {
      this.currentPage = 0;
      this.notifications = [];
      this.displayedNotifications = [];
    }

    this.loading = reset;
    this.loadingMore = !reset && this.currentPage > 0;

    const status = this.filterStatus !== 'all' ? this.filterStatus : undefined;
    const type = this.filterType !== 'all' ? this.filterType : undefined;

    const sub = this.notificationService
      .getByRecipient(this.currentUserId, this.currentUserRole, {
        status,
        type,
        limit: this.pageSize,
        offset: this.currentPage * this.pageSize,
        includeRead: true,
        includeDeleted: false,
      })
      .subscribe({
        next: (response) => {
          if (reset) {
            this.notifications = response.data.notifications;
          } else {
            // Use Map to prevent duplicates
            const notificationMap = new Map<string, Notification>();
            [...this.notifications, ...response.data.notifications].forEach(
              (n) => {
                if (n.id) notificationMap.set(n.id, n);
              },
            );
            this.notifications = Array.from(notificationMap.values());
          }
          this.totalNotifications = response.data.total;

          // Apply filters to get displayed notifications
          this.applyClientFilters();

          this.loading = false;
          this.loadingMore = false;
        },
        error: (error) => {
          console.error('Failed to load notifications', error);
          this.loading = false;
          this.loadingMore = false;
          this.showToast('error', 'Failed to load notifications');
        },
      });

    this.subscriptions.push(sub);
  }

  applyClientFilters(): void {
    // Start with fresh array to prevent reference issues
    let filtered = this.notifications
      .filter((n) => n.status !== NotificationStatus.DELETED)
      .map((n) => ({ ...n })); // Create shallow copy to prevent mutation

    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (n) =>
          n.content?.toLowerCase().includes(term) ||
          n.subject?.toLowerCase().includes(term) ||
          n.senderId?.toLowerCase().includes(term) ||
          this.getSenderDisplay(n.senderId, n.senderRole)
            .toLowerCase()
            .includes(term),
      );
    }

    if (this.dateRange.start) {
      const startDate = new Date(this.dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(
        (n) => n.createdAt && new Date(n.createdAt) >= startDate,
      );
    }

    if (this.dateRange.end) {
      const endDate = new Date(this.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (n) => n.createdAt && new Date(n.createdAt) <= endDate,
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    this.displayedNotifications = filtered;
  }

  loadDeletedNotifications(reset = false): void {
    if (!this.currentUserId) return;

    if (reset) {
      this.currentDeletedPage = 0;
      this.deletedNotifications = [];
    }

    this.loadingDeleted = reset;

    const sub = this.notificationService
      .getByRecipient(this.currentUserId, this.currentUserRole, {
        status: NotificationStatus.DELETED,
        limit: this.pageSize,
        offset: this.currentDeletedPage * this.pageSize,
        includeRead: true,
        includeDeleted: true,
      })
      .subscribe({
        next: (response) => {
          if (reset) {
            this.deletedNotifications = response.data.notifications;
          } else {
            this.deletedNotifications = [
              ...this.deletedNotifications,
              ...response.data.notifications,
            ];
          }
          this.loadingDeleted = false;
        },
        error: (error) => {
          console.error('Failed to load deleted notifications', error);
          this.loadingDeleted = false;
        },
      });

    this.subscriptions.push(sub);
  }

  loadMoreDeleted(): void {
    if (!this.loadingDeleted) {
      this.currentDeletedPage++;
      this.loadDeletedNotifications();
    }
  }

  loadUnreadCount(): void {
    if (!this.currentUserId) return;

    const sub = this.notificationService
      .getUnreadCount(this.currentUserId, this.currentUserRole)
      .subscribe({
        next: (response) => (this.unreadCount = response.data.unreadCount),
        error: (error) => console.error('Failed to load unread count', error),
      });

    this.subscriptions.push(sub);
  }

  loadConversations(): void {
    if (!this.currentUserId) return;

    this.loadingConversations = true;
    const sub = this.notificationService
      .getRecentConversations(this.currentUserId, this.currentUserRole, 20)
      .subscribe({
        next: (response) => {
          this.conversations = response.data;
          this.loadingConversations = false;
        },
        error: (error) => {
          console.error('Failed to load conversations', error);
          this.loadingConversations = false;
        },
      });

    this.subscriptions.push(sub);
  }

  loadSentNotifications(reset = false): void {
    if (!this.currentUserId) return;

    if (reset) {
      this.currentSentPage = 0;
      this.sentNotifications = [];
      this.displayedSentNotifications = [];
    }

    this.loadingSent = reset;

    const sub = this.notificationService
      .getBySender(
        this.currentUserId,
        this.currentUserRole,
        this.pageSize,
        this.currentSentPage * this.pageSize,
        false, // Exclude deleted
      )
      .subscribe({
        next: (response) => {
          if (reset) {
            this.sentNotifications = response.data.notifications;
          } else {
            // Use Map to prevent duplicates
            const notificationMap = new Map<string, Notification>();
            [...this.sentNotifications, ...response.data.notifications].forEach(
              (n) => {
                if (n.id) notificationMap.set(n.id, n);
              },
            );
            this.sentNotifications = Array.from(notificationMap.values());
          }
          this.totalSentNotifications = response.data.total;

          // Apply sent filters
          this.applySentFilters();

          this.loadingSent = false;
        },
        error: (error) => {
          console.error('Failed to load sent notifications', error);
          this.loadingSent = false;
        },
      });

    this.subscriptions.push(sub);
  }

  applySentFilters(): void {
    // Start with fresh array
    let filtered = this.sentNotifications
      .filter((n) => n.status !== NotificationStatus.DELETED)
      .map((n) => ({ ...n })); // Create shallow copy

    if (this.sentSearchTerm?.trim()) {
      const term = this.sentSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (n) =>
          n.content?.toLowerCase().includes(term) ||
          n.subject?.toLowerCase().includes(term) ||
          n.recipientId?.toLowerCase().includes(term) ||
          this.getRecipientDisplay(n.recipientId, n.recipientRole)
            .toLowerCase()
            .includes(term),
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    this.displayedSentNotifications = filtered;
  }

  loadMoreSent(): void {
    if (
      this.sentNotifications.length < this.totalSentNotifications &&
      !this.loadingSent
    ) {
      this.currentSentPage++;
      this.loadSentNotifications();
    }
  }

  loadStats(): void {
    if (!this.currentUserId) return;

    const sub = this.notificationService
      .getStats(this.currentUserId, this.currentUserRole)
      .subscribe({
        next: (response) => {
          this.stats = response.data;
          this.updateCharts();
        },
        error: (error) => console.error('Failed to load stats', error),
      });

    this.subscriptions.push(sub);
  }

  loadMore(): void {
    if (
      this.notifications.length < this.totalNotifications &&
      !this.loadingMore
    ) {
      this.currentPage++;
      this.loadNotifications();
    }
  }

  // -------------------- NOTIFICATION DETAILS & LOGS --------------------

  loadNotificationWithLogs(notificationId: string): void {
    this.loadingLogs = true;
    const sub = this.notificationService.getWithLogs(notificationId).subscribe({
      next: (response) => {
        this.selectedNotificationWithLogs = response.data;
        this.notificationLogs = response.data.logs;
        this.loadingLogs = false;
        this.showLogsModal = true;
      },
      error: (error) => {
        console.error('Failed to load notification logs', error);
        this.loadingLogs = false;
        this.showToast('error', 'Failed to load notification history');
      },
    });

    this.subscriptions.push(sub);
  }

  // -------------------- CHARTS --------------------

  private updateCharts(): void {
    if (!this.stats) return;

    // Doughnut chart for notification distribution
    this.notificationChartData = {
      labels: ['Unread', 'Read', 'Sent'],
      datasets: [
        {
          data: [
            this.stats.unreadReceived,
            this.stats.totalReceived - this.stats.unreadReceived,
            this.stats.totalSent,
          ],
          backgroundColor: ['#EF4444', '#10B981', '#3B82F6'],
          hoverBackgroundColor: ['#DC2626', '#059669', '#2563EB'],
        },
      ],
    };

    // Status distribution for received messages
    const readCount = this.stats.totalReceived - this.stats.unreadReceived;
    this.statusDistributionData = {
      labels: ['Read', 'Unread'],
      datasets: [
        {
          data: [readCount, this.stats.unreadReceived],
          backgroundColor: ['#10B981', '#EF4444'],
          hoverBackgroundColor: ['#059669', '#DC2626'],
        },
      ],
    };

    // Generate real timeline data from notifications
    this.generateTimelineData();
  }

  private generateTimelineData(): void {
    const last7Days = this.getLast7Days();
    const receivedData = new Array(7).fill(0);
    const sentData = new Array(7).fill(0);

    // Process received notifications
    this.notifications.forEach((notification) => {
      if (notification.createdAt) {
        const date = new Date(notification.createdAt);
        const dayIndex = this.getDayIndex(date, last7Days);
        if (dayIndex !== -1) {
          receivedData[dayIndex]++;
        }
      }
    });

    // Process sent notifications
    this.sentNotifications.forEach((notification) => {
      if (notification.createdAt) {
        const date = new Date(notification.createdAt);
        const dayIndex = this.getDayIndex(date, last7Days);
        if (dayIndex !== -1) {
          sentData[dayIndex]++;
        }
      }
    });

    this.timelineChartData = {
      labels: last7Days.map((d) => this.formatDayLabel(d)),
      datasets: [
        {
          label: 'Received',
          data: receivedData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Sent',
          data: sentData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  private getLast7Days(): Date[] {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    return dates;
  }

  private getDayIndex(date: Date, weekDays: Date[]): number {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return weekDays.findIndex((d) => d.getTime() === targetDate.getTime());
  }

  private formatDayLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // -------------------- NOTIFICATION ACTIONS --------------------

  markAsRead(notificationId: string, event?: Event): void {
    if (event) event.stopPropagation();

    const sub = this.notificationService
      .markAsRead(notificationId, this.currentUserId, this.currentUserRole)
      .subscribe({
        next: () => {
          const notification = this.notifications.find(
            (n) => n.id === notificationId,
          );
          if (notification) {
            notification.status = NotificationStatus.READ;
            notification.readAt = new Date();
          }
          this.loadUnreadCount();
          this.showToast('success', 'Marked as read');
        },
        error: (error) => {
          console.error('Failed to mark as read', error);
          this.showToast('error', 'Failed to mark as read');
        },
      });

    this.subscriptions.push(sub);
  }

  markAsDelivered(notificationId: string, event?: Event): void {
    if (event) event.stopPropagation();

    const sub = this.notificationService
      .markAsDelivered(notificationId, this.currentUserId, this.currentUserRole)
      .subscribe({
        next: () => {
          const notification = this.notifications.find(
            (n) => n.id === notificationId,
          );
          if (notification) {
            notification.status = NotificationStatus.DELIVERED;
            notification.deliveredAt = new Date();
          }
          this.showToast('success', 'Marked as delivered');
        },
        error: (error) => {
          console.error('Failed to mark as delivered', error);
          this.showToast('error', 'Failed to mark as delivered');
        },
      });

    this.subscriptions.push(sub);
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) {
      this.showToast('info', 'No unread notifications');
      return;
    }

    Swal.fire({
      title: 'Mark all as read?',
      text: `You have ${this.unreadCount} unread notification(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, mark all as read',
    }).then((result) => {
      if (result.isConfirmed) {
        const sub = this.notificationService
          .markAllAsRead(
            this.currentUserId,
            this.currentUserRole,
            this.currentUserId,
            this.currentUserRole,
          )
          .subscribe({
            next: (response) => {
              this.notifications.forEach((n) => {
                n.status = NotificationStatus.READ;
                n.readAt = new Date();
              });
              this.unreadCount = 0;
              this.showToast(
                'success',
                `${response.data.updatedCount} notifications marked as read`,
              );
            },
            error: (error) => {
              console.error('Failed to mark all as read', error);
              this.showToast('error', 'Failed to mark all as read');
            },
          });

        this.subscriptions.push(sub);
      }
    });
  }

  // -------------------- DELETE OPERATIONS --------------------

  softDeleteNotification(notificationId: string, event?: Event): void {
    if (event) event.stopPropagation();

    Swal.fire({
      title: 'Delete notification?',
      html: '<p class="text-sm text-gray-600">The message content will be hidden and moved to trash.</p><p class="text-xs text-gray-500 mt-2">You can restore it later or permanently delete it from trash.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const sub = this.notificationService
          .delete(notificationId, this.currentUserId, this.currentUserRole)
          .subscribe({
            next: (response) => {
              // Remove from current lists
              this.notifications = this.notifications.filter(
                (n) => n.id !== notificationId,
              );
              this.sentNotifications = this.sentNotifications.filter(
                (n) => n.id !== notificationId,
              );
              this.conversations = this.conversations.filter(
                (c) => c.lastMessage.id !== notificationId,
              );

              // Add to deleted list with obscured content
              if (response.data) {
                this.deletedNotifications.unshift(response.data);
              }

              this.loadUnreadCount();
              this.showToast('success', 'Notification moved to trash');

              if (this.selectedNotification?.id === notificationId) {
                this.selectedNotification = null;
                this.selectedNotificationWithLogs = null;
              }
            },
            error: (error) => {
              console.error('Failed to delete notification', error);
              this.showToast('error', 'Failed to delete notification');
            },
          });

        this.subscriptions.push(sub);
      }
    });
  }

  permanentDeleteNotification(notificationId: string, event?: Event): void {
    if (event) event.stopPropagation();

    Swal.fire({
      title: 'Permanently delete?',
      html: '<p class="text-sm text-red-600 font-semibold">This action CANNOT be undone!</p><p class="text-sm text-gray-600 mt-2">The notification will be completely removed from the system.</p>',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const sub = this.notificationService
          .permanentDelete(
            notificationId,
            this.currentUserId,
            this.currentUserRole,
          )
          .subscribe({
            next: () => {
              // Remove from all lists
              this.notifications = this.notifications.filter(
                (n) => n.id !== notificationId,
              );
              this.sentNotifications = this.sentNotifications.filter(
                (n) => n.id !== notificationId,
              );
              this.deletedNotifications = this.deletedNotifications.filter(
                (n) => n.id !== notificationId,
              );
              this.conversations = this.conversations.filter(
                (c) => c.lastMessage.id !== notificationId,
              );

              this.loadUnreadCount();
              this.showToast('success', 'Notification permanently deleted');

              if (this.selectedNotification?.id === notificationId) {
                this.selectedNotification = null;
                this.selectedNotificationWithLogs = null;
              }
            },
            error: (error) => {
              console.error('Failed to permanently delete notification', error);
              this.showToast(
                'error',
                'Failed to permanently delete notification',
              );
            },
          });

        this.subscriptions.push(sub);
      }
    });
  }

  restoreNotification(notificationId: string, event?: Event): void {
    if (event) event.stopPropagation();

    // This would require a restore endpoint - you may need to implement this
    // For now, we'll simulate by removing from deleted list
    this.deletedNotifications = this.deletedNotifications.filter(
      (n) => n.id !== notificationId,
    );
    this.showToast('success', 'Notification restored');

    // Refresh inbox
    this.loadNotifications(true);
  }

  // -------------------- EDIT OPERATIONS --------------------

  openEditModal(notification: Notification): void {
    if (!this.canEditNotification(notification)) {
      this.showToast(
        'error',
        'This notification can no longer be edited (30 minute window expired)',
      );
      return;
    }

    this.selectedNotification = notification;
    this.editForm.patchValue({
      subject: notification.subject || '',
      content: notification.content,
      attachmentUrl: notification.attachmentUrl || '',
    });
    this.showEditModal = true;
  }

  updateNotification(): void {
    if (this.editForm.invalid || !this.selectedNotification?.id) return;

    const { subject, content, attachmentUrl } = this.editForm.value;

    const sub = this.notificationService
      .update(
        this.selectedNotification.id,
        { subject, content, attachmentUrl },
        this.currentUserId,
        this.currentUserRole,
      )
      .subscribe({
        next: (response) => {
          // Update local data
          const updateNotificationInList = (list: Notification[]) => {
            const index = list.findIndex(
              (n) => n.id === this.selectedNotification!.id,
            );
            if (index !== -1) {
              list[index] = response.data;
            }
          };

          updateNotificationInList(this.sentNotifications);
          updateNotificationInList(this.notifications);

          // Update in conversations if present
          const convIndex = this.conversations.findIndex(
            (c) => c.lastMessage.id === this.selectedNotification!.id,
          );
          if (convIndex !== -1) {
            this.conversations[convIndex].lastMessage = response.data;
          }

          this.showToast('success', 'Notification updated successfully');
          this.showEditModal = false;
          this.selectedNotification = null;
        },
        error: (error) => {
          const errorMsg =
            error.error?.message || 'Failed to update notification';
          if (errorMsg.includes('30 minutes')) {
            this.showToast('error', 'Edit window expired (30 minutes)');
          } else {
            this.showToast('error', errorMsg);
          }
        },
      });

    this.subscriptions.push(sub);
  }

  // -------------------- COMPOSE & REPLY --------------------

  openComposeModal(): void {
    this.selectedRecipientId = null;
    this.selectedRecipientType = 'teacher';
    this.composeForm.reset({
      recipientType: 'teacher',
      subject: '',
      content: '',
      type: NotificationType.MESSAGE,
      attachmentUrl: '',
    });
    this.showComposeModal = true;
  }

  onRecipientTypeChange(): void {
    this.selectedRecipientId = null;
    this.composeForm.patchValue({ recipientId: '' });
  }

  getFilteredRecipients(): any[] {
    switch (this.composeForm.get('recipientType')?.value) {
      case 'student':
        return this.students;
      case 'teacher':
        return this.teachers;
      case 'guardian':
        return this.guardians;
      case 'admin':
        return this.admins;
      default:
        return [];
    }
  }

  getRecipientName(recipient: any): string {
    if (!recipient) return '';
    return (
      recipient.name ||
      `${recipient.firstName} ${recipient.lastName}` ||
      recipient.email
    );
  }

  getRecipientIdentifier(recipient: any): string {
    if (recipient.admNo) return `Adm: ${recipient.admNo}`;
    if (recipient.email) return recipient.email;
    if (recipient.phone) return recipient.phone;
    return recipient.id?.slice(0, 8) || '';
  }

  sendNotification(): void {
    if (this.composeForm.invalid) {
      Object.keys(this.composeForm.controls).forEach((key) => {
        this.composeForm.get(key)?.markAsTouched();
      });
      this.showToast('error', 'Please fill all required fields');
      return;
    }

    const formValue = this.composeForm.value;

    const sub = this.notificationService
      .send({
        content: formValue.content,
        subject: formValue.subject,
        type: formValue.type,
        senderId: this.currentUserId,
        senderRole: this.currentUserRole,
        recipientId: formValue.recipientId,
        recipientRole: formValue.recipientType as UserRole,
        attachmentUrl: formValue.attachmentUrl || undefined,
      })
      .subscribe({
        next: (response) => {
          this.showToast('success', 'Notification sent successfully');
          this.showComposeModal = false;
          this.loadSentNotifications(true);
          this.loadConversations();
          if (this.activeTab === 'compose') {
            this.activeTab = 'sent';
          }
        },
        error: (error) => {
          this.showToast(
            'error',
            error.error?.message || 'Failed to send notification',
          );
        },
      });

    this.subscriptions.push(sub);
  }

  openReplyModal(notification: Notification): void {
    this.selectedNotification = notification;
    this.replyForm.reset({ content: '' });
    this.showReplyModal = true;
  }

  sendReply(): void {
    if (this.replyForm.invalid || !this.selectedNotification?.id) return;

    const content = this.replyForm.get('content')?.value;

    const sub = this.notificationService
      .reply(this.selectedNotification.id, {
        content,
        subject: `Re: ${this.selectedNotification.subject || 'Message'}`,
        senderId: this.currentUserId,
        senderRole: this.currentUserRole,
        recipientId: this.selectedNotification.senderId,
        recipientRole: this.selectedNotification.senderRole,
      })
      .subscribe({
        next: () => {
          this.showToast('success', 'Reply sent successfully');
          this.showReplyModal = false;
          this.selectedNotification = null;
          this.loadSentNotifications(true);
          this.loadConversations();
        },
        error: (error) => {
          console.error('Failed to send reply', error);
          this.showToast('error', 'Failed to send reply');
        },
      });

    this.subscriptions.push(sub);
  }

  // -------------------- CONVERSATIONS & THREADS --------------------

  selectConversation(conversation: ConversationParticipant): void {
    this.selectedConversation = conversation;
    this.loadConversationThread(conversation);
  }

  loadConversationThread(conversation: ConversationParticipant): void {
    const parentId =
      conversation.lastMessage.parentNotificationId ||
      conversation.lastMessage.id;

    if (!parentId) return;

    this.loadingThread = true;
    const sub = this.notificationService
      .getThread(parentId, this.currentUserId, this.currentUserRole)
      .subscribe({
        next: (response) => {
          this.conversationThread = response.data;
          this.loadingThread = false;
          this.showThreadModal = true;

          setTimeout(() => {
            if (this.threadContainer) {
              this.threadContainer.nativeElement.scrollTop =
                this.threadContainer.nativeElement.scrollHeight;
            }
          }, 100);
        },
        error: (error) => {
          console.error('Failed to load thread', error);
          this.loadingThread = false;
          this.showToast('error', 'Failed to load conversation thread');
        },
      });

    this.subscriptions.push(sub);
  }

  replyInThread(): void {
    if (!this.replyForm.valid || !this.selectedConversation) return;

    const content = this.replyForm.get('content')?.value;
    const lastMessage = this.selectedConversation.lastMessage;

    const sub = this.notificationService
      .reply(lastMessage.parentNotificationId || lastMessage.id!, {
        content,
        subject: `Re: ${lastMessage.subject || 'Message'}`,
        senderId: this.currentUserId,
        senderRole: this.currentUserRole,
        recipientId: this.selectedConversation.participantId,
        recipientRole: this.selectedConversation.participantRole,
      })
      .subscribe({
        next: (response) => {
          this.conversationThread.push(response.data);
          this.replyForm.reset({ content: '' });

          setTimeout(() => {
            if (this.threadContainer) {
              this.threadContainer.nativeElement.scrollTop =
                this.threadContainer.nativeElement.scrollHeight;
            }
          }, 100);

          this.showToast('success', 'Reply sent');
        },
        error: (error) => {
          console.error('Failed to send reply', error);
          this.showToast('error', 'Failed to send reply');
        },
      });

    this.subscriptions.push(sub);
  }

  // -------------------- FILTERS --------------------

  applyFilters(): void {
    const formValue = this.filterForm.value;
    this.filterStatus = formValue.status;
    this.filterType = formValue.type;

    if (formValue.startDate) {
      this.dateRange.start = new Date(formValue.startDate);
    }
    if (formValue.endDate) {
      this.dateRange.end = new Date(formValue.endDate);
    }

    this.loadNotifications(true);
    this.showFilterModal = false;
    this.showToast('success', 'Filters applied');
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterType = 'all';
    this.dateRange = { start: null, end: null };
    this.filterForm.reset({
      status: 'all',
      type: 'all',
      startDate: '',
      endDate: '',
    });
    this.loadNotifications(true);
    this.showToast('info', 'Filters cleared');
  }

  // -------------------- UI HELPERS --------------------

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.MESSAGE:
        return 'fa-envelope';
      case NotificationType.SYSTEM:
        return 'fa-cog';
      case NotificationType.ALERT:
        return 'fa-exclamation-triangle';
      case NotificationType.REMINDER:
        return 'fa-bell';
      default:
        return 'fa-bell';
    }
  }

  getStatusBadgeClass(status: NotificationStatus): string {
    switch (status) {
      case NotificationStatus.SENT:
        return 'bg-gray-100 text-gray-800';
      case NotificationStatus.DELIVERED:
        return 'bg-blue-100 text-blue-800';
      case NotificationStatus.READ:
        return 'bg-green-100 text-green-800';
      case NotificationStatus.DELETED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeBadgeClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.MESSAGE:
        return 'bg-indigo-100 text-indigo-800';
      case NotificationType.SYSTEM:
        return 'bg-gray-100 text-gray-800';
      case NotificationType.ALERT:
        return 'bg-red-100 text-red-800';
      case NotificationType.REMINDER:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getActionIcon(action: NotificationAction): string {
    switch (action) {
      case NotificationAction.SENT:
        return 'fa-paper-plane';
      case NotificationAction.DELIVERED:
        return 'fa-check-circle';
      case NotificationAction.READ:
        return 'fa-eye';
      case NotificationAction.EDITED:
        return 'fa-pencil-alt';
      case NotificationAction.ARCHIVED:
        return 'fa-archive';
      case NotificationAction.DELETED:
        return 'fa-trash';
      default:
        return 'fa-history';
    }
  }

  getActionColor(action: NotificationAction): string {
    switch (action) {
      case NotificationAction.SENT:
        return 'text-blue-600';
      case NotificationAction.DELIVERED:
        return 'text-indigo-600';
      case NotificationAction.READ:
        return 'text-green-600';
      case NotificationAction.EDITED:
        return 'text-amber-600';
      case NotificationAction.ARCHIVED:
        return 'text-purple-600';
      case NotificationAction.DELETED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  formatTime(date?: Date): string {
    if (!date) return '';

    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  truncateText(text: string, length: number = 50): string {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  getRecipientDisplay(recipientId: string, recipientRole: UserRole): string {
    if (
      recipientId === this.currentUserId &&
      recipientRole === this.currentUserRole
    ) {
      return 'You';
    }
    const recipient = this.allRecipients.find(
      (r) => r.id === recipientId && r.role === recipientRole,
    );
    return recipient
      ? recipient.name
      : `${recipientRole} (${recipientId.slice(0, 8)})`;
  }

  getSenderDisplay(senderId: string, senderRole: UserRole): string {
    if (
      senderId === this.currentUserId &&
      senderRole === this.currentUserRole
    ) {
      return 'You';
    }
    return this.getRecipientDisplay(senderId, senderRole);
  }

  canEditNotification(notification: Notification): boolean {
    return this.notificationService.isEditable(
      notification,
      this.currentUserId,
      this.currentUserRole,
    );
  }

  canDeleteNotification(notification: Notification): boolean {
    return this.notificationService.canDelete(
      notification,
      this.currentUserId,
      this.currentUserRole,
    );
  }

  canPermanentDelete(): boolean {
    return this.notificationService.canPermanentDelete(this.currentUserRole);
  }

  isDeletedNotification(notification: Notification): boolean {
    return notification.status === NotificationStatus.DELETED;
  }

  getTimeUntilEditExpiry(notification: Notification): string {
    if (!notification.createdAt) return 'Expired';

    const createdAt = new Date(notification.createdAt).getTime();
    const now = new Date().getTime();
    const elapsed = now - createdAt;
    const remaining = this.editWindowMs - elapsed;

    if (remaining <= 0) return 'Expired';

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    if (mins > 0) {
      return `${mins}m ${secs}s remaining`;
    }
    return `${secs}s remaining`;
  }

  // -------------------- NAVIGATION --------------------

  navigateToParticipant(participant: ConversationParticipant): void {
    switch (participant.participantRole) {
      case UserRole.ADMIN:
        this.router.navigate(['/admin', participant.participantId]);
        break;
      case UserRole.TEACHER:
        this.router.navigate(['/teachers', participant.participantId]);
        break;
      case UserRole.GUARDIAN:
        this.router.navigate(['/guardians', participant.participantId]);
        break;
    }
  }

  navigateToAllNotifications(): void {
    this.router.navigate(['/notifications/all']);
  }

  // -------------------- UTILITIES --------------------

  private showToast(
    icon: 'success' | 'error' | 'info' | 'warning',
    message: string,
  ): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // -------------------- COMPUTED PROPERTIES --------------------

  get displayedNotificationsCount(): number {
    return this.displayedNotifications.length;
  }

  get filteredDeletedNotifications(): Notification[] {
    let filtered = [...this.deletedNotifications];

    if (this.deletedSearchTerm) {
      const term = this.deletedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.content?.toLowerCase().includes(term) ||
          false ||
          n.subject?.toLowerCase().includes(term) ||
          n.senderId.toLowerCase().includes(term) ||
          n.recipientId.toLowerCase().includes(term),
      );
    }

    return filtered;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id || index.toString();
  }

  get unreadPercentage(): number {
    if (!this.stats?.totalReceived) return 0;
    return (this.stats.unreadReceived / this.stats.totalReceived) * 100;
  }

  get readPercentage(): number {
    if (!this.stats?.totalReceived) return 0;
    return (
      ((this.stats.totalReceived - this.stats.unreadReceived) /
        this.stats.totalReceived) *
      100
    );
  }

  get responseRate(): number {
    if (!this.stats?.totalReceived) return 0;
    const readCount = this.stats.totalReceived - this.stats.unreadReceived;
    return (readCount / this.stats.totalReceived) * 100;
  }

  /**
   * Select a notification to view details and reply
   */
  selectNotification(notification: Notification): void {
    this.selectedNotification = notification;

    if (
      notification.status !== NotificationStatus.READ &&
      notification.status !== NotificationStatus.DELETED &&
      notification.id
    ) {
      this.markAsRead(notification.id);
    }

    this.showDetailView = true;
  }

  closeDetailView(): void {
    this.showDetailView = false;
    this.selectedNotification = null;
  }

  // Add this method to your component class
  getCurrentDate(): Date {
    return new Date();
  }

  // Add these methods to your NotificationsDashboardComponent class

  /**
   * Get participant display name with role and identifier
   */
  getParticipantDisplay(participant: ConversationParticipant): string {
    if (!participant) return 'Unknown User';

    // If it's the current user
    if (
      participant.participantId === this.currentUserId &&
      participant.participantRole === this.currentUserRole
    ) {
      return 'You';
    }

    // Find in all recipients
    const recipient = this.allRecipients.find(
      (r) =>
        r.id === participant.participantId &&
        r.role === participant.participantRole,
    );

    if (recipient) {
      return `${recipient.name} (${recipient.identifier})`;
    }

    // Fallback
    return `${participant.participantRole} • ${participant.participantId.slice(0, 8)}`;
  }

  /**
   * Get participant avatar initials or icon
   */
  getParticipantInitials(participant: ConversationParticipant): string {
    if (!participant) return '?';

    const recipient = this.allRecipients.find(
      (r) =>
        r.id === participant.participantId &&
        r.role === participant.participantRole,
    );

    if (recipient) {
      return recipient.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return participant.participantRole[0].toUpperCase();
  }

  /**
   * Get participant avatar color based on role
   */
  getParticipantAvatarColor(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'from-purple-500 to-indigo-600';
      case UserRole.TEACHER:
        return 'from-blue-500 to-cyan-600';
      case UserRole.GUARDIAN:
        return 'from-green-500 to-emerald-600';

      default:
        return 'from-gray-500 to-gray-600';
    }
  }

  /**
   * Get participant role badge color
   */
  getParticipantRoleBadge(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.TEACHER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.GUARDIAN:
        return 'bg-green-100 text-green-800';

      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
