/**
 * External dependencies
 */
import React, { useEffect } from "react";

/**
 * WordPress/WooCommerce dependencies
 */
import { decodeEntities } from "@wordpress/html-entities";
// @ts-ignore - Can't avoid this issue, but it's loaded in by Webpack
import { registerPaymentMethod } from "@woocommerce/blocks-registry";
// @ts-ignore - Can't avoid this issue, but it's loaded in by Webpack
import { getSetting } from "@woocommerce/settings";

declare global {
  interface Window {
    _ledyerPayments: any;
    wc: any;
    ledyer: {
      payments: {
        api: {
          authorize: (args: any) => Promise<any>;
        };
      };
    };
  }
}

const settings: any = getSetting("ledyer_payments_data", {});
const title: string = settings.title || "Ledyer Payments";
const isEnabled: boolean = settings.enabled || false;
const description: string = settings.description || "";
const iconUrl = settings.iconurl || false;
const ledyerPaymentParams = settings.ledyerpaymentparams || {};

const PaymentMethodComponent: React.FC<{ eventRegistration: any }> = ({ eventRegistration }) => {
  const { onCheckoutSuccess } = eventRegistration;
  useEffect( () => {
    const unsubscribe = onCheckoutSuccess( () => true );
    submitOrder();
    return unsubscribe;
  }, [ onCheckoutSuccess ] );

  return null;
};

const submitOrder = async () => {
  const submitOrderUrl = ledyerPaymentParams.submitOrderUrl;
  const formData = "wc_order_attribution_source_type=typein&wc_order_attribution_referrer=https%3A%2F%2Fkrokedil.anya.ngrok.io%2Fwp-admin%2F&wc_order_attribution_utm_campaign=(none)&wc_order_attribution_utm_source=(direct)&wc_order_attribution_utm_medium=(none)&wc_order_attribution_utm_content=(none)&wc_order_attribution_utm_id=(none)&wc_order_attribution_utm_term=(none)&wc_order_attribution_utm_source_platform=(none)&wc_order_attribution_utm_creative_format=(none)&wc_order_attribution_utm_marketing_tactic=(none)&wc_order_attribution_session_entry=https%3A%2F%2Fkrokedil.anya.ngrok.io%2F&wc_order_attribution_session_start_time=2024-11-22%2008%3A37%3A02&wc_order_attribution_session_pages=19&wc_order_attribution_session_count=2&wc_order_attribution_user_agent=Mozilla%2F5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F131.0.0.0%20Safari%2F537.36&billing_first_name=Test&billing_last_name=Test&billing_company=&billing_country=SE&billing_address_1=Reparat%C3%B6rgatan%202&billing_address_2=&billing_postcode=302%2062&billing_city=Halmstad&billing_state=&billing_phone=0700000000&billing_email=test%40example.com&kco_shipping_data=false&shipping_first_name=Test&shipping_last_name=Test&shipping_company=&shipping_country=SE&shipping_address_1=Reparat%C3%B6rgatan%202&shipping_address_2=&shipping_postcode=302%2062&shipping_city=Halmstad&shipping_state=&order_comments=&shipping_method%5B0%5D=flat_rate%3A17&payment_method=ledyer_payments_invoice&billing_company_number=65456&terms=on&terms-field=1&woocommerce-process-checkout-nonce=11ab3cdcaa&_wp_http_referer=%2F%3Fwc-ajax%3Dupdate_order_review";
  
  try {
      const response = await fetch(submitOrderUrl, {
          method: 'POST',
          body: formData,
      });

      const data = await response.json();
      const { order_key: orderId, customer } = data;
      await handleProceedWithLedyer(orderId, customer);
  } catch (error) {
      console.error( error );
  }
};

const handleProceedWithLedyer = async ( orderId: string, customerData: any ) => {
  const { gatewayId, sessionId } = ledyerPaymentParams

  const authArgs = { customer: { ...customerData }, sessionId }
  const authResponse = await window.ledyer.payments.api.authorize( authArgs )

  if ( authResponse ) {
      if ( authResponse.state === "authorized" ) {
        const authToken = authResponse.authorizationToken
        const { state } = authResponse
        const { createOrderUrl, createOrderNonce } = ledyerPaymentParams

        try {
          const response = await fetch(createOrderUrl, {
            method: 'POST',
            body: new URLSearchParams({
              state,
              order_key: orderId,
              auth_token: authToken,
              nonce: createOrderNonce,
            })
          });
          const data = await response.json();
          const {
              data: { location },
          } = data;
          window.location = location;
        } catch (error) {
          console.log( error );
        } 
      }
  }
}

const Content: React.FC<any> = ({ eventRegistration }) => {
  return (
    <div>
      <p>{decodeEntities(description)}</p>
      <PaymentMethodComponent eventRegistration={eventRegistration} />
    </div>
  );
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
  canMakePayment: () => isEnabled,
  ariaLabel: title,
};

registerPaymentMethod(options);
