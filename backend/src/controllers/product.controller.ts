import { Request, Response } from 'express';
import { any, z } from 'zod';
import mongoose, { FilterQuery, PipelineStage, SortOrder } from 'mongoose';
import { Product, ProductDocument, ProductValidationSchema } from '../models/product.model.js';
import { Reservation } from '../models/reservation.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

type CreateProductBody = z.infer<typeof ProductValidationSchema>;

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = ProductValidationSchema.omit({ images: true }).safeParse(req.body);
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
    // --- End of Image Upload Logic ---


    const product = await Product.create({
        ...productData,
        images: imageUrls, // Add the array of image URLs
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid product ID');
    }

    const parsedBody = ProductValidationSchema.partial().safeParse(req.body);
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid product ID');
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

    const queryParseResult = AvailabilityQuerySchema.safeParse(req.query);
    if (!queryParseResult.success) {
        throw new ApiError(400, "Invalid query parameters", queryParseResult.error.errors);
    }
    const { startDate, endDate, quantity: requestedQuantity } = queryParseResult.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const product = await Product.findById(id).select('stock maintenanceBlocks');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    const inMaintenance = product.maintenanceBlocks.some((block:any) =>
        block.start < end && block.end > start
    );

    if (inMaintenance) {
        return res.status(200).json(new ApiResponse(200, {available: false,reason: 'Product is scheduled for maintenance during this period.',availableStock: 0}, 'Availability check successful'));
    }

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
        {
            $match: {
                'items.product': new mongoose.Types.ObjectId(id)
            }
        },
        {
            $group: {
                _id: null, // Group all matched items together
                totalReserved: { $sum: '$items.quantity' }
            }
        }
    ];

    const reservationResult = await Reservation.aggregate(reservedCountPipeline);
    const reservedCount = reservationResult[0]?.totalReserved || 0;

    // 5. Determine final availability
    const availableStock = product.stock - reservedCount;
    const isAvailable = availableStock >= requestedQuantity;

    return res.status(200).json(new ApiResponse(200, {
        available: isAvailable,
        reason: isAvailable ? 'Product is available.' : `Insufficient stock. Only ${availableStock} units are available for this period.`,
        availableStock
    }, 'Availability check successful'));
});