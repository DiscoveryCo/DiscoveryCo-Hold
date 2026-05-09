import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
})

/** Get or create a Stripe customer for the given user email */
export async function getOrCreateCustomer(
  email: string,
  name: string | null | undefined,
  existingCustomerId: string | null | undefined,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { discoverymail: "true" },
  })
  return customer.id
}
