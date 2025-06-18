import express from 'express';
import { wrapAsync } from '../utils/error-utils.js';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Booking } from '../models.js'; // Import Booking model

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();

// Middleware specifically for parsing URL-encoded bodies for this route
const urlencodedParser = express.urlencoded({ extended: true });


router.post('/create-checkout-session', urlencodedParser, wrapAsync(async (req, res) => {
    const { bookingId, stripePriceId, bookingPrice } = req.body; // Get data from form
    console.log("Received booking data:", req.body);

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
        // Ensure your frontend routing handles /confirmation/:bookingId
        success_url: `http://localhost:8080/confirmation/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
        // Redirect back to payment page on cancel, passing bookingId
        cancel_url: `http://localhost:8080/payment/${bookingId}?cancelled=true`,
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

const confirmBooking = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        
        if (booking && booking.status === 'pending') {
            booking.status = 'confirmed';
            await booking.save();
            console.log(`Booking ${bookingId} status updated to confirmed.`);
            return { success: true, message: 'Booking confirmed' };
        } else if (booking) {
            console.warn(`Webhook Warning: Booking ${bookingId} already processed or not in pending state. Status: ${booking.status}`);
            return { success: false, message: 'Booking already processed' };
        } else {
            console.error(`Webhook Error: Booking ${bookingId} not found`);
            return { success: false, message: 'Booking not found' };
        }
    } catch (error) {
        console.error(`Database Error: Failed to confirm booking ${bookingId}: ${error.message}`);
        throw error; // Re-throw so webhook can handle it
    }
}

const cancelBooking = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        
        if (booking && booking.status === 'pending') {
            booking.status = 'available';
            booking.bookedBy = null;
            await booking.save();
            console.log(`Booking ${bookingId} reset due to session expiry.`);
            return { success: true, message: 'Booking cancelled' };
        } else if (booking) {
            console.warn(`Webhook Warning: Booking ${bookingId} not in pending state. Status: ${booking.status}`);
            return { success: false, message: 'Booking not in pending state' };
        } else {
            console.error(`Webhook Error: Booking ${bookingId} not found`);
            return { success: false, message: 'Booking not found' };
        }
    } catch (error) {
        console.error(`Database Error: Failed to cancel booking ${bookingId}: ${error.message}`);
        throw error; // Re-throw so webhook can handle it
    }
};

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