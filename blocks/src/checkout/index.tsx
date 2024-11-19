/**
 * External dependencies
 */
import * as React from "react";

/**
 * Wordpress/WooCommerce dependencies
 */
import { decodeEntities } from "@wordpress/html-entities";
// @ts-ignore - Cant avoid this issue, but its loaded in by Webpack
import { registerPaymentMethod } from "@woocommerce/blocks-registry";
// @ts-ignore - Cant avoid this issue, but its loaded in by Webpack
import { getSetting } from "@woocommerce/settings";

const settings: any = getSetting("ledyer_payments_data", {});
const title: string = decodeEntities(
  settings.title || "Ledyer Payments"
);

type LedyerCheckoutProps = {
  cartData?: any;
};

const LedyerCheckout: React.FC<LedyerCheckoutProps> = (props) => {
  const { cartData } = props;
  const { author, quote } = cartData.extensions.example || {};

  return (
    <div>
      <p style={{ fontStyle: "italic" }}>
        "{quote}"
        <br />
        <span style={{ fontWeight: "bold", marginLeft: "20px" }}>
          - {author}
        </span>
      </p>
    </div>
  );
};

const Label: React.FC = () => {
  return <span>{title}</span>;
};

const options = {
  name: "Ledyer Checkout",
  label: <Label />,
  content: <LedyerCheckout />,
  edit: <LedyerCheckout />,
  placeOrderButtonLabel: "Pay with Ledyer",
  canMakePayment: () => settings.enabled,
  ariaLabel: title,
};

registerPaymentMethod(options);