import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Quotation, QuotationValidationSchema } from '../models/quotation.model';
import { Product } from '../models/product.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

// --- Zod Schema for the request body ---
const createQuotationBodySchema = z.object({
    items: z.array(z.object({
        product: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid product ID"),
        quantity: z.number().int().positive(),
        start: z.string().datetime(),
        end: z.string().datetime(),
    })).min(1, "At least one item is required"),
    notes: z.string().optional(),
});


export const createQuotation = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate request body
    const validationResult = createQuotationBodySchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ApiError(400, "Invalid quotation data", validationResult.error.errors);
    }
    const { items: requestedItems, notes } = validationResult.data;
    
    let subtotal = 0;
    const processedItems = [];

    // 2. Process each item in the quotation
    for (const item of requestedItems) {
        const product = await Product.findById(item.product);
        if (!product) {
            throw new ApiError(404, `Product with ID ${item.product} not found`);
        }
        
        // --- Price Calculation Logic ---
        const start = new Date(item.start);
        const end = new Date(item.end);
        const durationMs = end.getTime() - start.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const durationDays = durationHours / 24;

        let unitPrice = 0;
        let unit = 'day';

        // Determine the best pricing unit (this can be more complex)
        if (product.pricing.pricePerWeek && durationDays >= 6.5) {
            unitPrice = product.pricing.pricePerWeek;
            unit = 'week';
        } else if (product.pricing.pricePerDay && durationHours >= 22) {
            unitPrice = product.pricing.pricePerDay;
            unit = 'day';
        } else if (product.pricing.pricePerHour) {
            unitPrice = product.pricing.pricePerHour;
            unit = 'hour';
        } else {
            // Fallback to day price if no other price fits
            unitPrice = product.pricing.pricePerDay || 0;
            unit = 'day';
        }

        if (unitPrice === 0) {
            throw new ApiError(400, `Product '${product.name}' has no applicable pricing.`);
        }

        // For simplicity, we multiply. A real system might use prorated logic.
        const totalItemPrice = unitPrice * item.quantity;
        subtotal += totalItemPrice;
        
        processedItems.push({
            ...item,
            start,
            end,
            unit,
            unitPrice,
            totalPrice: totalItemPrice,
        });
    }

    // 3. Calculate total with tax (assuming a global tax rate for now)
    const taxRate = 0.18; // Example: 18% tax. You can make this dynamic later.
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // 4. Create the quotation document
    const quotation = await Quotation.create({
        createdBy: req.user?._id, // from verifyJWT middleware
        items: processedItems,
        subtotal,
        tax,
        total,
        notes,
        status: 'draft',
    });

    return res
        .status(201)
        .json(new ApiResponse(201, quotation, "Quotation created successfully"));
});




export const getAllQuotationsForUser = asyncHandler(async (req: Request, res: Response) => {
    const quotations = await Quotation.find({ createdBy: req.user?._id })
        .populate('items.product', 'name images') // Populate product details
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, quotations, "Quotations retrieved successfully"));
});


export const getQuotationByIdForUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const quotation = await Quotation.findOne({ _id: id, createdBy: req.user?._id })
        .populate('items.product', 'name description pricing');

    if (!quotation) {
        throw new ApiError(404, "Quotation not found or you do not have permission to view it");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation retrieved successfully"));
});


export const updateQuotationStatusForUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the new status
    const validStatuses = ['approved', 'rejected', 'sent']; // Define what statuses a user can set
    if (!status || !validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const quotation = await Quotation.findOneAndUpdate(
        { _id: id, createdBy: req.user?._id, status: 'draft' }, // Can only update a draft
        { $set: { status: status } },
        { new: true }
    );

    if (!quotation) {
        throw new ApiError(404, "Quotation not found, is not in 'draft' status, or you do not have permission to update it");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation status updated successfully"));
});


export const deleteQuotationForUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // A user should only be able to delete a quotation if it's still a draft
    const quotation = await Quotation.findOneAndDelete({ 
        _id: id, 
        createdBy: req.user?._id,
        status: 'draft' 
    });

    if (!quotation) {
        throw new ApiError(404, "Quotation not found, is not in 'draft' status, or you do not have permission to delete it");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { id }, "Quotation deleted successfully"));
});