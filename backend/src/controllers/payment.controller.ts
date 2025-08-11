import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/payment.model';
import { Invoice } from '../models/invoice.model';
import { Order } from '../models/order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

/**
 * @desc    Record a new payment against an invoice
 * @route   POST /api/v1/payments
 * @access  Private (Customer only)
 */
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