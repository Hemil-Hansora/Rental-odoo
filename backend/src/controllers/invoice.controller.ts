import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/invoice.model';
import { Order } from '../models/order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';


export const createInvoiceFromOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid Order ID");
    }

    // 1. Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
        throw new ApiError(409, "An invoice already exists for this order.");
    }
    
    // 3. Generate a sequential invoice number (simple approach)
    // For high concurrency, a dedicated counter collection is more robust.
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const nextInvoiceNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber) + 1 : 1001;

    // 4. Create the new invoice document
    const invoice = await Invoice.create({
        order: order._id,
        invoiceNumber: nextInvoiceNumber.toString(),
        amount: order.total,
        tax: order.tax,
        paid: 0,
        dueAmount: order.total,
        status: 'sent', // Initial status
        issuedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
        lineItems: order.items,
        notes: "Thank you for your business!",
    });

    return res
        .status(201)
        .json(new ApiResponse(201, invoice, "Invoice created successfully"));
});


export const getAllInvoices = asyncHandler(async (req: Request, res: Response) => {
    const invoices = await Invoice.find({})
        .populate({
            path: 'order',
            select: 'customer status',
            populate: { path: 'customer', select: 'name email' }
        })
        .sort({ issuedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, invoices, "Invoices retrieved successfully"));
});


export const getInvoiceById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Invoice ID");
    }

    const invoice = await Invoice.findById(id)
        .populate({
            path: 'order',
            populate: { path: 'customer', select: 'name email' }
        })
        .populate('payments'); // Populate the payments made against this invoice

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, invoice, "Invoice retrieved successfully"));
});