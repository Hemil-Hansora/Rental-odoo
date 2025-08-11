import { Request, Response } from 'express';
import slugify from 'slugify';
import { Category, CategoryValidationSchema } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, parentCategory } = req.body;

    if (!name) {
        throw new ApiError(400, 'Category name is required');
    }

    // Check if category with the same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        throw new ApiError(409, `Category '${name}' already exists.`);
    }
    
    // Create a URL-friendly slug
    const slug = slugify(name, { lower: true, strict: true });

    const category = await Category.create({
        name,
        slug,
        description,
        parentCategory
    });

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});


export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    // Populate the parent category to show nested structure
    const categories = await Category.find({}).populate('parentCategory', 'name slug');

    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});


export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"));
});



export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, parentCategory } = req.body;

    const updateData: { [key: string]: any } = { description, parentCategory };

    if (name) {
        updateData.name = name;
        updateData.slug = slugify(name, { lower: true, strict: true });
    }

    const category = await Category.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});



export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if any product is using this category
    const productInCategory = await Product.findOne({ category: id });
    if (productInCategory) {
        throw new ApiError(400, 'Cannot delete category. It is currently associated with one or more products.');
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Category deleted successfully'));
});