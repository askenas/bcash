// routes/trade.js
const Joi = require('joi');
const jwt = require('../jwt');
const Firestore = require('@google-cloud/firestore');
const firestore = new Firestore();

module.exports = [
    {
        method: 'POST',
        path: '/trade-request',
        handler: async (request, h) => {
            const token = request.headers.authorization;
            const decoded = jwt.verifyToken(token);
            if (!decoded) {
                return h.response({ error: true, message: 'Invalid token' }).code(401);
            }

            const { itemId1, itemId2, username1, username2 } = request.payload;
            const tradeRef = firestore.collection('trade-requests').doc();
            await tradeRef.set({
                itemId1, itemId2, username1, username2, status: 'pending'
            });
            return h.response({error: false, message: 'Trade request created' });
        },
        options: {
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required()
                }).options({ allowUnknown: true }),
                payload: Joi.object({
                    itemId1: Joi.string().required(),
                    itemId2: Joi.string().required(),
                    username1: Joi.string().required(),
                    username2: Joi.string().required()
                })
            }
        }
    },
    {
        method: 'PATCH',
        path: '/trade-request/{trade_id}/confirm',
        handler: async (request, h) => {
            const token = request.headers.authorization;
            const decoded = jwt.verifyToken(token);
            if (!decoded) {
                return h.response({ error: 'Invalid token' }).code(401);
            }

            const { trade_id } = request.params;
            const { userId, confirmed } = request.payload;
            const tradeRef = firestore.collection('trade-requests').doc(trade_id);
            await tradeRef.update({
                [`confirmations.${userId}`]: confirmed
            });
            return h.response({ message: 'Trade request updated' });
        },
        options: {
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required()
                }).options({ allowUnknown: true }),
                payload: Joi.object({
                    userId: Joi.string().required(),
                    confirmed: Joi.boolean().required()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/trade-request/{trade_id}',
        handler: async (request, h) => {
            const token = request.headers.authorization;
            const decoded = jwt.verifyToken(token);
            if (!decoded) {
                return h.response({ error: 'Invalid token' }).code(401);
            }

            const { trade_id } = request.params;
            const tradeRef = firestore.collection('trade-requests').doc(trade_id);
            const doc = await tradeRef.get();
            if (!doc.exists) {
                return h.response({ error: 'Trade request not found' }).code(404);
            }
            return h.response(doc.data());
        },
        options: {
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required()
                }).options({ allowUnknown: true }),
                params: Joi.object({
                    trade_id: Joi.string().required()
                })
            }
        }
    }
];
