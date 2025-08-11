import { Request, Response } from 'express';
import { TimeDependentPriceRule, TimeDependentPriceRuleValidationSchema } from '../models/timeDependentPriceRule.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse'

/**
 * @desc    Create a new time-dependent price rule
 * @route   POST /api/v1/timed-rules
 * @access  Private (End User / Vendor only)
 */
export const createTimeDependentPriceRule = asyncHandler(async (req: Request, res: Response) => {
    // Note: You would add a 'createdBy' field to your model to associate this rule with a vendor.
    // For now, we'll proceed without it, assuming it's a global rule managed by an admin-like user.
    const validationResult = TimeDependentPriceRuleValidationSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ApiError(400, "Invalid rule data", validationResult.error.errors);
    }

    const rule = await TimeDependentPriceRule.create(validationResult.data);

    return res
        .status(201)
        .json(new ApiResponse(201, rule, "Time-dependent price rule created successfully"));
});

/**
 * @desc    Get all time-dependent price rules
 * @route   GET /api/v1/timed-rules
 * @access  Private (End User / Vendor only)
 */
export const getAllTimeDependentPriceRules = asyncHandler(async (req: Request, res: Response) => {
    // Add filtering by createdBy if you add that field to the model
    const rules = await TimeDependentPriceRule.find({})
        .populate('appliesToProducts', 'name sku')
        .sort({ priority: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, rules, "Rules retrieved successfully"));
});

/**
 * @desc    Get a single rule by its ID
 * @route   GET /api/v1/timed-rules/:id
 * @access  Private (End User / Vendor only)
 */
export const getTimeDependentPriceRuleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const rule = await TimeDependentPriceRule.findById(id).populate('appliesToProducts', 'name sku');
        
    if (!rule) {
        throw new ApiError(404, "Price rule not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, rule, "Rule retrieved successfully"));
});

/**
 * @desc    Update a time-dependent price rule
 * @route   PATCH /api/v1/timed-rules/:id
 * @access  Private (End User / Vendor only)
 */
export const updateTimeDependentPriceRule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const rule = await TimeDependentPriceRule.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });

    if (!rule) {
        throw new ApiError(404, "Price rule not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, rule, "Rule updated successfully"));
});

/**
 * @desc    Delete a time-dependent price rule
 * @route   DELETE /api/v1/timed-rules/:id
 * @access  Private (End User / Vendor only)
 */
export const deleteTimeDependentPriceRule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const rule = await TimeDependentPriceRule.findByIdAndDelete(id);

    if (!rule) {
        throw new ApiError(404, "Price rule not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Rule deleted successfully"));
});