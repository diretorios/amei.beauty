/**
 * Handle Stripe payment for unlocking updates
 * POST /api/payment/checkout - Create Stripe Checkout Session (Buy Now button)
 * POST /api/payment/webhook - Stripe webhook handler
 */

import Stripe from 'stripe';
import type { Env } from '../types';

const PAYMENT_AMOUNT = 10; // $10 USD
const PAYMENT_CURRENCY = 'usd';

/**
 * Create Stripe Checkout Session (Buy Now button)
 * POST /api/payment/checkout
 * 
 * This creates a Stripe Checkout Session and returns the URL to redirect to.
 * Much simpler than Payment Links - we can pass card_id directly in metadata.
 */
export async function handlePaymentCheckout(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json() as { card_id: string; success_url?: string; cancel_url?: string };
    const { card_id, success_url, cancel_url } = body;

    if (!card_id) {
      return new Response(
        JSON.stringify({ error: 'card_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify card exists
    const existing = await env.DB.prepare('SELECT * FROM cards WHERE id = ?')
      .bind(card_id)
      .first<import('../types').CardRow>();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Card not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get origin from request for success/cancel URLs
    const origin = request.headers.get('Origin') || 'https://amei.beauty';
    const defaultSuccessUrl = success_url || `${origin}/?payment=success&card_id=${encodeURIComponent(card_id)}`;
    const defaultCancelUrl = cancel_url || `${origin}/?payment=cancelled`;

    // Create Stripe Checkout Session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'payment',
        payment_method_types: 'card', // Can add 'link', 'pix' for Brazil
        line_items: JSON.stringify([{
          price_data: {
            currency: PAYMENT_CURRENCY,
            product_data: {
              name: '12 Months Card Updates + Better Search Placement',
              description: 'Unlock 12 months of free updates and better search placement (equivalent to 10 endorsements)',
            },
            unit_amount: PAYMENT_AMOUNT * 100, // Convert to cents
          },
          quantity: 1,
        }]),
        metadata: JSON.stringify({ card_id }),
        client_reference_id: card_id, // Also set as client_reference_id for webhook
        success_url: defaultSuccessUrl,
        cancel_url: defaultCancelUrl,
        allow_promotion_codes: 'true', // Allow discount codes
      }),
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id,
        card_id,
        amount: PAYMENT_AMOUNT,
        currency: PAYMENT_CURRENCY.toUpperCase(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Payment checkout error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle Stripe webhook
 * POST /api/payment/webhook
 * 
 * This webhook should be configured in Stripe Dashboard:
 * 1. Go to Stripe Dashboard → Developers → Webhooks
 * 2. Add endpoint: https://your-worker.workers.dev/api/payment/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded
 * 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET env var
 * 
 * Security: Properly verifies webhook signature and implements idempotency
 */
export async function handlePaymentWebhook(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Validate configuration
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get signature from headers
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Initialize Stripe SDK
    // Using default API version (latest stable) for webhook signature verification
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    // Verify webhook signature - CRITICAL SECURITY STEP
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Idempotency check: prevent processing the same event twice
    const existingEvent = await env.DB.prepare(
      'SELECT event_id, status FROM webhook_events WHERE event_id = ?'
    )
      .bind(event.id)
      .first<{ event_id: string; status: string }>();

    if (existingEvent) {
      console.log(`Webhook event ${event.id} already processed with status: ${existingEvent.status}`);
      // Return 200 to acknowledge receipt, but don't process again
      return new Response('OK', { status: 200 });
    }

    // Log webhook event for audit trail
    const now = Date.now();
    await env.DB.prepare(
      'INSERT INTO webhook_events (event_id, event_type, processed_at, status) VALUES (?, ?, ?, ?)'
    )
      .bind(event.id, event.type, now, 'processing')
      .run();

    let cardId: string | null = null;
    let paymentAmount = PAYMENT_AMOUNT;
    let paymentCurrency = PAYMENT_CURRENCY;

    // Handle checkout.session.completed (from Checkout Sessions)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // Checkout Sessions have card_id in both metadata and client_reference_id
      cardId = (session.client_reference_id || session.metadata?.card_id) ?? null;
      paymentAmount = session.amount_total ? session.amount_total / 100 : PAYMENT_AMOUNT;
      paymentCurrency = (session.currency?.toUpperCase() || PAYMENT_CURRENCY) as string;
    }
    // Handle payment_intent.succeeded (fallback)
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      cardId = (paymentIntent.metadata?.card_id || paymentIntent.metadata?.client_reference_id) ?? null;
      paymentAmount = paymentIntent.amount ? paymentIntent.amount / 100 : PAYMENT_AMOUNT;
      paymentCurrency = (paymentIntent.currency?.toUpperCase() || PAYMENT_CURRENCY) as string;
    } else {
      // Unhandled event type - log but don't error
      console.log(`Unhandled webhook event type: ${event.type}`);
      await env.DB.prepare(
        'UPDATE webhook_events SET status = ?, error_message = ? WHERE event_id = ?'
      )
        .bind('skipped', `Unhandled event type: ${event.type}`, event.id)
        .run();
      return new Response('OK', { status: 200 });
    }

    if (!cardId) {
      console.error('Missing card_id/client_reference_id in payment event', event.type);
      await env.DB.prepare(
        'UPDATE webhook_events SET status = ?, error_message = ? WHERE event_id = ?'
      )
        .bind('failed', 'Missing card_id/client_reference_id', event.id)
        .run();
      return new Response('OK', { status: 200 }); // Return 200 to acknowledge receipt
    }

    // Verify card exists
    const existingCard = await env.DB.prepare('SELECT id FROM cards WHERE id = ?')
      .bind(cardId)
      .first<{ id: string }>();

    if (!existingCard) {
      console.error(`Card not found: ${cardId}`);
      await env.DB.prepare(
        'UPDATE webhook_events SET status = ?, error_message = ?, card_id = ? WHERE event_id = ?'
      )
        .bind('failed', 'Card not found', cardId, event.id)
        .run();
      return new Response('OK', { status: 200 });
    }

    const updatesEnabledUntil = now + (12 * 30 * 24 * 60 * 60 * 1000); // 12 months

    // Update card: Payment = 10 endorsements (12 months + featured)
    await env.DB.prepare(
      `UPDATE cards SET
        payment_status = ?,
        payment_date = ?,
        payment_amount = ?,
        payment_currency = ?,
        can_update = ?,
        updates_enabled_until = ?,
        is_featured = ?
      WHERE id = ?`
    )
      .bind(
        'paid',
        now,
        paymentAmount,
        paymentCurrency,
        1, // can_update = true
        updatesEnabledUntil,
        1, // is_featured = true (better search placement)
        cardId
      )
      .run();

    // Update webhook event status to processed
    await env.DB.prepare(
      'UPDATE webhook_events SET status = ?, card_id = ? WHERE event_id = ?'
    )
      .bind('processed', cardId, event.id)
      .run();

    console.log(`Payment processed for card ${cardId}: ${paymentAmount} ${paymentCurrency} (event: ${event.id})`);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Payment webhook error:', error);
    
    // Try to update webhook event status if we have the event ID
    // Note: If error occurred before event parsing, this will fail silently
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If we have access to event ID from the outer scope, update status
    // Otherwise, the error occurred before we could parse the event
    try {
      // Try to get event ID from error context if available
      // This is a best-effort attempt to log the failure
      if (error instanceof Error && 'eventId' in error) {
        const eventId = (error as Error & { eventId?: string }).eventId;
        if (eventId) {
          await env.DB.prepare(
            'UPDATE webhook_events SET status = ?, error_message = ? WHERE event_id = ?'
          )
            .bind('failed', errorMessage, eventId)
            .run();
        }
      }
    } catch {
      // Ignore errors in error handling - we've already logged the main error
    }

    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

