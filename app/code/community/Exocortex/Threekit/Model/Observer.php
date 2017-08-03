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
        $item = $observer->getQuoteItem();

        $additionalOptions = array();

        if ($additionalOption = $item->getOptionByCode('additional_options')){
            $additionalOptions = (array) unserialize($additionalOption->getValue());
        }

        $action = Mage::app()->getFrontController()->getAction();

        if ($action->getFullActionName() == 'checkout_cart_add') {
            $post = $action->getRequest()->getParam('clara_additional_options');
            $decodePost = json_decode($post, true);

            if(is_array($decodePost)){
                foreach($decodePost as $key => $value){
                    if($key == '' || $value == ''){
                        continue;
                    }

                    $additionalOptions[] = [
                        'label' => $key,
                        'value' => $value
                    ];
                }
            }
            else {
                $additionalOptions[] = [
                        'label' => 'Option(s)',
                        'value' => $decodePost
                    ];
            }

            if(count($additionalOptions) > 0){
                $item->addOption(array(
                    'product_id' => $item->getProductId(),
                    'code' => 'additional_options',
                    'value' => serialize($additionalOptions)
                ));
            }
        }
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
