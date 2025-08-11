import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Pricelist } from '../models/pricelist.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

/**
 * @desc    Create a new pricelist
 * @route   POST /api/v1/pricelists
 * @access  Private (Customer only)
 */
export const createPricelist = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, appliesToCustomers, start, end, overrides, priority } = req.body;

    if (!name || !overrides || overrides.length === 0) {
        throw new ApiError(400, "Name and at least one override are required.");
    }

    const pricelist = await Pricelist.create({
        name,
        description,
        appliesToCustomers,
        start,
        end,
        overrides,
        priority
    });

    return res
        .status(201)
        .json(new ApiResponse(201, pricelist, "Pricelist created successfully"));
});

/**
 * @desc    Get all pricelists
 * @route   GET /api/v1/pricelists
 * @access  Private (Customer only)
 */
export const getAllPricelists = asyncHandler(async (req: Request, res: Response) => {
    const pricelists = await Pricelist.find({})
        .populate('appliesToCustomers', 'name email')
        .populate('overrides.product', 'name sku')
        .sort({ priority: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, pricelists, "Pricelists retrieved successfully"));
});

/**
 * @desc    Get a single pricelist by its ID
 * @route   GET /api/v1/pricelists/:id
 * @access  Private (Customer only)
 */
export const getPricelistById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const pricelist = await Pricelist.findById(id)
        .populate('appliesToCustomers', 'name email')
        .populate('overrides.product', 'name sku');
        
    if (!pricelist) {
        throw new ApiError(404, "Pricelist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pricelist, "Pricelist retrieved successfully"));
});

/**
 * @desc    Update a pricelist
 * @route   PATCH /api/v1/pricelists/:id
 * @access  Private (Customer only)
 */
export const updatePricelist = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricelist = await Pricelist.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });

    if (!pricelist) {
        throw new ApiError(404, "Pricelist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, pricelist, "Pricelist updated successfully"));
});

/**
 * @desc    Delete a pricelist
 * @route   DELETE /api/v1/pricelists/:id
 * @access  Private (Customer only)
 */
export const deletePricelist = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricelist = await Pricelist.findByIdAndDelete(id);

    if (!pricelist) {
        throw new ApiError(404, "Pricelist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Pricelist deleted successfully"));
});