import { NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

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

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const { uid, plan } = session.metadata ?? {};

            if (uid && plan) {
                await setDoc(
                    doc(db, "patients", uid),
                    {
                        subscription: {
                            plan,
                            status: "active",
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            activatedAt: serverTimestamp(),
                        },
                    },
                    { merge: true }
                );

                console.log(`✅ Plan '${plan}' activated for uid: ${uid}`);
            }
            break;
        }

        default:
            break;
    }

    return NextResponse.json({ received: true });
}