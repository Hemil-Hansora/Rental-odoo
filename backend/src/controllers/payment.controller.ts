import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/payment.model';
import { Invoice } from '../models/invoice.model';
import { Order } from '../models/order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';


export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
    const { invoiceId, amount, method, transactionId, currency = 'USD' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        throw new ApiError(400, "Invalid Invoice ID");
    }
    if (!amount || !method) {
        throw new ApiError(400, "Amount and payment method are required");
    }

    // 1. Find the invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }
    if (invoice.status === 'paid') {
        throw new ApiError(400, "This invoice has already been fully paid.");
    }
    
    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Create the payment record
        const payment = await Payment.create([{
            order: invoice.order,
            invoice: invoice._id,
            amount,
            method,
            transactionId,
            currency,
            status: 'completed',
        }], { session });

        // 3. Update the invoice
        invoice.paid += amount;
        invoice.dueAmount = invoice.amount - invoice.paid;
        invoice.payments.push(payment[0]._id);

        if (invoice.dueAmount <= 0) {
            invoice.status = 'paid';
            invoice.dueAmount = 0; // Ensure it doesn't go negative
        }
        await invoice.save({ session });

        // 4. Update the corresponding order's payment status
        await Order.findByIdAndUpdate(
            invoice.order,
            { $inc: { paidAmount: amount, balanceDue: -amount } },
            { session }
        );

        // 5. Commit the transaction
        await session.commitTransaction();

        return res
            .status(201)
            .json(new ApiResponse(201, payment[0], "Payment recorded successfully"));

    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Failed to record payment. Please try again.", [error]);
    } finally {
        session.endSession();
    }
});




export const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
    // Add filtering by date, method etc. as needed
    const payments = await Payment.find({})
        .populate({
            path: 'invoice',
            select: 'invoiceNumber'
        })
        .populate({
            path: 'order',
            select: 'customer',
            populate: { path: 'customer', select: 'name' }
        })
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, payments, "Payments retrieved successfully"));
});


export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('invoice').populate('order');

    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment retrieved successfully"));
});



export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;
    
    const originalPayment = await Payment.findById(id);

    if (!originalPayment) {
        throw new ApiError(404, "Original payment not found.");
    }
    if (originalPayment.status === 'refunded') {
        throw new ApiError(400, "This payment has already been refunded.");
    }
    if (refundAmount > originalPayment.amount) {
        throw new ApiError(400, "Refund amount cannot be greater than the original payment amount.");
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create a new payment record for the refund transaction
        const refund = await Payment.create([{
            order: originalPayment.order,
            invoice: originalPayment.invoice,
            amount: -refundAmount, // Store refund as a negative amount
            method: originalPayment.method,
            status: 'refunded',
            metadata: { 
                reason: reason,
                originalPaymentId: id
            },
        }], { session });

        // 2. Update the original payment to show it has been refunded
        originalPayment.status = 'refunded';
        await originalPayment.save({ session });
        
        // 3. Update the associated Invoice
        await Invoice.findByIdAndUpdate(
            originalPayment.invoice,
            { $inc: { paid: -refundAmount, dueAmount: refundAmount } },
            { session }
        );

        // 4. Update the associated Order
        await Order.findByIdAndUpdate(
            originalPayment.order,
            { $inc: { paidAmount: -refundAmount, balanceDue: refundAmount } },
            { session }
        );

        await session.commitTransaction();
        
        return res
            .status(201)
            .json(new ApiResponse(201, refund[0], "Refund processed successfully"));

    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Failed to process refund. Please try again.", [error]);
    } finally {
        session.endSession();
    }
});