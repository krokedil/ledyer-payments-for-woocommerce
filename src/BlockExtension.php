<?php
/**
 * Class that contains the logic to extend the WooCommerce StoreAPI cart controller with custom data.
 *
 * @package Example_Plugin/Classes
 */

use Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema;

defined( 'ABSPATH' ) || exit;

/**
 * Class that contains the logic to extend the WooCommerce StoreAPI cart controller with custom data.
 */
class Example_Cart_Extension {
	/**
	 * Constructor
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'woocommerce_blocks_loaded', array( $this, 'register_callbacks' ) );
	}

	/**
	 * Register the callbacks for the block.
	 *
	 * @return void
	 */
	public function register_callbacks() {
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => CartSchema::IDENTIFIER,
				'namespace'       => 'example',
				'data_callback'   => array( $this, 'get_quote' ),
				'schema_callback' => array( $this, 'get_quote_scheme' ),
				'schema_type'     => ARRAY_A,
			)
		);
	}

	/**
	 * Get the quote data.
	 *
	 * @return array
	 */
	public function get_quote() {
		$response = wp_remote_get( 'https://api.quotable.io/quotes/random' );

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$body = wp_remote_retrieve_body( $response );

		if ( empty( $body ) ) {
			return array();
		}

		$data = json_decode( $body, true );

		if ( empty( $data ) ) {
			return array();
		}

		return array(
			'quote'  => $data[0]['content'],
			'author' => $data[0]['author'],
		);
	}

	/**
	 * Get the quote schema.
	 *
	 * @return array
	 */
	public function get_quote_scheme() {
		return array(
			'quote'  => array(
				'description' => __( 'The quote', 'example-plugin' ),
				'type'        => 'string',
				'readonly'    => true,
			),
			'author' => array(
				'description' => __( 'The author', 'example-plugin' ),
				'type'        => 'string',
				'readonly'    => true,
			),
		);
	}
}
