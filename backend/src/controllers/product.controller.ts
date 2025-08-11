import { Request, Response } from 'express';
import { any, z } from 'zod';
import mongoose, { FilterQuery, PipelineStage, SortOrder } from 'mongoose';
import { Product, ProductDocument, ProductValidationSchema } from '../models/product.model';
import { Reservation } from '../models/reservation.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { uploadOnCloudinary } from '../utils/cloudinary';

type CreateProductBody = z.infer<typeof ProductValidationSchema>;

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    // Convert strings from form-data into correct types
    const parsedBody = {
        ...req.body,
        stock: Number(req.body.stock),
        pricing: {
            pricePerHour: req.body["pricing.pricePerHour"] ? Number(req.body["pricing.pricePerHour"]) : undefined,
            pricePerDay: req.body["pricing.pricePerDay"] ? Number(req.body["pricing.pricePerDay"]) : undefined,
            pricePerWeek: req.body["pricing.pricePerWeek"] ? Number(req.body["pricing.pricePerWeek"]) : undefined,
        }
    };

    const validationResult = ProductValidationSchema.omit({ images: true, createdBy: true }).safeParse(parsedBody);
    if (!validationResult.success) {
        throw new ApiError(400, "Invalid product data", validationResult.error.errors);
    }
    
    const productData = validationResult.data;

    // --- Image Upload Logic ---
    const imageFiles = req.files as Express.Multer.File[];
    if (!imageFiles || imageFiles.length === 0) {
        throw new ApiError(400, "At least one product image is required");
    }

    const imageUrls: string[] = [];
    for (const file of imageFiles) {
        const cloudinaryResponse = await uploadOnCloudinary(file.path);
        if (cloudinaryResponse) {
            imageUrls.push(cloudinaryResponse.secure_url);
        }
    }
    
    if (imageUrls.length === 0) {
        throw new ApiError(500, "Failed to upload images");
    }


    const product = await Product.create({
        ...productData,
        images: imageUrls,
        createdBy: req.user?._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});



export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
        search,
        category,
        availability,
        sortBy = 'createdAt',
        order = 'desc',
        page: pageStr = '1',
        limit: limitStr = '10'
    } = req.query;

    const page = parseInt(pageStr as string, 10);
    const limit = parseInt(limitStr as string, 10);
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ProductDocument> = {};

    if (search && typeof search === 'string') {
        const searchRegex = { $regex: search, $options: 'i' };
        filter.$or = [{ name: searchRegex }, { description: searchRegex }, { sku: searchRegex }];
    }

    if (category && typeof category === 'string') {
        if (!mongoose.Types.ObjectId.isValid(category)) {
            throw new ApiError(400, 'Invalid category ID format');
        }
        filter.category = new mongoose.Types.ObjectId(category);
    }

    if (availability === 'in-stock') {
        filter.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
        filter.stock = { $eq: 0 };
    }

    const aggregationPipeline: PipelineStage[] = [
        { $match: filter },

        {
            $lookup: {
                from: 'categories', 
                localField: 'category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },

        {
            $unwind: {
                path: '$categoryInfo',
                preserveNullAndEmptyArrays: true 
            }
        },
        
        {
            $facet: {
                paginatedResults: [
                    { $sort: { [sortBy as string]: order === 'asc' ? 1 : -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            sku: 1,
                            description: 1,
                            images: 1,
                            stock: 1,
                            unit: 1,
                            pricing: 1,
                            taxPercent: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            category: { _id: '$categoryInfo._id', name: '$categoryInfo.name' }
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ];

    const result = await Product.aggregate(aggregationPipeline);

    const products = result[0].paginatedResults;
    const totalProducts = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json(new ApiResponse(200, {
        products,
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            limit
        }
    }, 'Products fetched successfully'));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid product ID');
    }

    const product = await Product.findById(id).populate('category', 'name');

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, 'Product fetched successfully'));
});


export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const productToUpdate = await Product.findById(id);

    if (!productToUpdate) {
        throw new ApiError(404, 'Product not found');
    }
    //@ts-ignore
    if (productToUpdate.createdBy.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this product.");
    }

    const parsedBody = ProductValidationSchema.partial().safeParse(req.body);
    console.log("Parsed Body:", parsedBody);
    if (!parsedBody.success) {
        throw new ApiError(400, 'Invalid update data', parsedBody.error.errors);
    }

    const updateData = parsedBody.data;

    if (updateData.name || updateData.sku) {
        const conflictQuery = [];
        if (updateData.name) conflictQuery.push({ name: updateData.name });
        if (updateData.sku) conflictQuery.push({ sku: updateData.sku });

        const existingProduct = await Product.findOne({
            _id: { $ne: id }, 
            $or: conflictQuery,
        });

        if (existingProduct) {
            const conflictField = existingProduct.name === updateData.name ? `name '${updateData.name}'` : `SKU '${updateData.sku}'`;
            throw new ApiError(409, `Product with ${conflictField} already exists.`);
        }
    }

    const product = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, 'Product updated successfully'));
});


export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
      const productToDelete = await Product.findById(id);

    if (!productToDelete) {
        throw new ApiError(404, 'Product not found');
    }
    //@ts-ignore
    if (productToDelete.createdBy.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this product.");
    }

    // Check for active reservations before deleting
    const activeReservation = await Reservation.findOne({
        'items.product': id,
        'status': { $in: ['Reserved', 'PickedUp'] }
    });

    if (activeReservation) {
        throw new ApiError(400, 'Cannot delete product with active reservations. Please resolve existing orders first.');
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { id }, 'Product deleted successfully'));
});

const AvailabilityQuerySchema = z.object({
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    quantity: z.string().regex(/^\d+$/).default('1').transform(Number),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ['endDate'],
});


export const checkProductAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid product ID');
    }

    const product = await Product.findById(id).select('stock maintenanceBlocks');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    const { startDate, endDate } = req.query;

    // SCENARIO 1: A specific date range is provided for a future booking.
    if (startDate && endDate) {
        const queryParseResult = AvailabilityQuerySchema.safeParse(req.query);
        if (!queryParseResult.success) {
            throw new ApiError(400, "Invalid query parameters", queryParseResult.error.errors);
        }

        const { quantity: requestedQuantity } = queryParseResult.data;
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        // Check for maintenance block conflicts
        const inMaintenance = product.maintenanceBlocks.some((block: any) =>
            block.start < end && block.end > start
        );

        if (inMaintenance) {
            return res.status(200).json(new ApiResponse(200, {
                available: false,
                reason: 'Product is scheduled for maintenance during this period.',
                availableStock: 0
            }, 'Product is in maintenance'));
        }

        // Find items reserved during the specified period
        const reservedCountPipeline: PipelineStage[] = [
            {
                $match: {
                    'items.product': new mongoose.Types.ObjectId(id),
                    status: { $nin: ['Returned', 'Cancelled'] },
                    startDate: { $lt: end },
                    endDate: { $gt: start }
                }
            },
            { $unwind: '$items' },
            { $match: { 'items.product': new mongoose.Types.ObjectId(id) } },
            { $group: { _id: null, totalReserved: { $sum: '$items.quantity' } } }
        ];

        const reservationResult = await Reservation.aggregate(reservedCountPipeline);
        const reservedCount = reservationResult[0]?.totalReserved || 0;
        const availableStock = product.stock - reservedCount;
        const isAvailable = availableStock >= requestedQuantity;

        return res.status(200).json(new ApiResponse(200, {
            available: isAvailable,
            reason: isAvailable ? 'Product is available for the selected dates.' : `Insufficient stock. Only ${availableStock} units are available for this period.`,
            availableStock
        }, 'Availability check for date range successful'));
    }
    
    // SCENARIO 2: No date range provided. Check CURRENT availability.
    else {
        // Find items that are currently in an active reservation status
        const reservedCountPipeline: PipelineStage[] = [
            {
                $match: {
                    'items.product': new mongoose.Types.ObjectId(id),
                    'status': { $in: ['Reserved', 'PickedUp'] } // Active statuses
                }
            },
            { $unwind: '$items' },
            { $match: { 'items.product': new mongoose.Types.ObjectId(id) } },
            { $group: { _id: null, totalReserved: { $sum: '$items.quantity' } } }
        ];

        const reservationResult = await Reservation.aggregate(reservedCountPipeline);
        const reservedCount = reservationResult[0]?.totalReserved || 0;
        const availableStock = product.stock - reservedCount;

        return res.status(200).json(new ApiResponse(200, {
            available: availableStock > 0,
            reason: 'Current product availability.',
            totalStock: product.stock,
            currentlyReserved: reservedCount,
            availableStock: availableStock,
        }, 'Current product availability fetched successfully'));
    }
});
export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
        search,
        category,
        availability,
        sortBy = 'createdAt',
        order = 'desc',
        page: pageStr = '1',
        limit: limitStr = '10'
    } = req.query;

    const page = parseInt(pageStr as string, 10);
    const limit = parseInt(limitStr as string, 10);
    const skip = (page - 1) * limit;

    
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User not found in request.");
    }
    const filter: FilterQuery<ProductDocument> = { createdBy: req.user._id };

    if (search && typeof search === 'string') {
        const searchRegex = { $regex: search, $options: 'i' };
        // This $or will be combined with the createdBy filter via an implicit AND
        filter.$or = [{ name: searchRegex }, { description: searchRegex }, { sku: searchRegex }];
    }
    if (category && typeof category === 'string') {
        if (!mongoose.Types.ObjectId.isValid(category)) {
            throw new ApiError(400, 'Invalid category ID format');
        }
        filter.category = new mongoose.Types.ObjectId(category);
    }
    if (availability === 'in-stock') {
        filter.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
        filter.stock = { $eq: 0 };
    }

    const products = await Product.find(filter)
        .populate('category', 'name')
        .sort({ [sortBy as string]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(); // Use .lean() for faster read-only queries

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json(new ApiResponse(200, {
        products,
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            limit
        }
    }, 'Your products fetched successfully'));
});