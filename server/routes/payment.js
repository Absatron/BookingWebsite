import express from 'express';
import { wrapAsync } from '../utils/error-utils.js';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Booking } from '../models.js'; // Import Booking model

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Get webhook secret from environment variables
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


    // Optional: Fetch booking to verify price and status server-side
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.price !== parseFloat(bookingPrice) || booking.stripePriceId !== stripePriceId) {
         return res.status(400).json({ message: 'Booking details mismatch or invalid.' });
    }
    if (booking.status !== 'pending') {
         return res.status(409).json({ message: 'Booking is not in a payable state.' });
    }

    console.log(`Creating checkout session for booking ${bookingId} with price ID ${stripePriceId}`);
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: stripePriceId, // Use the dynamic price ID from the request
                quantity: 1,
            },
        ],
        mode: 'payment',
        // Include bookingId in success URL and metadata
        // Ensure your frontend routing handles /confirmation/:bookingId
        success_url: `http://localhost:8080/confirmation/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
        // Redirect back to payment page on cancel, passing bookingId
        cancel_url: `http://localhost:8080/payment/${bookingId}?cancelled=true`,
        // Add bookingId to metadata for webhook handler
        metadata: {
            bookingId: bookingId,
        },
         payment_intent_data: {
            metadata: {
                bookingId: bookingId,
            },
        },
        // Optional: Pre-fill customer email if available
        // customer_email: req.session.user_email, // Assuming email is stored in session
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

    const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  //const event = request.body;


  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout Session Completed:', session.id);
      console.log('Metadata:', session.metadata);
      let bookingId = session.metadata?.bookingId;

      if (!bookingId) {
          console.error('Webhook Error: Missing bookingId in payment intent metadata for payment intent', paymentIntent.id);
          return response.status(400).send('Webhook Error: Missing bookingId in metadata.');
      }

      // Find the booking and update its status
      try {
          const booking = await Booking.findById(bookingId);
          if (booking && booking.status === 'pending') {
              booking.status = 'confirmed';
              await booking.save();
              console.log(`Booking ${bookingId} status updated to confirmed.`);
          } else if (booking) {
              console.warn(`Webhook Warning: Booking ${bookingId} already processed or not in pending state. Status: ${booking.status}`);
          } else {
              console.error(`Webhook Error: Booking ${bookingId} not found for payment intent ${paymentIntent.id}`);
          }
      } catch (dbError) {
          console.error(`Webhook DB Error: Failed to update booking ${bookingId}: ${dbError.message}`);
          return response.status(500).send('Webhook DB Error: Could not update booking.');
      }
      break;
      
    case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        const failedBookingId = failedPaymentIntent.metadata?.bookingId;
        
        if (!failedBookingId) {
            console.error('Webhook Error: Missing bookingId in failed payment intent metadata for payment intent', failedPaymentIntent.id);
            return response.status(400).send('Webhook Error: Missing bookingId in metadata.');
        }
        
        try {
            const booking = await Booking.findById(failedBookingId);
            if (booking) {
                booking.status = 'available'; // Reset booking status
                booking.bookedBy = null; // Clear bookedBy field
                await booking.save();
                console.log(`Booking ${booking._id} status reset to available due to payment failure.`);
            } else if (booking) {
                console.warn(`Webhook Warning: Booking ${failedBookingId} not in pending state. Status: ${booking.status}`);
            } else {
                console.error(`Webhook Error: Booking ${failedBookingId} not found for payment intent ${failedPaymentIntent.id}`);
            }
        } catch (dbError) {
            console.error(`Webhook DB Error: Failed to update failed booking ${failedBookingId}: ${dbError.message}`);
            return response.status(500).send('Webhook DB Error: Could not update booking.');
        }
        break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  //response.status(200).json({ received: true });
  response.send();
}));


export default router;