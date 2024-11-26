/**
 * External dependencies
 */
import React, { useEffect, useState, useRef } from "react";

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
const ledyerPaymentsParams = settings.ledyerpaymentsparams || {};

const PaymentMethodComponent: React.FC<{ eventRegistration: any; companyNumberRef: React.RefObject<HTMLInputElement>; setNotice: (message: string) => void }> = ({ eventRegistration, companyNumberRef, setNotice }) => {
  const { onCheckoutSuccess } = eventRegistration;

  useEffect(() => {
    const unsubscribe = onCheckoutSuccess(async (data: any) => {
      await submitOrder(companyNumberRef, data.orderId, data.customerId, setNotice);
    });
    return unsubscribe;
  }, [onCheckoutSuccess]);

  return null;
};

const submitOrder = async (
  companyNumberRef: React.RefObject<HTMLInputElement>,
  orderId: string,
  customerData: any,
  setNotice: (message: string) => void
  ) => {
  const organizationNumber = companyNumberRef.current?.value.trim();
  if (!organizationNumber || !organizationNumber.length) {
    setNotice("Company number is missing");
    throw new Error("Missing company number.");
  }

  const { sessionId } = ledyerPaymentsParams;
  const authArgs = { customer: { ...customerData }, sessionId };
  const authResponse = await window.ledyer.payments.api.authorize(authArgs);

  if (authResponse) {
    if ("authorized" === authResponse.state) {
      const authToken = authResponse.authorizationToken;
      const { state } = authResponse;
      const { createOrderUrl, createOrderNonce } = ledyerPaymentsParams;

      try {
        const response = await fetch(createOrderUrl, {
          method: "POST",
          body: new URLSearchParams({
            state,
            order_key: orderId,
            auth_token: authToken,
            nonce: createOrderNonce,
          }),
        });
        const data = await response.json();
        const {
          data: { location },
        } = data;
        window.location = location;
      } catch (error) {
        setNotice("The payment was successful, but the order could not be created.");
        throw new Error("The payment was successful, but the order could not be created.");
      }
    } else if ("awaitingSignatory" === authResponse.state) {
      const { pendingPaymentUrl, pendingPaymentNonce } = ledyerPaymentsParams;
      
      try {
        const response = await fetch(pendingPaymentUrl, {
          method: "POST",
          body: new URLSearchParams({
            order_key: orderId,
            nonce: pendingPaymentNonce,
          }),
        });
        const data = await response.json();
        const {
          data: { location },
        } = data;
        window.location = location;
      } catch (error) {
        setNotice("The payment is pending payment. Failed to redirect to order received page.");
        throw new Error("The payment is pending payment. Failed to redirect to order received page.");
      }
    }
  }
};

const Notice: React.FC<{ message: string }> = ({ message }) => {
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (noticeRef.current) {
      noticeRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [message]);

  return (
    <div ref={noticeRef} className="woocommerce-NoticeGroup">
      <ul className="woocommerce-error" role="alert">
        <li>{message}</li>
      </ul>
    </div>
  );
};

const Content: React.FC<any> = ({ eventRegistration }) => {
  const [notice, setNotice] = useState<string | null>(null);
  const companyNumberRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {notice && <Notice message={notice} />}
      <p>{decodeEntities(description)}</p>
      <PaymentMethodComponent eventRegistration={eventRegistration} companyNumberRef={companyNumberRef} setNotice={setNotice} />
      <input
        type="text"
        className="input-text"
        name="billing_company_number_block"
        id="billing_company_number_block"
        placeholder="Company number"
        defaultValue=""
        ref={companyNumberRef}
        required
      />
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
