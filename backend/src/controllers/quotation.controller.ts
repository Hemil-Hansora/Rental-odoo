import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Quotation, QuotationValidationSchema } from '../models/quotation.model';
import { Product } from '../models/product.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { sendNotification } from './notification.controller';

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

         await sendNotification(
  vendorId,
  'new_quotation',
  {
    quotationId: quotation._id,
    customerId: req.user?._id,
    message: `You have received a new rental quotation from customer ${req.user?.name}.`
  }
);

    }


    return res
        .status(201)
        .json(new ApiResponse(201, createdQuotations, "Quotation(s) created successfully"));
});



export const getAllQuotationsForUser = asyncHandler(async (req: Request, res: Response) => {
    const query = req.user?.role === 'end_user' 
        ? { vendor: req.user?._id }
        : { createdBy: req.user?._id };

    const quotations = await Quotation. find(query)
        .populate('items.product', 'name images')
        .populate('vendor', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, quotations, "Quotations retrieved successfully"));
});


export const getQuotationByIdForUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const quotation = await Quotation.findById(id)
        // ✅ Make sure your .populate() call includes the address fields like this
        .populate({
            path: 'createdBy',
            select: 'name email address ' // Add your address fields here
        })
        .populate({
            path: 'vendor',
            select: 'name email'
        });

    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }

    // Security check... (rest of your code remains the same)
    // @ts-ignore
    const isBuyer = quotation.createdBy._id.toString() === req.user?._id.toString();
    // @ts-ignore
    const isVendor = quotation.vendor._id.toString() === req.user?._id.toString();

    if (!isBuyer && !isVendor) {
        throw new ApiError(403, "You are not authorized to view this quotation.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation retrieved successfully"));
});


export const updateQuotationStatusForUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the new status
    const validStatuses = ['approved', 'rejected', 'sent', 'cancelled_by_customer'];
    if (!status || !validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const quotation = await Quotation.findById(id).populate('createdBy vendor', 'name');
    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }
    //@ts-ignore
    const isVendor = quotation.vendor._id.toString() === req.user?._id.toString();
    //@ts-ignore
    const isBuyer = quotation.createdBy._id.toString() === req.user?._id.toString();

    // --- Permission Checks ---
    if (['approved', 'rejected'].includes(status) && !isVendor) {
        throw new ApiError(403, "Only the vendor can approve or reject this quotation.");
    }
    if (status === 'cancelled_by_customer' && !isBuyer) {
        throw new ApiError(403, "Only the customer who created the quotation can cancel it.");
    }

    // --- Update Status ---
    quotation.status = status;
    await quotation.save();

    // --- Send Notification to the Other Party ---
    const recipientId = isVendor ? quotation.createdBy._id : quotation.vendor._id;
const senderName = isVendor
    ? (quotation.vendor as any).name
    : (quotation.createdBy as any).name;

let notificationType: 
    | 'quotation_status_update'
    | 'quotation_cancelled_by_customer'
    | 'new_quotation' = 'quotation_status_update';

let notificationMessage = '';

switch (status) {
    case 'approved':
        notificationType = 'quotation_status_update';
        notificationMessage = `Your quotation #${quotation._id.toString().slice(-6)} was approved by ${senderName}.`;
        break;
    case 'rejected':
        notificationType = 'quotation_status_update';
        notificationMessage = `Your quotation #${quotation._id.toString().slice(-6)} was rejected by ${senderName}.`;
        break;
    case 'sent':
        notificationType = 'quotation_status_update';
        notificationMessage = `Your quotation #${quotation._id.toString().slice(-6)} has been sent by ${senderName}.`;
        break;
    case 'cancelled_by_customer':
        notificationType = 'quotation_cancelled_by_customer';
        notificationMessage = `Quotation #${quotation._id.toString().slice(-6)} was cancelled by ${senderName}.`;
        break;
}

// Send push/email notification
await sendNotification(
    recipientId.toString(),
    notificationType,
    {
        quotationId: quotation._id,
        status: quotation.status,
        message: notificationMessage,
    }
);

    return res
        .status(200)
        .json(new ApiResponse(200, quotation, "Quotation status updated successfully"));
});

export const deleteQuotationForUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Quotation ID");
    }
    if (!req.user) {
        throw new ApiError(401, "User not authenticated. Please log in.");
    }

    const queryConditions: any = {
        _id: id,
        status: 'draft' 
    };

    if (req.user.role === 'end_user') {
        queryConditions.vendor = req.user._id;
    } else if (req.user.role === 'customer') {
        queryConditions.createdBy = req.user._id;
    } else {
        throw new ApiError(403, "Your user role is not authorized to delete quotations.");
    }

    const quotation = await Quotation.findOneAndDelete(queryConditions);

    if (!quotation) {
        throw new ApiError(404, "Quotation not found, is not in 'draft' status, or you do not have permission to delete it.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { id }, "Quotation deleted successfully"));
});
export const approvedQuotationsProducts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Quotation ID");
    }
    if (!req.user) {
        throw new ApiError(401, "User not authenticated. Please log in.");
    }

    const quotation = await Quotation.findById(id).populate('products.product', 'name');

    if (!quotation) {
        throw new ApiError(404, "Quotation not found");
    }

    const approvedProducts = quotation.products.filter((product:any) => product.status === 'approved');

    return res
        .status(200)
        .json(new ApiResponse(200, approvedProducts, "Approved products retrieved successfully"));
});