// routes/profile.js
const Joi = require('joi');
const jwt = require('../jwt');
const Firestore = require('@google-cloud/firestore');
const firestore = new Firestore();

module.exports = [
    {
        method: 'GET',
        path: '/profile',
        handler: async (request, h) => {
            try {
                const token = request.headers.authorization;
                const decoded = jwt.verifyToken(token);
                if (!decoded) {
                    return h.response({ error: true, message: 'Invalid token' }).code(401);
                }
                const { userId } = decoded;
                const userRef = firestore.collection('users').where('userId', '==', userId);
                const snapshot = await userRef.get();

                // Check if any documents were found
                if (snapshot.empty) {
                    return h.response({ error: true, message: 'User not found' }).code(404);
                }

                // Get the first document's data
                const userDoc = snapshot.docs[0];
                const profile = userDoc.data();
                delete profile.password; // Remove the password field

                return h.response({ error: false, message: 'Profile data retrieved successfully', profile }).code(200);
            } catch (err) {
                console.error('Error occurred:', err); // Enhanced logging
                return h.response({ message: 'Internal Server Error', error: err.message }).code(500);
            }
        },
        options: {
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required()
                }).options({ allowUnknown: true })
            }
        }
    }
];