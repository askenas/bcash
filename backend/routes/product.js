const Joi = require('joi');
const jwt = require('../jwt'); // Ensure this path is correct
const Firestore = require('@google-cloud/firestore');
const firestore = new Firestore();
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('test-bcash');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { error } = require('console');


module.exports = [
    {
        method: 'POST',
        path: '/product',
        options: {
            payload: {
                output: 'stream',
                parse: true,
                multipart: true
            },
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required()
                }).options({ allowUnknown: true }),
                payload: Joi.object({
                    product: Joi.string().required(),
                    description: Joi.string().required(),
                    condition: Joi.string().required(),
                    category: Joi.string().required(),
                    price: Joi.string().required(),
                    photo: Joi.any().required(),
                    username: Joi.string().required(),
                    userId: Joi.string().required(),
                })
            }
        },
        handler: async (request, h) => {
            try {
                const token = request.headers.authorization;
                const { product, description, condition, category, price, photo, username, userId } = request.payload;
        
                // Verify JWT token
                const decoded = jwt.verifyToken(token);
                if (!decoded) {
                    return h.response({ error: 'Invalid token' }).code(401);
                }
        
                // Remove unnecessary double quotes around data values
                const cleanedProduct = product.replace(/^"(.*)"$/, '$1');
                const cleanedCondition = condition.replace(/^"(.*)"$/, '$1');
                const cleanedCategory = category.replace(/^"(.*)"$/, '$1');
                const cleanedPrice = price.replace(/^"(.*)"$/, '$1');
                const cleanedUsername = username.replace(/^"(.*)"$/, '$1');
                const cleanedUserId = userId.replace(/^"(.*)"$/, '$1');
        
                // Upload file to Google Cloud Storage bucket
                const productId = `product-${uuidv4()}`;
                const photoFile = photo.hapi;
                const filename = `${productId}-${photoFile.filename}`;
                const fileStream = photo;
        
                const file = bucket.file(`productImage/${filename}`);
                await new Promise((resolve, reject) => {
                    fileStream.pipe(file.createWriteStream())
                        .on('error', reject)
                        .on('finish', resolve);
                });
        
                // Construct URL for the uploaded image
                const imageUrl = `https://backend-y2k4wvszia-et.a.run.app/productImage/${filename}`;
        
                // Save image URL to Firestore
                const productRef = firestore.collection('products').doc();
                await productRef.set({
                    productId,
                    product: cleanedProduct,
                    description,
                    condition: cleanedCondition,
                    category: cleanedCategory,
                    price: cleanedPrice,
                    username: cleanedUsername,
                    userId: cleanedUserId,
                    photoUrl: imageUrl
                });
        
                return h.response({ error: false, message: 'Product added successfully', photoUrl: imageUrl });
            } catch (err) {
                console.error('Error occurred:', err); // Enhanced logging
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/product',
        handler: async (request, h) => {
            try {
                // Extract and parse query parameters
                const page = parseInt(request.query.page, 10);
                const size = parseInt(request.query.size, 10);
    
                // Validate parsed values
                if (isNaN(page) || page <= 0) {
                    return h.response({ error: true, message: 'Invalid page number' }).code(400);
                }
    
                if (isNaN(size) || size <= 0) {
                    return h.response({ error: true, message: 'Invalid size number' }).code(400);
                }
    
                const { category, search } = request.query;
                let query = firestore.collection('products');
    
                // Apply category filter if provided
                if (category) {
                    query = query.where('category', '==', category);
                }
    
                // Apply search filter if provided
                if (search) {
                    query = query.where('product', '>=', search).where('product', '<=', search + '\uf8ff');
                }
    
                // Execute the query with offset and limit
                const snapshot = await query.offset((page - 1) * size).limit(size).get();
                const products = snapshot.docs.map(doc => doc.data());
    
                // Return the fetched products
                return h.response({ error: false, message: 'Products fetched successfully', products });
            } catch (err) {
                console.error('Error occurred:', err); // Enhanced logging
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/productImage/{filename}',
        handler: async (request, h) => {
            try {
                const { filename } = request.params;
                const file = bucket.file(`productImage/${filename}`);

                const [exists] = await file.exists();
                if (!exists) {
                    return h.response({ error: true, message: 'File not found' }).code(404);
                }

                const stream = file.createReadStream();
                return h.response(stream).type('image/jpeg');
            } catch (err) {
                console.error('Error occurred:', err);
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        }
    }
];