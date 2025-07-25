import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { wrapAsync } from '../utils/error-utils.js';
import { confirmBooking, cancelBooking } from '../utils/payment-utils.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();

// Middleware specifically for parsing URL-encoded bodies for this route
const urlencodedParser = express.urlencoded({ extended: true });

router.post('/create-checkout-session', urlencodedParser, wrapAsync(async (req, res) => {
    
    const { bookingId, stripePriceId, bookingPrice } = req.body; 

    console.log("Creating checkout session with data:", req.body);
    
    if (!bookingId || !stripePriceId || !bookingPrice) {
        return res.status(400).json({ message: 'Missing required booking information.' });
    }
    if (!endpointSecret) {
        console.error("FATAL: STRIPE_WEBHOOK_SECRET is not set in environment variables.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    console.log(`Creating checkout session for booking ${bookingId} with price ID ${stripePriceId}`);
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: stripePriceId, 
                quantity: 1,
            },
        ],
        mode: 'payment',
        payment_method_types: ['card', 'revolut_pay'],
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
        success_url: `${process.env.CLIENT_URL}/confirmation/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/${bookingId}?cancelled=true`,
        metadata: {
            bookingId: bookingId,
        },
         payment_intent_data: {
            metadata: {
                bookingId: bookingId,
            },
        },
    });

    res.redirect(303, session.url);
}));

// Stripe Webhook Handler
// Use express.raw({type: 'application/json'}) to get the raw body for signature verification
router.post('/webhook', express.raw({type: 'application/json'}), wrapAsync(async (request, response) => {

  if (!endpointSecret) {
    console.error("Webhook Error: STRIPE_WEBHOOK_SECRET is not configured.");
    return response.status(500).send('Webhook configuration error.');
  }

  // Verify the webhook signature
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    // Construct the event using the raw body and signature
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }


  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
            return response.status(400).send('Webhook Error: Missing bookingId in metadata.');
        }

        try {
            await confirmBooking(bookingId);
            console.log(`Booking ${bookingId} confirmed successfully.`);
            response.status(200).send('Webhook received and booking confirmed.');
        } catch (error) {
            console.error(`Error confirming booking ${bookingId}:`, error);
            response.status(500).send('Webhook Error: Could not confirm booking.');
        }
        break;
        
    case 'checkout.session.expired':
        const expiredSession = event.data.object;
        const expiredBookingId = expiredSession.metadata?.bookingId;
        
        if (!expiredBookingId) {
            console.error('Webhook Error: Missing bookingId in expired session metadata');
            return response.status(400).send('Webhook Error: Missing bookingId in metadata.');
        }
        
        try {
            await cancelBooking(expiredBookingId);
            console.log(`Booking ${expiredBookingId} cancelled successfully.`);
            response.status(200).send('Webhook received and booking cancelled.');
        } catch (error) {
            console.error(`Error cancelling booking ${expiredBookingId}:`, error);
            response.status(500).send('Webhook Error: Could not cancel booking.');
        }
        break;
        
    default:
        console.log(`Unhandled event type ${event.type}`);
 }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
}));


export default router;