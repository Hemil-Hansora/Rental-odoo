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
    // 1. Validate the incoming request body (the "cart")
    const validationResult = createQuotationBodySchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ApiError(400, "Invalid quotation data", validationResult.error.errors);
    }
    const { items: requestedItems, notes } = validationResult.data;

    // 2. Group all requested items by their vendor (the product's creator)
    const vendorItemsMap = new Map<string, any[]>();

    for (const item of requestedItems) {
        const product = await Product.findById(item.product).select('createdBy pricing name'); // Get vendor ID and pricing
        if (!product) {
            throw new ApiError(404, `Product with ID ${item.product} not found`);
        }
        
        const vendorId = product.createdBy.toString();
        
        if (!vendorItemsMap.has(vendorId)) {
            vendorItemsMap.set(vendorId, []);
        }
        
        // Add the full product details to the item for easier processing later
        vendorItemsMap.get(vendorId)!.push({ ...item, productDetails: product });
    }

    const createdQuotations = [];

    // 3. Loop through each vendor's items and create a separate quotation for each one
    for (const [vendorId, items] of vendorItemsMap.entries()) {
        
        let subtotal = 0;
        const processedItems = [];

        // This loop now only processes items for ONE vendor at a time
        for (const item of items) {
            const { productDetails, quantity, start, end } = item;
            
            // --- Price Calculation Logic ---
            const startDate = new Date(start);
            const endDate = new Date(end);
            const durationMs = endDate.getTime() - startDate.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            const durationDays = durationHours / 24;

            let unitPrice = 0;
            let unit = 'day';

            // Use the pricing from the productDetails we fetched earlier
            if (productDetails.pricing.pricePerWeek && durationDays >= 6.5) {
                unitPrice = productDetails.pricing.pricePerWeek;
                unit = 'week';
            } else if (productDetails.pricing.pricePerDay && durationHours >= 22) {
                unitPrice = productDetails.pricing.pricePerDay;
                unit = 'day';
            } else if (productDetails.pricing.pricePerHour) {
                unitPrice = productDetails.pricing.pricePerHour;
                unit = 'hour';
            } else {
                unitPrice = productDetails.pricing.pricePerDay || 0;
            }

            if (unitPrice === 0) {
                throw new ApiError(400, `Product '${productDetails.name}' has no applicable pricing.`);
            }

            const totalItemPrice = unitPrice * quantity;
            subtotal += totalItemPrice;
            
            processedItems.push({
                product: item.product,
                quantity,
                start: startDate,
                end: endDate,
                unit,
                unitPrice,
                totalPrice: totalItemPrice,
            });
        }
        
    
        const taxRate = 0.18; 
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        
        
        const quotation = await Quotation.create({
            createdBy: req.user?._id, 
            vendor: vendorId,         
            items: processedItems,
            subtotal,
            tax,
            total,
            notes,
            status: 'draft',
        });
        createdQuotations.push(quotation);
    }


    return res
        .status(201)
        .json(new ApiResponse(201, createdQuotations, "Quotation(s) created successfully"));
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