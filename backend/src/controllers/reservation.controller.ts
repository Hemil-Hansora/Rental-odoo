import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reservation } from '../models/reservation.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';


export const getAllReservations = asyncHandler(async (req: Request, res: Response) => {
    const { productId, orderId, status } = req.query;
    
    const filter: any = {};

    if (productId && mongoose.Types.ObjectId.isValid(productId as string)) {
        filter.product = productId;
    }
    if (orderId && mongoose.Types.ObjectId.isValid(orderId as string)) {
        filter.order = orderId;
    }
    if (status) {
        filter.status = status;
    }

    const reservations = await Reservation.find(filter)
        .populate('product', 'name sku')
        .populate({
            path: 'order',
            select: 'customer status',
            populate: { path: 'customer', select: 'name' }
        })
        .sort({ start: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, reservations, "Reservations retrieved successfully"));
});


export const getReservationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Reservation ID");
    }

    const reservation = await Reservation.findById(id)
        .populate('product')
        .populate('order');

    if (!reservation) {
        throw new ApiError(404, "Reservation not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, reservation, "Reservation retrieved successfully"));
});