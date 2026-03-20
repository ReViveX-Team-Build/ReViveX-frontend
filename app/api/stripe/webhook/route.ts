// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  // ── 1. Verify the webhook came from Stripe ────────────────────────────────
  try {
    event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── 2. Handle events ──────────────────────────────────────────────────────
  switch (event.type) {

      // Payment succeeded → activate plan
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { uid, plan } = session.metadata ?? {};

      if (uid && plan) {
        await adminDb.doc(`patients/${uid}`).set(
            {
              subscription: {
                plan,
                status:               "active",
                stripeCustomerId:     session.customer,
                stripeSubscriptionId: session.subscription,
                activatedAt:          FieldValue.serverTimestamp(),
              },
            },
            { merge: true }
        );
        console.log(`✅ Plan '${plan}' activated for uid: ${uid}`);
      }
      break;
    }

      // Subscription cancelled → downgrade to free
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId   = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId) {
        const snap = await adminDb
            .collection("patients")
            .where("subscription.stripeCustomerId", "==", customerId)
            .get();

        snap.forEach(async (docSnap) => {
          await adminDb.doc(`patients/${docSnap.id}`).set(
              { subscription: { plan: "free", status: "cancelled" } },
              { merge: true }
          );
          console.log(`⚠️ Subscription cancelled for uid: ${docSnap.id}`);
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}