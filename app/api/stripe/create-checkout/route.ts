// app/api/stripe/create-checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

// ── Price IDs from your Stripe Dashboard (test mode) ─────────────────────────
// Replace these with your actual Price IDs after creating products in Stripe
const PRICE_IDS: Record<string, string> = {
  advanced_analytics: process.env.STRIPE_PRICE_ADVANCED_ANALYTICS!,
  voice_companion: process.env.STRIPE_PRICE_VOICE_COMPANION!,
};

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(secretKey);

    const { uid, email, plan } = await req.json();

    if (!uid || !email || !plan) {
      return NextResponse.json(
        { error: "uid, email and plan are required" },
        { status: 400 },
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // Pass uid so webhook can update Firestore
      metadata: { uid, plan },
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/patients/ai-companion?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/patients/ai-companion`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
