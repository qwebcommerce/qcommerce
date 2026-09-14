import CheckoutForm from "@/components/storefront/CheckoutForm";
import { getCustomerSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/db";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await getCustomerSession();
  const customer = session ? await getCustomerById(session.id) : null;
  return (
    <CheckoutForm
      customer={
        customer
          ? { fullName: customer.fullName, email: customer.email, phone: customer.phone }
          : null
      }
    />
  );
}
