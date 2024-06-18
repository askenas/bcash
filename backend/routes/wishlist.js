const Firestore = require('@google-cloud/firestore');
const firestore = new Firestore();


module.exports = [
    {
        method: 'GET',
        path: '/wishlist',
        handler: async (request, h) => {
            try {
                const userId = request.query.userId;
    
                // Fetch wishlist items for the given userId
                const wishlistRef = firestore.collection('wishlists').where('userId', '==', userId);
                const wishlistSnapshot = await wishlistRef.get();
                const wishlist = wishlistSnapshot.docs.map(doc => doc.data());
    
                // Extract productIds from wishlist
                const productIds = wishlist.map(item => item.productId);
    
                // Fetch product information for the productIds
                const productsRef = firestore.collection('products').where('productId', 'in', productIds);
                const productsSnapshot = await productsRef.get();
                const products = productsSnapshot.docs.map(doc => doc.data());
    
                return h.response({ error: false, message: "Data obtained successfully", products }).code(200);
            } catch (error) {
                console.error('Error fetching wishlist and products:', error);
                return h.response({ error: true, message: "Internal Server Error" }).code(500);
            }
        }
    },
    {
        method: 'POST',
        path: '/wishlist',
        handler: async (request, h) => {
            try {
                const { userId, productId } = request.payload;
                const wishlistRef = firestore.collection('wishlists').doc();
                await wishlistRef.set({
                    userId, productId
                });
                return h.response({ error: false, message: 'Added to wishlist' });
            } catch (err) {
                console.error('Error occurred:', err); // Enhanced logging
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        }
    },
    {
        method: 'DELETE',
        path: '/wishlist',
        handler: async (request, h) => {
            try {
                const { userId, productId } = request.query;

                // Find the document to delete
                const wishlistRef = firestore.collection('wishlists')
                    .where('userId', '==', userId)
                    .where('productId', '==', productId);

                const snapshot = await wishlistRef.get();
                
                if (snapshot.empty) {
                    return h.response({ error: true, message: 'Wishlist item not found' }).code(404);
                }

                // Delete the document
                const batch = firestore.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();

                return h.response({ error: false, message: 'Removed from wishlist' });
            } catch (err) {
                console.error('Error occurred:', err); // Enhanced logging
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        }
    }
];
