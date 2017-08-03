<?php
/**
 * Copyright © Exocortex, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

/**
 * Bundle product threekit configurator (Clara)
 *
 * @author      Daniel@Exocortex.com
 */
class Exocortex_Threekit_Block_Bundlethreekit extends Mage_Catalog_Block_Product_View_Abstract
{
    protected $bundle;

    protected $view;

    protected $inited = false;

    protected function init()
    {
        if (!$this->inited) {
            $this->bundle = $this->getLayout()->getBlockSingleton('Mage_Bundle_Block_Catalog_Product_View_Type_Bundle');
            $this->view = $this->getLayout()->getBlockSingleton('Mage_Catalog_Block_Product_View');;
            $this->inited = true;
        }
    }

    public function getJsonConfig()
    {
        if (!$this->inited) {
            $this->init();
        }
        return $this->bundle->getJsonConfig();
    }

    public function getSubmitUrl($product, $additional = [])
    {
        if (!$this->inited) {
            $this->init();
        }
        return $this->view->getSubmitUrl($product, $additional);
    }

}
