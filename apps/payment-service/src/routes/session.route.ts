import { Hono } from "hono";
import crypto from "crypto";
import razorpay from "../utils/razorpay";
import { shouldBeUser } from "../middleware/authMiddleware";
import { CartItemsType } from "@repo/types";
import { producer } from "../utils/kafka";

const sessionRoute = new Hono();

sessionRoute.post("/create-checkout-session", shouldBeUser, async (c) => {
  const { cart }: { cart: CartItemsType } = await c.req.json();

  const totalAmount = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return c.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log(error);
    return c.json({ error: "Failed to create order" }, 500);
  }
});

sessionRoute.post("/verify-payment", shouldBeUser, async (c) => {
  const userId = c.get("userId");
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cart,
    email,
  }: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    cart: CartItemsType;
    email?: string;
  } = await c.req.json();

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return c.json({ verified: false, message: "Invalid signature!" }, 400);
  }

  const amount = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  producer.send("payment.successful", {
    value: {
      userId,
      email: email || "unknown@example.com",
      amount: Math.round(amount * 100),
      status: "success",
      products: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  });

  return c.json({ verified: true });
});

export default sessionRoute;