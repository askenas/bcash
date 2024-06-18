const Firestore = require('@google-cloud/firestore');
const firestore = new Firestore();


module.exports = [
    {
        method: 'GET',
        path: '/inventory',
        handler: async (request, h) => {
            try {
                const userId = request.query.userId;
    
                // Fetch inventory items for the given userId
                const inventoryRef = firestore.collection('users').where('userId', '==', userId);
                const inventorySnapshot = await inventoryRef.get();
                const inventory = inventorySnapshot.docs.map(doc => doc.data());
    
                // Extract productIds from inventory
                const productIds = inventory.map(item => item.userId);
    
                // Fetch product information for the productIds
                const productsRef = firestore.collection('products').where('userId', 'in', productIds);
                const productsSnapshot = await productsRef.get();
                const products = productsSnapshot.docs.map(doc => doc.data());
    
                return h.response({ error: false, message: "Data obtained successfully", products }).code(200);
            } catch (error) {
                console.error('Error fetching inventory and products:', error);
                return h.response({ error: true, message: "Internal Server Error" }).code(500);
            }
        }
    },
    {
        method: 'DELETE',
        path: '/inventory',
        handler: async (request, h) => {
            try {
                const { userId, productId } = request.query;

                // Find the document to delete
                const inventoryRef = firestore.collection('products')
                    .where('userId', '==', userId)
                    .where('productId', '==', productId);

                const snapshot = await inventoryRef.get();

                if (snapshot.empty) {
                    return h.response({ error: true, message: 'Inventory item not found' }).code(404);
                }

                // Delete the document
                const batch = firestore.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();

                return h.response({ error: false, message: 'Removed from inventory' });
            } catch (err) {
                console.error('Error occurred:', err); // Enhanced logging
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        }
    }
];
