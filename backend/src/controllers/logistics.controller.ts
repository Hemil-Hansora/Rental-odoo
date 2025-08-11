import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DeliveryNote } from '../models/deliveryNote.model';
import { Order } from '../models/order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

/**
 * @desc    Create a new delivery note for an order
 * @route   POST /api/v1/logistics
 * @access  Private (Customer only)
 */
export const createDeliveryNote = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, type, scheduledAt, checklist } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid Order ID");
    }

    // 1. Find the order to link the delivery note to
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    
    // 2. Create the delivery note
    const deliveryNote = await DeliveryNote.create({
        order: orderId,
        type, // 'pickup' or 'delivery'
        scheduledAt: scheduledAt || (type === 'pickup' ? order.pickup.scheduledAt : order.return.scheduledAt),
        checklist,
        status: 'scheduled'
    });

    return res
        .status(201)
        .json(new ApiResponse(201, deliveryNote, "Delivery note created successfully"));
});

/**
 * @desc    Get all delivery notes
 * @route   GET /api/v1/logistics
 * @access  Private (Customer only)
 */
export const getAllDeliveryNotes = asyncHandler(async (req: Request, res: Response) => {
    const deliveryNotes = await DeliveryNote.find({})
        .populate({
            path: 'order',
            select: 'customer status',
            populate: { path: 'customer', select: 'name' }
        })
        .sort({ scheduledAt: -1 });
        
    return res
        .status(200)
        .json(new ApiResponse(200, deliveryNotes, "Delivery notes retrieved successfully"));
});

/**
 * @desc    Update a delivery note's status or details
 * @route   PATCH /api/v1/logistics/:id
 * @access  Private (Customer only)
 */
export const updateDeliveryNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, actualAt, driver, vehicle, checklist } = req.body;

    const validStatuses = ['scheduled', 'in_transit', 'completed', 'failed'];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const deliveryNote = await DeliveryNote.findByIdAndUpdate(
        id, 
        { $set: req.body }, 
        { new: true, runValidators: true }
    );

    if (!deliveryNote) {
        throw new ApiError(404, "Delivery note not found");
    }
    
    // Optional: If the delivery note is 'completed', update the order status
    if (status === 'completed') {
        const newOrderStatus = deliveryNote.type === 'pickup' ? 'picked_up' : 'returned';
        await Order.findByIdAndUpdate(deliveryNote.order, { status: newOrderStatus });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deliveryNote, "Delivery note updated successfully"));
});