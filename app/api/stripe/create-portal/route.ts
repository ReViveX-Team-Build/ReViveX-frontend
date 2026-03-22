import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { uid } = await req.json();

        // Get stripeCustomerId from Firestore
        const snap = await adminDb.doc(`users/${uid}`).get();
        const customerId = snap.data()?.subscription?.stripeCustomerId;

        if (!customerId) {
            return NextResponse.json({ error: "No subscription found" }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/patients/ai-companion`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}