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
const title: string = settings.title || "Ledyer Payments";
const isEnabled: boolean = settings.enabled || false;
const description: string = settings.description || "";
const iconUrl = settings.iconurl || false;

const Content: React.FC = () => {
  return <div>{description}</div>;
};
const Label: React.FC = () => {
  const icon = iconUrl ? <img src={iconUrl} alt={title} /> : null;
  return (
    <span className="lp-block-label">
      {icon}
      {title}
    </span>
  );
};

const options = {
  name: "ledyer_payments",
  label: <Label />,
  content: <Content />,
  edit: <Content />,
  placeOrderButtonLabel: "Pay with Ledyer",
  canMakePayment: () => true,
  ariaLabel: title,
};

registerPaymentMethod(options);