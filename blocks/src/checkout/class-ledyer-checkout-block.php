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
	 * Gets the payment method data to load into the frontend.
	 *
	 * @return array
	 */
	public function get_payment_method_data() {
		return array(
			'title'       => __( 'Ledyer Payments title', 'ledyer-payments', 'ledyer-payments-for-woocommerce' ),
			'description' => __( 'Ledyer Payments description', 'ledyer-payments-for-woocommerce' ),
			'iconurl'     => LEDYER_PAYMENTS_PLUGIN_URL . '/src/assets/img/ledyer-darkgray.svg',
			'enabled'     => true,
		);
	}
}
