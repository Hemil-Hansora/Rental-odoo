import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/order.model';
import { Quotation } from '../models/quotation.model';
import { Reservation } from '../models/reservation.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { sendNotification } from './notification.controller';


export const createOrderFromQuotation = asyncHandler(async (req: Request, res: Response) => {
    const { quotationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        throw new ApiError(400, "Invalid Quotation ID");
    }

    // 1. Find the quotation and ensure it's valid for conversion
    const quotation = await Quotation.findById(quotationId);

    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }
    //@ts-ignore
    if (quotation.createdBy.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to convert this quotation");
    }
    if (quotation.status !== 'approved') {
        throw new ApiError(400, "Only 'approved' quotations can be converted to orders.");
    }
    if (quotation.order) {
        throw new ApiError(400, "This quotation has already been converted to an order.");
    }

    // 2. Start a MongoDB session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 3. Create the Order document
        const order = new Order({
            customer: quotation.createdBy,
            quotation: quotation._id,
            items: quotation.items,
            total: quotation.total,
            tax: quotation.tax,
            discount: quotation.discount,
            // Calculate initial payment status
            paidAmount: 0,
            balanceDue: quotation.total,
            status: 'reserved', // Initial status
            pickup: { scheduledAt: quotation.items[0].start },
            return: { scheduledAt: quotation.items[0].end },
            delivery: { method: 'pickup' },
        });
        await order.save({ session });

        
        for (const item of order.items) {
            await Reservation.create([{
                order: order._id,
                product: item.product,
                quantity: item.quantity,
                start: item.start,
                end: item.end,
                status: 'reserved',
            }], { session });
        }

        // 5. Update the quotation to prevent it from being used again
        quotation.status = 'converted';
        quotation.order = order._id;
        await quotation.save({ session });

        // 6. If all operations succeed, commit the transaction
        await session.commitTransaction();

         await sendNotification(
            order.customer.toString(),
            'order_confirmed',
            {
                orderId: order._id,
                message: `Your order #${order._id.toString().slice(-6)} has been confirmed.`
            }
        );

        return res
            .status(201)
            .json(new ApiResponse(201, order, "Order created successfully from quotation"));

    } catch (error) {
        // 7. If any operation fails, abort the transaction
        await session.abortTransaction();
        throw new ApiError(500, "Failed to create order. Please try again.", [error]);
    } finally {
        // 8. End the session
        session.endSession();
    }
});



export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    // Customers can see all orders, users see only their own.
    const query = req.user?.role === 'customer' ? {} : { customer: req.user?._id };

    const orders = await Order.find(query)
        .populate('customer', 'name email')
        .populate('items.product', 'name sku images')
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
});


export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await Order.findById(id)
        .populate('customer', 'name email phone address')
        .populate('items.product');

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Ensure users can only access their own orders
    //@ts-ignore
    if (req.user?.role === 'end_user' && order.customer._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to view this order.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order retrieved successfully"));
});


export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Define the flow of statuses
    const validStatuses = ['reserved', 'ready_for_pickup', 'picked_up', 'in_use', 'returned', 'completed', 'cancelled', 'overdue'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }
    
    // Find the order and update its status
    const order = await Order.findByIdAndUpdate(id, { $set: { status } }, { new: true });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Update reservation statuses to match
    await Reservation.updateMany(
        { order: order._id },
        { $set: { status: status } } // Simplified for this example
    );

     await sendNotification(
        order.customer.toString(),
        'order_status_update',
        {
            orderId: order._id,
            status: order.status,
            message: `Your order status has been updated to: ${order.status}`
        }
    );


    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order status updated successfully"));
});

/**
 * @desc    Cancel an order
 * @route   POST /api/v1/orders/:id/cancel
 * @access  Private (Customer or End User)
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        throw new ApiError(400, "A reason for cancellation is required.");
    }

    const order = await Order.findById(id);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    
    // Check permissions
    //@ts-ignore
    if (req.user?.role === 'end_user' && order.customer.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to cancel this order.");
    }
    
    // Logic to prevent cancellation of orders already in progress
    if (['picked_up', 'in_use', 'returned', 'completed'].includes(order.status)) {
        throw new ApiError(400, `Cannot cancel order with status '${order.status}'.`);
    }

    // Start a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Update the order itself
        order.status = 'cancelled';
        order.cancellation = {
            by: req.user?._id,
            at: new Date(),
            reason: reason,
            refundAmount: 0 // Placeholder for refund logic
        };
        await order.save({ session });

        // Update associated reservations
        await Reservation.updateMany(
            { order: order._id },
            { $set: { status: 'cancelled' } },
            { session }
        );

        await session.commitTransaction();

        await sendNotification(
            order.customer.toString(),
            'order_cancelled',
            {
                orderId: order._id,
                reason: reason,
                message: `Your order has been cancelled. Reason: ${reason}`
            }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, order, "Order cancelled successfully"));
            
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Failed to cancel order. Please try again.", [error]);
    } finally {
        session.endSession();
    }
});