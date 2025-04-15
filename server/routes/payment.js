import express from 'express';
import { wrapAsync } from '../server-utils.js';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const { STRIPE_SECRET_KEY } = process.env;
const stripe = new Stripe(STRIPE_SECRET_KEY);

const router = express.Router();

router.post('/create-checkout-session', wrapAsync(async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: 'price_1PosIx2L5EDIb9ci6Evzlxjs',
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: 'http://localhost:8080/confirmation?success=true',//`${YOUR_DOMAIN}?success=true`,
        cancel_url: 'http://localhost:8080/confirmation?cancelled=true'//`${YOUR_DOMAIN}?canceled=true`,
    });

    res.redirect(303, session.url);
}));

export default router;