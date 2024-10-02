<?php
/**
 * Class Assets.
 *
 * Assets management.
 */

namespace Krokedil\Ledyer\Payments;

use Krokedil\Ledyer\Payments\Requests\Helpers\Cart;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Assets {

	const SDK_HANDLE      = 'ledyer-payments-bootstrap';
	const CHECKOUT_HANDLE = 'ledyer-payments-for-woocommerce';

	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// The client SDK requires that <script> tag ID is set to 'ledyer-payments'.
		add_action( 'script_loader_tag', array( $this, 'script_loader_tag' ), 10, 2 );
	}

	public function enqueue_scripts() {
		if ( ! wc_string_to_bool( Ledyer()->settings( 'enabled' ) ) ) {
			return;
		}

		if ( ! is_checkout() ) {
			return;
		}

		// The reference is stored in the session.
		$reference  = Ledyer()->session()->get_reference();
		$session_id = Ledyer()->session()->get_id();

		$standard_woo_checkout_fields = array(
			'billing_first_name',
			'billing_last_name',
			'billing_address_1',
			'billing_address_2',
			'billing_postcode',
			'billing_city',
			'billing_phone',
			'billing_email',
			'billing_state',
			'billing_country',
			'billing_company',
			'shipping_first_name',
			'shipping_last_name',
			'shipping_address_1',
			'shipping_address_2',
			'shipping_postcode',
			'shipping_city',
			'shipping_state',
			'shipping_country',
			'shipping_company',
			'terms',
			'terms-field',
			'_wp_http_referer',
		);

		$src          = plugins_url( 'src/assets/js/ledyer-payments.js', LEDYER_PAYMENTS_MAIN_FILE );
		$dependencies = array( 'jquery' );
		wp_register_script( self::CHECKOUT_HANDLE, $src, $dependencies, LEDYER_PAYMENTS_VERSION, false );

		$pay_for_order = is_wc_endpoint_url( 'order-pay' );
		wp_localize_script(
			self::CHECKOUT_HANDLE,
			'LedyerPaymentsParams',
			array(
				'sessionId'                 => $session_id,
				'changePaymentMethodNonce'  => wp_create_nonce( Gateway::ID . '_change_payment_method' ),
				'changePaymentMethodUrl'    => \WC_AJAX::get_endpoint( Gateway::ID . '_change_payment_method' ),
				'logToFileNonce'            => wp_create_nonce( Gateway::ID . '_wc_log_js' ),
				'logToFileUrl'              => \WC_AJAX::get_endpoint( Gateway::ID . '_wc_log_js' ),
				'createOrderNonce'          => wp_create_nonce( Gateway::ID . '_create_order' ),
				'createOrderUrl'            => \WC_AJAX::get_endpoint( Gateway::ID . '_create_order' ),
				'pendingPaymentNonce'       => wp_create_nonce( Gateway::ID . '_pending_payment' ),
				'pendingPaymentUrl'         => \WC_AJAX::get_endpoint( Gateway::ID . '_pending_payment' ),
				'payForOrder'               => $pay_for_order,
				'standardWooCheckoutFields' => $standard_woo_checkout_fields,
				'submitOrderUrl'            => \WC_AJAX::get_endpoint( 'checkout' ),
				'gatewayId'                 => Gateway::ID,
				'reference'                 => $reference,
			)
		);

		wp_enqueue_script( self::CHECKOUT_HANDLE );

		$env = wc_string_to_bool( Ledyer()->settings( 'test_mode' ) ) ? 'sandbox' : 'live';
		wp_enqueue_script( self::SDK_HANDLE, "https://payments.$env.ledyer.com/bootstrap.js", array( self::CHECKOUT_HANDLE ), LEDYER_PAYMENTS_VERSION, true );
	}

	/**
	 * Modifies the script loader tag for a specific handle.
	 *
	 * This method is responsible for modifying the script loader tag for a specific handle.
	 * It checks if the handle matches the SDK handle and if so, it replaces the ID attribute
	 * in the tag with a new value.
	 *
	 * @param string $tag    The original script loader tag.
	 * @param string $handle The handle of the script being loaded.
	 *
	 * @return string The modified script loader tag.
	 */
	public function script_loader_tag( $tag, $handle ) {
		if ( self::SDK_HANDLE !== $handle ) {
			return $tag;
		}

		$pattern     = '/id="([^"]*)"/';
		$replacement = 'id="ledyer-payments"';
		return preg_replace( $pattern, $replacement, $tag );
	}
}
