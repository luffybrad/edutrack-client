// src/app/services/notification.service.ts - UPDATE

import { ApiResponse } from '../shared/utils/api-response';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// -------------------- ENUMS --------------------
export enum NotificationType {
  MESSAGE = 'message',
  SYSTEM = 'system',
  ALERT = 'alert',
  REMINDER = 'reminder',
}

export enum NotificationStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted', // Changed from ARCHIVED to DELETED
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  GUARDIAN = 'guardian',
}

export enum NotificationAction {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  EDITED = 'edited',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

// -------------------- INTERFACES --------------------
export interface Notification {
  id?: string;
  content: string;
  subject?: string;
  type: NotificationType;
  status: NotificationStatus;
  senderId: string;
  senderRole: UserRole;
  recipientId: string;
  recipientRole: UserRole;
  isEdited?: boolean;
  editedAt?: Date; // Added editedAt
  attachmentUrl?: string;
  parentNotificationId?: string;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationLog {
  id: string;
  notificationId: string;
  action: NotificationAction;
  metadata?: {
    previousContent?: string;
    previousSubject?: string;
    previousAttachmentUrl?: string;
    updatedContent?: string;
    updatedSubject?: string;
    updatedAttachmentUrl?: string;
    editTimestamp?: string;
    permanent?: boolean;
    ipAddress?: string;
    userAgent?: string;
  };
  performedBy: string;
  performedByRole: UserRole;
  createdAt: Date;
}

export interface NotificationWithLogs {
  notification: Notification;
  logs: NotificationLog[];
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface NotificationStats {
  totalSent: number;
  totalReceived: number;
  unreadReceived: number;
  role: UserRole;
}

export interface ConversationParticipant {
  participantId: string;
  participantRole: UserRole;
  lastMessage: Notification;
  unreadCount: number;
}

export interface DeleteResponse {
  deletedCount: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  // -------------------- SEND & RECEIVE --------------------

  /**
   * Send a new notification
   */
  send(data: Partial<Notification>): Observable<ApiResponse<Notification>> {
    return this.http.post<ApiResponse<Notification>>(this.baseUrl, data);
  }

  /**
   * Reply to an existing notification thread
   */
  reply(
    parentNotificationId: string,
    data: {
      content: string;
      subject?: string;
      senderId: string;
      senderRole: UserRole;
      recipientId: string;
      recipientRole: UserRole;
      attachmentUrl?: string;
    },
  ): Observable<ApiResponse<Notification>> {
    return this.http.post<ApiResponse<Notification>>(this.baseUrl, {
      ...data,
      parentNotificationId,
    });
  }

  // -------------------- GET NOTIFICATIONS --------------------

  /**
   * Get all notifications for a recipient
   */
  getByRecipient(
    recipientId: string,
    recipientRole: UserRole,
    options?: {
      status?: NotificationStatus;
      type?: NotificationType;
      limit?: number;
      offset?: number;
      includeRead?: boolean;
      includeDeleted?: boolean; // Added option to include deleted
    },
  ): Observable<ApiResponse<NotificationListResponse>> {
    let url = `${this.baseUrl}/recipient/${recipientId}/${recipientRole}`;
    const params: any = {};

    if (options?.status) params.status = options.status;
    if (options?.type) params.type = options.type;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    if (options?.includeRead !== undefined)
      params.includeRead = options.includeRead;
    if (options?.includeDeleted !== undefined)
      params.includeDeleted = options.includeDeleted;

    return this.http.get<ApiResponse<NotificationListResponse>>(url, {
      params,
    });
  }

  /**
   * Get all notifications sent by a sender
   */
  getBySender(
    senderId: string,
    senderRole: UserRole,
    limit?: number,
    offset?: number,
    includeDeleted?: boolean, // Added option
  ): Observable<ApiResponse<NotificationListResponse>> {
    let url = `${this.baseUrl}/sender/${senderId}/${senderRole}`;
    const params: any = {};

    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

    return this.http.get<ApiResponse<NotificationListResponse>>(url, {
      params,
    });
  }

  /**
   * Get notification by ID
   */
  getById(id: string): Observable<ApiResponse<Notification>> {
    return this.http.get<ApiResponse<Notification>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get notification with logs
   */
  getWithLogs(id: string): Observable<ApiResponse<NotificationWithLogs>> {
    return this.http.get<ApiResponse<NotificationWithLogs>>(
      `${this.baseUrl}/${id}/logs`,
    );
  }

  /**
   * Get conversation thread
   */
  getThread(
    parentNotificationId: string,
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(
      `${this.baseUrl}/thread/${parentNotificationId}`,
      {
        params: { userId, userRole },
      },
    );
  }

  /**
   * Get unread count for a recipient
   */
  getUnreadCount(
    recipientId: string,
    recipientRole: UserRole,
  ): Observable<ApiResponse<{ unreadCount: number }>> {
    return this.http.get<ApiResponse<{ unreadCount: number }>>(
      `${this.baseUrl}/unread/${recipientId}/${recipientRole}`,
    );
  }

  /**
   * Get notification statistics
   */
  getStats(
    userId: string,
    userRole: UserRole,
    startDate?: Date,
    endDate?: Date,
  ): Observable<ApiResponse<NotificationStats>> {
    let url = `${this.baseUrl}/stats/${userId}/${userRole}`;
    const params: any = {};

    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    return this.http.get<ApiResponse<NotificationStats>>(url, { params });
  }

  /**
   * Get recent conversations
   */
  getRecentConversations(
    userId: string,
    userRole: UserRole,
    limit?: number,
  ): Observable<ApiResponse<ConversationParticipant[]>> {
    let url = `${this.baseUrl}/conversations/${userId}/${userRole}`;
    const params: any = {};

    if (limit) params.limit = limit;

    return this.http.get<ApiResponse<ConversationParticipant[]>>(url, {
      params,
    });
  }

  // -------------------- UPDATE STATUS --------------------

  /**
   * Mark notification as delivered
   */
  markAsDelivered(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<Notification>> {
    return this.http.patch<ApiResponse<Notification>>(
      `${this.baseUrl}/${id}/delivered`,
      { userId, userRole },
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<Notification>> {
    return this.http.patch<ApiResponse<Notification>>(
      `${this.baseUrl}/${id}/read`,
      { userId, userRole },
    );
  }

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead(
    notificationIds: string[],
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<{ updatedCount: number }>> {
    return this.http.patch<ApiResponse<{ updatedCount: number }>>(
      `${this.baseUrl}/read-multiple`,
      { notificationIds, userId, userRole },
    );
  }

  /**
   * Mark all notifications as read for a recipient
   */
  markAllAsRead(
    recipientId: string,
    recipientRole: UserRole,
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<{ updatedCount: number }>> {
    return this.http.patch<ApiResponse<{ updatedCount: number }>>(
      `${this.baseUrl}/read-all/${recipientId}/${recipientRole}`,
      { userId, userRole },
    );
  }

  // -------------------- UPDATE CONTENT (EDIT) --------------------

  /**
   * Update/Edit notification content (only sender, within time window)
   */
  update(
    id: string,
    data: {
      content?: string;
      subject?: string;
      attachmentUrl?: string;
    },
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<Notification>> {
    return this.http.put<ApiResponse<Notification>>(`${this.baseUrl}/${id}`, {
      ...data,
      userId,
      userRole,
    });
  }

  // -------------------- DELETE OPERATIONS --------------------

  /**
   * Soft delete notification (any participant can soft delete)
   * Message content is obscured, status set to DELETED
   */
  delete(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<Notification>> {
    return this.http.delete<ApiResponse<Notification>>(
      `${this.baseUrl}/${id}`,
      {
        body: { userId, userRole },
      },
    );
  }

  /**
   * Permanently delete notification (admin only)
   * Completely removes notification from database
   */
  permanentDelete(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/${id}/permanent`,
      {
        body: { userId, userRole },
      },
    );
  }

  /**
   * Bulk soft delete notifications (only sender can delete)
   */
  bulkDelete(
    notificationIds: string[],
    userId: string,
    userRole: UserRole,
  ): Observable<ApiResponse<{ deletedCount: number }>> {
    return this.http.post<ApiResponse<{ deletedCount: number }>>(
      `${this.baseUrl}/bulk-delete`,
      { notificationIds, userId, userRole },
    );
  }

  // -------------------- CONVENIENCE METHODS --------------------

  /**
   * Check if notification is editable
   * Notifications are editable within 30 minutes of sending and only by sender
   */
  isEditable(
    notification: Notification,
    currentUserId: string,
    currentUserRole: UserRole,
  ): boolean {
    if (!notification.id) return false;
    if (notification.status === NotificationStatus.DELETED) return false;
    if (
      notification.senderId !== currentUserId ||
      notification.senderRole !== currentUserRole
    )
      return false;

    // Check 30 minute edit window
    const editWindowMs = 30 * 60 * 1000;
    const createdAt = new Date(notification.createdAt || new Date()).getTime();
    const now = new Date().getTime();

    return now - createdAt <= editWindowMs;
  }

  /**
   * Check if user can delete notification
   * Both sender and recipient can soft delete
   */
  canDelete(
    notification: Notification,
    userId: string,
    userRole: UserRole,
  ): boolean {
    if (!notification.id) return false;
    if (notification.status === NotificationStatus.DELETED) return false;

    return (
      (notification.senderId === userId &&
        notification.senderRole === userRole) ||
      (notification.recipientId === userId &&
        notification.recipientRole === userRole)
    );
  }

  /**
   * Check if user can permanently delete (admin only)
   */
  canPermanentDelete(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  /**
   * Send notification to admin
   */
  sendToAdmin(
    content: string,
    subject: string,
    senderId: string,
    senderRole: UserRole,
    adminId: string,
  ): Observable<ApiResponse<Notification>> {
    return this.send({
      content,
      subject,
      type: NotificationType.MESSAGE,
      senderId,
      senderRole,
      recipientId: adminId,
      recipientRole: UserRole.ADMIN,
    });
  }

  /**
   * Send notification to teacher
   */
  sendToTeacher(
    content: string,
    subject: string,
    senderId: string,
    senderRole: UserRole,
    teacherId: string,
  ): Observable<ApiResponse<Notification>> {
    return this.send({
      content,
      subject,
      type: NotificationType.MESSAGE,
      senderId,
      senderRole,
      recipientId: teacherId,
      recipientRole: UserRole.TEACHER,
    });
  }

  /**
   * Send notification to guardian
   */
  sendToGuardian(
    content: string,
    subject: string,
    senderId: string,
    senderRole: UserRole,
    guardianId: string,
  ): Observable<ApiResponse<Notification>> {
    return this.send({
      content,
      subject,
      type: NotificationType.MESSAGE,
      senderId,
      senderRole,
      recipientId: guardianId,
      recipientRole: UserRole.GUARDIAN,
    });
  }

  /**
   * Send system notification (admin only)
   */
  sendSystemNotification(
    content: string,
    subject: string,
    recipientId: string,
    recipientRole: UserRole,
    adminId: string,
  ): Observable<ApiResponse<Notification>> {
    return this.send({
      content,
      subject,
      type: NotificationType.SYSTEM,
      senderId: adminId,
      senderRole: UserRole.ADMIN,
      recipientId,
      recipientRole,
    });
  }

  /**
   * Send alert notification
   */
  sendAlert(
    content: string,
    subject: string,
    senderId: string,
    senderRole: UserRole,
    recipientId: string,
    recipientRole: UserRole,
  ): Observable<ApiResponse<Notification>> {
    return this.send({
      content,
      subject,
      type: NotificationType.ALERT,
      senderId,
      senderRole,
      recipientId,
      recipientRole,
    });
  }
}
