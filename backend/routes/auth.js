const Joi = require('joi');
const jwt = require('../jwt');
const Firestore = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

const firestore = new Firestore();

module.exports = [
    {
        method: 'POST',
        path: '/login',
        handler: async (request, h) => {
            const { email, password } = request.payload;
            const snapshot = await firestore.collection('users').where('email', '==', email).where('password', '==', password).get();
            if (snapshot.empty) {
                return h.response({ error: true, message:'Invalid email or password' }).code(401);
            }

            const user = snapshot.docs[0].data();
            const token = jwt.generateToken({ userId: user.userId, email: user.email });

            return h.response({
                error: false,
                    message: 'success',
                    loginResult: {
                        userId: user.userId,
                        name: user.name,
                        token
                    }
            });
        },
        options: {
            auth: false,
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().required()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/register',
        handler: async (request, h) => {
            const { name, email, phone, address, password } = request.payload;
            const userRef = firestore.collection('users').doc(email);
            const doc = await userRef.get();
            if (doc.exists) {
                return h.response({ error: true, message: 'Email already exists' }).code(400);
            }
            const userId = `user-${uuidv4()}`;
            await userRef.set({ userId, name, email, phone, address, password });
            return { error: false, message: 'User Created' };
        },
        options: {
            auth: false,
            validate: {
                payload: Joi.object({
                    name: Joi.string().required(),
                    email: Joi.string().email().required(),
                    phone: Joi.string().required(),
                    address: Joi.string().required(),
                    password: Joi.string().required()
                })
            }
        }
    }
];
