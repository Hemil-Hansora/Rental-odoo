import { Request, Response } from 'express';
import { DiscountRule, DiscountRuleValidationSchema } from '../models/discountRule.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

/**
 * @desc    Create a new discount rule/coupon
 * @route   POST /api/v1/discounts
 * @access  Private (End User / Vendor only)
 */
export const createDiscount = asyncHandler(async (req: Request, res: Response) => {
    // Manually add the creator's ID before validation
    const discountData = { ...req.body, createdBy: req.user?._id };

    const validationResult = DiscountRuleValidationSchema.safeParse(discountData);
    if (!validationResult.success) {
        throw new ApiError(400, "Invalid discount data", validationResult.error.errors);
    }
    
    // Check if a coupon with the same code already exists for this user
    const existingCode = await DiscountRule.findOne({
        code: validationResult.data.code,
        createdBy: req.user?._id
    });

    if (existingCode) {
        throw new ApiError(409, `You already have a discount with the code '${validationResult.data.code}'.`);
    }

    const discount = await DiscountRule.create(validationResult.data);

    return res
        .status(201)
        .json(new ApiResponse(201, discount, "Discount rule created successfully"));
});

/**
 * @desc    Get all discounts created by the logged-in vendor
 * @route   GET /api/v1/discounts
 * @access  Private (End User / Vendor only)
 */
export const getMyDiscounts = asyncHandler(async (req: Request, res: Response) => {
    const discounts = await DiscountRule.find({ createdBy: req.user?._id })
        .populate('appliesToProducts', 'name sku')
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, discounts, "Discounts retrieved successfully"));
});

/**
 * @desc    Update a discount rule
 * @route   PATCH /api/v1/discounts/:id
 * @access  Private (End User / Vendor only)
 */
export const updateDiscount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const discount = await DiscountRule.findOne({ _id: id, createdBy: req.user?._id });
    if (!discount) {
        throw new ApiError(404, "Discount not found or you do not have permission to edit it.");
    }
    
    // Ensure the code isn't updated to a conflicting one
    if (req.body.code && req.body.code !== discount.code) {
        const existingCode = await DiscountRule.findOne({ code: req.body.code, createdBy: req.user?._id });
        if (existingCode) {
            throw new ApiError(409, `You already have a discount with the code '${req.body.code}'.`);
        }
    }

    const updatedDiscount = await DiscountRule.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedDiscount, "Discount updated successfully"));
});

/**
 * @desc    Delete a discount rule
 * @route   DELETE /api/v1/discounts/:id
 * @access  Private (End User / Vendor only)
 */
export const deleteDiscount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const discount = await DiscountRule.findOneAndDelete({ _id: id, createdBy: req.user?._id });
    if (!discount) {
        throw new ApiError(404, "Discount not found or you do not have permission to delete it.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Discount deleted successfully"));
});

/**
 * @desc    Validate and apply a discount code
 * @route   POST /api/v1/discounts/apply
 * @access  Private (Customer only)
 */
export const applyDiscountCode = asyncHandler(async (req: Request, res: Response) => {
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
        throw new ApiError(400, "Coupon code and subtotal are required.");
    }

    const discount = await DiscountRule.findOne({ code: code.toUpperCase() });
    
    // --- Validation Checks ---
    if (!discount) {
        throw new ApiError(404, "Invalid coupon code.");
    }
    if (discount.validFrom && discount.validFrom > new Date()) {
        throw new ApiError(400, "This coupon is not yet active.");
    }
    if (discount.validUntil && discount.validUntil < new Date()) {
        throw new ApiError(400, "This coupon has expired.");
    }
    if (discount.usageLimit && discount.timesUsed >= discount.usageLimit) {
        throw new ApiError(400, "This coupon has reached its usage limit.");
    }
    if (discount.minSpend && subtotal < discount.minSpend) {
        throw new ApiError(400, `You must spend at least ${discount.minSpend} to use this coupon.`);
    }

    // --- Calculate Discount ---
    let discountAmount = 0;
    if (discount.type === 'percent') {
        discountAmount = (subtotal * discount.value) / 100;
    } else { // 'fixed'
        discountAmount = discount.value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return res.status(200).json(new ApiResponse(200, {
        discountId: discount._id,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        message: "Coupon applied successfully!"
    }, "Discount validation successful"));
});