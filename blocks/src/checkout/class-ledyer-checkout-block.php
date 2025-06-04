<?php
/**
 * Ledyer Checkout Block.
 *
 * @package Ledyer_Payments/Blocks
 */

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

defined( 'ABSPATH' ) || exit;

/**
 * Class Ledyer_Checkout_Block.
 */
class Ledyer_Checkout_Block extends AbstractPaymentMethodType {
	/**
	 * When called invokes any initialization/setup for the integration.
	 */
	public function initialize() {
		$this->name     = 'ledyer_payments';
		$this->settings = get_option( 'woocommerce_ledyer_payments_settings', array() );

		$assets_path = dirname( __DIR__, 2 ) . '/build/checkout.asset.php';
		if ( file_exists( $assets_path ) ) {
			$assets = require $assets_path;
			wp_register_script( 'ledyer-checkout-block', LEDYER_PAYMENTS_PLUGIN_URL . '/blocks/build/checkout.js', $assets['dependencies'], $assets['version'], true );
		}
	}

	/**
	 * Loads the payment method scripts.
	 *
	 * @return array
	 */
	public function get_payment_method_script_handles() {
		return array( 'ledyer-checkout-block' );
	}

	/**
	 * Checks if we are currently on the admin pages when loading the blocks.
	 *
	 * @return boolean
	 */
	public function is_admin() {
		// If we are on the block render endpoint, then this is an admin request.
		$is_edit_context = isset( $_GET['action'] ) && 'edit' === $_GET['action'];
		$is_admin        = $is_edit_context;

		return $is_admin;
	}

	/**
	 * Gets the payment method data to load into the frontend.
	 *
	 * @return array
	 */
	public function get_payment_method_data() {

		if ( $this->is_admin() ) {
			return array(
				'title'                => __( 'Ledyer Payments title', 'ledyer-payments-for-woocommerce' ),
				'description'          => __( 'Ledyer Payments description', 'ledyer-payments-for-woocommerce' ),
				'iconurl'              => LEDYER_PAYMENTS_PLUGIN_URL . '/src/assets/img/ledyer-darkgray.svg',
				'enabled'              => true,
				'ledyerpaymentsparams' => array(),
			);
		}

		// The reference is stored in the session. Create the session if necessary.
		Ledyer_Payments()->session()->get_session();
		$reference  = Ledyer_Payments()->session()->get_reference();
		$session_id = Ledyer_Payments()->session()->get_id();

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

		return array(
			'title'                => __( 'Ledyer Payments title', 'ledyer-payments-for-woocommerce' ),
			'description'          => __( 'Ledyer Payments description', 'ledyer-payments-for-woocommerce' ),
			'iconurl'              => LEDYER_PAYMENTS_PLUGIN_URL . '/src/assets/img/ledyer-darkgray.svg',
			'enabled'              => true,
			'ledyerpaymentsparams' =>
			array(
				'sessionId'                 => $session_id,
				'changePaymentMethodNonce'  => wp_create_nonce( 'ledyer_payments_change_payment_method' ),
				'changePaymentMethodUrl'    => \WC_AJAX::get_endpoint( 'ledyer_payments_change_payment_method' ),
				'logToFileNonce'            => wp_create_nonce( 'ledyer_payments_wc_log_js' ),
				'logToFileUrl'              => \WC_AJAX::get_endpoint( 'ledyer_payments_wc_log_js' ),
				'createOrderNonce'          => wp_create_nonce( 'ledyer_payments_create_order' ),
				'createOrderUrl'            => \WC_AJAX::get_endpoint( 'ledyer_payments_create_order' ),
				'pendingPaymentNonce'       => wp_create_nonce( 'ledyer_payments_pending_payment' ),
				'pendingPaymentUrl'         => \WC_AJAX::get_endpoint( 'ledyer_payments_pending_payment' ),
				'standardWooCheckoutFields' => $standard_woo_checkout_fields,
				'submitOrderUrl'            => \WC_AJAX::get_endpoint( 'checkout' ),
				'gatewayId'                 => 'ledyer_payments',
				'reference'                 => $reference,
				'companyNumberPlacement'    => Ledyer_Payments()->settings( 'company_number_placement' ),
				'i18n'                      => array(
					'companyNumberMissing' => __( 'Please enter a company number.', 'ledyer-payments-for-woocommerce' ),
				),
			),
		);
	}
}
