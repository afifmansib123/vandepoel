"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, useDeleteNotificationMutation } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Bell, BellOff, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotificationsPage = () => {
  const router = useRouter();
  const { data: notificationsData, isLoading, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
        refetch();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to related URL if available
    if (notification.relatedUrl) {
      router.push(notification.relatedUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId).unwrap();
      refetch();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      />

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No notifications
          </h3>
          <p className="text-gray-500">
            You're all caught up! Check back later for new updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                notification.isRead
                  ? 'bg-white border-gray-200'
                  : 'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    <h3 className={`font-semibold ${
                      notification.priority === 'high' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      notification.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : notification.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {notification.priority}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    <span className="capitalize">{notification.type}</span>
                    {notification.relatedUrl && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        Click to view
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, notification._id)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Delete notification"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
