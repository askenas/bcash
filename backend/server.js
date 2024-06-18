// server.js
const Hapi = require('@hapi/hapi');
const Firestore = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

// Initialize Firestore
const firestore = new Firestore();

// Initialize Cloud Storage
const storage = new Storage();
const bucket = storage.bucket('test-bcash');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const profileRoutes = require('./routes/profile');
const tradeRoutes = require('./routes/trade');
const wishlistRoutes = require('./routes/wishlist');
const inventoryRoutes = require('./routes/inventory');

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0'
    });

    // Register routes
    server.route([...authRoutes, ...productRoutes, ...profileRoutes, ...tradeRoutes, ...wishlistRoutes, ...inventoryRoutes]);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
