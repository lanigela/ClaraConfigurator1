<?php
/**
 * Copyright © Exocortex, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

/**
 * Threekit observer model
 *
 * @category   Exocortex
 * @package    Exocortex_Threekit
 * @author      Daniel <Daniel@Exocortex.com>
 */
class Exocortex_Threekit_Model_Observer
{

    public function addAdditionalOptionsToQuote($observer)
    {
        // set the additional options on the product
        $action = Mage::app()->getFrontController()->getAction();
        if ($action->getFullActionName() == 'checkout_cart_add')
        {
            Mage::log("checkout_cart_add", Zend_Log::DEBUG, "threekit.log");
            // assuming you are posting your custom form values in an array called extra_options...
            if ($options = $action->getRequest()->getParam('clara_additional_options'))
            {
                $decodePost = json_decode($options, true);
                $product = $observer->getProduct();

                // add to the additional options array
                $additionalOptions = array();
                if ($additionalOption = $product->getCustomOption('additional_options'))
                {
                    $additionalOptions = (array) unserialize($additionalOption->getValue());
                }
                foreach ($decodePost as $key => $value)
                {
                    $additionalOptions[] = array(
                        'label' => $key,
                        'value' => $value,
                    );
                }
                // add the additional options array with the option code additional_options
                $observer->getProduct()
                    ->addCustomOption('additional_options', serialize($additionalOptions));
            }
        }
    }

    public function addAdditionalOptionsToSale($observer)
    {
        $quoteItem = $observer->getItem();
        if ($additionalOptions = $quoteItem->getOptionByCode('additional_options')) {
            $orderItem = $observer->getOrderItem();

            $options = $orderItem->getProductOptions();
            $options['additional_options'] = unserialize($additionalOptions->getValue());
            $orderItem->setProductOptions($options);
        }
    }

    public function replaceBundleLayout($observer)
    {
        if ($observer->getEvent()->getAction()->getFullActionName()=='catalog_product_view'){
            $product = Mage::registry('current_product');
            if ($product) {
                $attr = $product->getData('threekit');
                if ($attr && !strcmp($attr, '1')) {
                    $layout = $observer->getData('layout');

                    $update = $layout->getUpdate();
                    $handles = $update->getHandles();

                    // remove default bundle layout
                    foreach ($handles as $handle) {
                        if ($handle == 'PRODUCT_TYPE_bundle') {
                            $update->removeHandle($handle);
                        }
                    }

                    $update->addHandle('PRODUCT_TYPE_bundle_threekit');
                }
            }
        }
        return ;
    }
}
