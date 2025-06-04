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

const PaymentMethodComponent: React.FC<{ organizationNumber: React.RefObject<HTMLInputElement>; reference1: React.RefObject<HTMLInputElement>; reference2: React.RefObject<HTMLInputElement>; props: any }> = ({ organizationNumber, reference1, reference2, props }) => {
  const { onCheckoutSuccess } = props.eventRegistration;
  const { emitResponse } = props;
  const { billingData } = props.billing;
  const {shippingAddress } = props.shippingData;

  useEffect(() => {
    const unsubscribe = onCheckoutSuccess(async (orderData: any) => {
      const { orderId } = orderData;
      const orderKey = orderData.processingResponse.paymentDetails.order_key;
      return await submitOrder(orderId, orderKey, organizationNumber, reference1, reference2, billingData, shippingAddress, emitResponse);
    });
    return unsubscribe;
  }, [onCheckoutSuccess]);

  return null;
};

const submitOrder = async (
  orderId: any,
  orderKey: any,
  organizationNumber: React.RefObject<HTMLInputElement>,
  reference1: React.RefObject<HTMLInputElement>,
  reference2: React.RefObject<HTMLInputElement>,
  billingData: any,
  shippingData: any,
  emitResponse: any
  ) => {
  const organizationNumberVal = organizationNumber.current?.value.trim();
  const reference1Val = reference1.current?.value?.trim() || "";
  const reference2Val = reference2.current?.value?.trim() || "";

  if (!organizationNumberVal || !organizationNumberVal.length) {
    return { type: emitResponse.responseTypes.ERROR, message: "Company number is missing.", messageContext: emitResponse.noticeContexts.CHECKOUT };
  }
  const { sessionId } = ledyerPaymentsParams;
  const authArgs = extractCustomerData(orderId, billingData, shippingData, organizationNumberVal, reference1Val, reference2Val, sessionId);
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
            order_key: orderKey,
            billing_company_number: organizationNumberVal,
            auth_token: authToken,
            nonce: createOrderNonce,
          }),
        });
        const data = await response.json();
        const {
          data: { location },
        } = data;
        window.location = location;
        return { type: emitResponse.responseTypes.SUCCESS };
      } catch (error) {
        return { type: emitResponse.responseTypes.ERROR, message: "The payment was successful, but the order could not be created.", messageContext: emitResponse.noticeContexts.CHECKOUT };
      }
    } else if ("awaitingSignatory" === authResponse.state) {
      const { pendingPaymentUrl, pendingPaymentNonce } = ledyerPaymentsParams;
      
      try {
        const response = await fetch(pendingPaymentUrl, {
          method: "POST",
          body: new URLSearchParams({
            order_key: orderKey,
            nonce: pendingPaymentNonce,
          }),
        });
        const data = await response.json();
        const {
          data: { location },
        } = data;
        window.location = location;
        return { type: emitResponse.responseTypes.SUCCESS };
      } catch (error) {
        return { type: emitResponse.responseTypes.ERROR, message: "The payment is pending payment. Failed to redirect to order received page.", messageContext: emitResponse.noticeContexts.CHECKOUT };
      }
    }
    return { type: emitResponse.responseTypes.ERROR, message: "The payment was not successful. Not authorized.", messageContext: emitResponse.noticeContexts.CHECKOUT };
  }
  return { type: emitResponse.responseTypes.ERROR, message: "The payment was not successful. Not authorization response received.", messageContext: emitResponse.noticeContexts.CHECKOUT };
};

const extractCustomerData = (orderId: any, billingData: any, shippingData: any, organizationNumber: any, reference1: any, reference2: any, sessionId: any) => {
  return {
      customer: {
          companyId: organizationNumber || null,
          email: billingData?.email || null,
          firstName: billingData?.first_name || null,
          lastName: billingData?.last_name || null,
          phone: billingData?.phone || null,
          reference1: reference1 || "",
          reference2: reference2 || "",
          billingAddress: {
              attentionName: billingData?.first_name || null,
              city: billingData?.city || null,
              companyName: billingData?.company || null,
              country: billingData?.country || null,
              postalCode: billingData?.postcode || null,
              streetAddress: billingData?.address_1 || null
          },
          shippingAddress: {
              attentionName: shippingData?.first_name || null,
              city: shippingData?.city || null,
              companyName: shippingData?.company || null,
              country: shippingData?.country || null,
              postalCode: shippingData?.postcode || null,
              streetAddress: shippingData?.address_1 || null,
              contact: {
                  email: billingData?.email || null,
                  firstName: shippingData?.first_name || null,
                  lastName: shippingData?.last_name || null,
                  phone: shippingData?.phone || null
              }
          }
      },
      sessionId: sessionId || null
  };
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

const Content: React.FC<any> = (props) => {
  const organizationNumber = useRef<HTMLInputElement>(null);
  const reference1 = useRef<HTMLInputElement>(null);
  const reference2 = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p>{decodeEntities(description)}</p>
      <PaymentMethodComponent props={props} organizationNumber={organizationNumber} reference1={reference1} reference2={reference2} />
      <input
      type="text"
      className="input-text"
      name="billing_company_number_block"
      id="billing_company_number_block"
      placeholder="Company number"
      defaultValue=""
      ref={organizationNumber}
      required
      style={{ width: "100%", marginBottom: "10px" }}
      />
      <input
      type="text"
      className="input-text"
      name="reference_1_block"
      id="reference_1_block"
      placeholder="Reference 1"
      defaultValue=""
      ref={reference1}
      required
      style={{ width: "100%", marginBottom: "10px" }}
      />
       <input
      type="text"
      className="input-text"
      name="reference_2_block"
      id="reference_2_block"
      placeholder="Reference 2"
      defaultValue=""
      ref={reference2}
      required
      style={{ width: "100%", marginBottom: "10px" }}
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