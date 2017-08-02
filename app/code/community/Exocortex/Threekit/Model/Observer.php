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
                    $layout1 = $observer->getData('layout');
                    if($layout1) {
                        Mage::log("layout1", Zend_Log::DEBUG, "threekit.log");
                    }
                    $layout2 = $observer->getEvent()->getLayout();
                    if ($layout2) {
                        Mage::log("layout2", Zend_Log::DEBUG, "threekit.log");
                    }
                }
            }
        }
        return ;
    }
}
