import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/order.model';
import { Quotation } from '../models/quotation.model';
import { Reservation } from '../models/reservation.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { sendNotification } from './notification.controller';


import { z } from 'zod';
import { zodObjectId } from '../lib/zod-types'; // Assuming you have a custom Zod type for ObjectId
// ... other imports

// Define a Zod schema for the new data you expect in the request body


// Define a Zod schema at the top of your controller file to validate the new inputs
const createOrderBodySchema = z.object({
    quotationId: zodObjectId,
    deliveryMethod: z.enum(['pickup', 'delivery']),
    deliveryAddress: z.string().optional(),
}).refine(data => {
    // Make deliveryAddress required only if the method is 'delivery'
    return data.deliveryMethod !== 'delivery' || !!data.deliveryAddress;
}, {
    message: "A delivery address is required when the delivery method is 'delivery'",
    path: ['deliveryAddress'],
});

export const createOrderFromQuotation = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate the incoming request body with the new schema
    const validationResult = createOrderBodySchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ApiError(400, "Invalid data provided", validationResult.error.errors);
    }
    const { quotationId, deliveryMethod, deliveryAddress } = validationResult.data;

    // 2. Find the quotation and populate the product details we need
    const quotation = await Quotation.findById(quotationId).populate({
        path: 'items.product',
        select: 'images createdBy' // Select images to copy and createdBy for the vendor
    });

    if (!quotation) throw new ApiError(404, "Quotation not found");
    // Add your other quotation validation checks here (status is 'approved', user is owner, etc.)
    if (quotation.status !== 'approved') throw new ApiError(400, "Only 'approved' quotations can be converted.");
    //@ts-ignore
    if (quotation.createdBy.toString() !== req.user?._id.toString()) throw new ApiError(403, "You do not have permission to convert this quotation");


    // 3. Prepare the order items, copying the product image to each item
    const orderItems = quotation.items.map((item: any) => {
        const product = item.product;
        return {
            ...item.toObject(),
            product: product._id, // Ensure we are saving just the ID
            productImage: product.images && product.images.length > 0 ? product.images[0] : undefined,
        };
    });

    // 4. Set up delivery and pickup details
    const vendorId = (quotation.items[0]?.product as any)?.createdBy;
    if (!vendorId) {
        throw new ApiError(400, "Could not determine the vendor for this quotation.");
    }

    const pickupLocation = "Default Store Address, Gandhinagar, Gujarat"; // This could come from the vendor's user profile

    const deliveryDetails = {
        method: deliveryMethod,
        address: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 5. Create the Order document with all the new details
        const order = new Order({
            customer: quotation.createdBy,
            vendor: vendorId,
            quotation: quotation._id,
            items: orderItems, // Use the new items with images
            total: quotation.total,
            tax: quotation.tax,
            discount: quotation.discount,
            paidAmount: 0,
            balanceDue: quotation.total,
            status: 'reserved',
            pickup: {
                location: pickupLocation,
                scheduledAt: quotation.items[0].start,
            },
            return: {
                location: pickupLocation,
                scheduledAt: quotation.items[0].end,
            },
            delivery: deliveryDetails,
        });
        console.log(order)
        await order.save({ session });

        // Your logic for creating Reservations and updating the quotation status
       for (const item of order.items) {
    await Reservation.create([{
        order: order._id,          // Get the order ID from the newly created order
        product: item.product,     // Get the product ID from the current item
        quantity: item.quantity,   // Get the quantity from the current item
        start: item.start,         // Get the start date from the current item
        end: item.end,             // Get the end date from the current item
        status: 'reserved',      // Set the initial status
    }], { session });
}
        quotation.status = 'converted';
        await quotation.save({ session });

        await session.commitTransaction();

        // Your notification logic
        await sendNotification(
            vendorId.toString(),
            'order_created',
            {
                orderId: order._id,
                customerId: quotation.createdBy,
                message: `A new order has been created from quotation #${quotation._id.toString().slice(-6)}.`
            }
        );
        
        return res
            .status(201)
            .json(new ApiResponse(201, order, "Order created successfully from quotation"));

    } catch (error) {
        await session.abortTransaction();
        console.error("TRANSACTION FAILED:", error);
        throw new ApiError(500, "Failed to create order. Please try again.");
    } finally {
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
    const validStatuses = ['reserved', 
        'ready_for_pickup', 
        'out_for_delivery', // For tracking items in transit
        'in_use',           // Covers both customer pickup and successful delivery
        'returned', 
        'completed', 
        'cancelled', 
        'overdue'];
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