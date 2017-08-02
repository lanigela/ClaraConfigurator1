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

    public function addAdditionalOptionsToQuote()
    {

    }

    public function addAdditionalOptionsToSale()
    {

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
