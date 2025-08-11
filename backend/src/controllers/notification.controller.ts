import { Request, Response } from 'express';
import { Notification } from '../models/notification.model';
import { getIO } from '../socket'; // Import the socket instance getter
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';


export const sendNotification = async (
    recipientId: string,
    type: string,
    payload: Record<string, any>
) => {
    try {
        // Default channel and scheduledAt if missing
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            payload,
            channel: 'in-app',
            scheduledAt: new Date(),
            status: 'scheduled'
        });

        // 2. Emit a real-time event to the specific user's room
        const io = getIO();
        const room = `user_${recipientId}`;
        io.to(room).emit('new_notification', notification);

        return notification;
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
};


// --- Controller Functions for Managing Notifications ---

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/v1/notifications
 * @access  Private (Customer or End User)
 */
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await Notification.find({ recipient: req.user?._id })
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications retrieved successfully"));
});

/**
 * @desc    Mark notifications as read
 * @route   PATCH /api/v1/notifications/read
 * @access  Private (Customer or End User)
 */
export const markNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { notificationIds } = req.body; // Expect an array of IDs

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ApiError(400, "notificationIds must be a non-empty array.");
    }
    
    await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: req.user?._id },
        { $set: { readAt: new Date(), status: 'sent' } } // Assuming 'sent' means read
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notifications marked as read"));
});