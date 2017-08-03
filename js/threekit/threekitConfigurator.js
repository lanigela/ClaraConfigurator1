/**
 * Copyright © Exocortex, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

 class ThreekitConfigurator {
  constructor(options) {
    this.options = {
      optionConfig: null,
      submitUrl: null,
      formKey: null,
      productId: null
    };

    if (options) {
      this.options.optionConfig = options.optionConfig;
      this.options.submitUrl = options.submitUrl;
      this.options.formKey = options.formKey;
      this.options.productId = options.productId;
    }
    console.log(options.optionConfig);

    /*
    * map clara config to magento option id
    */
    this.configMap = null;

    /*
    * type can be Options, Number, Boolean, Color
    */
    this.configType = null;

    /* for a config option in clara, if a mapping in magento config cannot be found,
    *  treat it as an additional text field when add to cart
    */
    this.additionalOptions = null;

    this.claraConfig = null;

    this.currentConfig = null;

    this.currentConfigVolume = null;

    this.magentoConfig = null;

    this.isMapCreated = false;

    this.dimensions = null;

    this._create();

  }

  _create () {
    var self = this;
    this._setupConfigurator(window.clara.api);
      /*require(["cillowreact"], function (){
        // setup configurator
        self._setupConfigurator(window.clara.api);
      });*/
    }

    _setupConfigurator (clara) {
      var self = this;
      // clara is already loaded at this point

      this.dimensions = ['Height', 'Width (A)', 'Depth'];

      clara.on('configurationChange', function (ev) {
        self.currentConfig = clara.configuration.getConfiguration();
        if (!self.isMapCreated) {
          self.additionalOptions = [];
          self.magentoConfig = self.options.optionConfig.options;
          self.claraConfig = window.clara.api.configuration.getAttributes();
          self.configMap = self._mappingConfiguration();
          self.configType = self._createConfigType();
          self._generatePostData();
          self.isMapCreated = true;
        }
        self._updatePrice();
      });

      // setup addToCartHandle
      window.clara.attachCheckoutHander(function() {
        var jsForm = self._generatePostData();
        self._submitForm(jsForm);
      });
    }

    _submitForm (form) {
      var self = this;

      const postParams = Object.keys(form).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(form[key]);
      }).join('&');

      var xhr = new XMLHttpRequest();
      xhr.open('POST', self.options.submitUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onload = function() {
        console.log(xhr.status);
          document.location.href = xhr.responseURL;
      };
      xhr.send(postParams);
      /*$.ajax({
        url: self.options.submitUrl,
        data: postParams,
        type: 'post',
        contentType: 'application/x-www-form-urlencoded',


        success: function (res) {
          console.log(res);
        }
      });*/
    }

    _createConfigType () {
      var claraConfig = this.claraConfig;
      var configType = new Map();
      for (var key in claraConfig) {
        configType.set(claraConfig[key].name, claraConfig[key].type);
      }
      return configType;
    }

    // map clara configuration with magento (reverse map of this.options.optionConfig.options)
    /* this.options.optionConfig.options structure
    * options[key]:
    *               - title
    *               - selections[key]
    *                                  - name
    *  task: reverse the above key-value
    * config[title]:
    *               - key
    *               - selections[name]
    *                                  - key
    *
    * Note: title and name in config and options have to be exactly the name string
    * Name and title are unique
    * Make sure it's an one-to-one mapping, otherwise report error
    */
    _mappingConfiguration () {
      var claraCon = this.claraConfig;
      var magentoCon = this.magentoConfig;
      var claraKey = new Map();
      var claraSelectionKey = new Map();
      claraSelectionKey.set('keyInParent', 'values');
      claraSelectionKey.set('type', 'array');
      claraKey.set('key', 'name');
      claraKey.set('type', 'object');
      claraKey.set('nested', claraSelectionKey);

      var magentoKey = new Map();
      var magentoSelectionKey = new Map();
      magentoSelectionKey.set('keyInParent', 'selections');
      magentoSelectionKey.set('type', 'object');
      magentoSelectionKey.set('matching', 'endsWith');
      magentoSelectionKey.set('key', 'name');
      magentoKey.set('key', 'title');
      magentoKey.set('type', 'object');
      magentoKey.set('matching', 'exactly');
      magentoKey.set('nested', magentoSelectionKey);

      // add volume price to claraCon
      var volumePrice = {
        name: "Volume_Price",
        type: 'Options',
        values: ['Leather_Price', 'Fabric_Price']
      };
      claraCon.push(volumePrice);

      var map = this._reverseMapping(magentoCon, magentoKey, claraCon, claraKey, this.additionalOptions);
      if (!map) {
        console.error("Auto mapping clara configuration with magento failed");
        return null;
      }
      console.log(map);
      console.log(this.additionalOptions);

      return map;
    }


    // recursively reverse mapping in primary using target as reference
    _reverseMapping (primary, primaryKey, target, targetKey, optionsNotFound) {
      // result (using ES6 map)
      var map = new Map();
      // save the values in target that already find a matching, to ensure 1-to-1 mapping
      var valueHasMapped = new Map();

      // complexity = o(n^2), could be reduced to o(nlog(n))
      for (var pKey in primary) {
        var primaryValue = primaryKey.get('type') === 'object' ? primary[pKey][primaryKey.get('key')] : primary[pKey];
        if (!primaryValue) {
          console.error("Can not read primaryKey from primary");
          return null;
        }
        // search for title in claraCon
        var foundMatching = false;
        for (var tKey in target) {
          var targetValue = targetKey.get('type') === 'object' ? target[tKey][targetKey.get('key')] : target[tKey];
          if (!targetValue) {
            console.error("Can not read  targetKey from target");
            return null;
          }
          if (typeof primaryValue !== 'string' || typeof targetValue !== 'string') {
            console.error("Primary or target attribute value is not a string");
            return null;
          }
          var matching = false;
          if (primaryKey.get('matching') === 'exactly') {
            matching = (primaryValue === targetValue);
          }
          else if(primaryKey.get('matching') === 'endsWith') {
            matching = (primaryValue.endsWith(targetValue));
          }
          if (matching) {
            if (valueHasMapped.has(targetValue)) {
              console.error("Found target attributes with same name, unable to perform auto mapping");
              return null;
            }
            // find a match
            valueHasMapped.set(targetValue, true);
            var mappedValue = new Map();
            mappedValue.set('id', pKey);
            // recursively map nested object until primaryKey and targetKey have no 'nested' key
            if (primaryKey.has('nested') && targetKey.has('nested')) {
              var childMap = null;
              switch (target[tKey].type) {
                case 'Number':
                childMap = [primaryValue];
                break;
                case 'Options':
                childMap = target[tKey][targetKey.get('nested').get('keyInParent')]
                break;
                case 'Boolean':
                childMap = ['true', 'false'];
                break;
                case 'Color':
                break;
              }
              var nestedMap = this._reverseMapping(primary[pKey][primaryKey.get('nested').get('keyInParent')],
               primaryKey.get('nested'),
               childMap,
               targetKey.get('nested'),
               null);
              mappedValue.set('options', nestedMap);
            }
            else{
              // this is a leaf node, copy price info into it
              mappedValue.set('price', primary[pKey]['price']);
            }
            map.set(targetValue, mappedValue);
            foundMatching = true;
            break;
          }
        }
        if (!foundMatching) {
          console.warn("Can not find primary value " + primaryValue + " in target config");
        }
      }

      // check all target to see if all target value has been mapped
      if (optionsNotFound) {
        for (var tKey in target) {
          var targetValue = targetKey.get('type') === 'object' ? target[tKey][targetKey.get('key')] : target[tKey];
          if (!valueHasMapped.has(targetValue)) {
            if (targetKey.has('nested')) {
              optionsNotFound.push(targetValue);
            }
            else {
              console.warn("Target value " + targetValue + " has not been mapped!");
            }
          }
        }
      }
      return map;
    }

    // check if clara configuration match with magento
    _validateConfiguration(claraCon, magentoCon) {

    }

    _generatePostData() {
      var result = {};
      var config = this.currentConfig;
      result['product'] = this.options.productId;
      result['form_key'] = this.options.formKey;
      if (!config) {
        return result;
      }

      var map = this.configMap;
      var configType = this.configType;
      var additionalOptions = this.additionalOptions;
      var dimensions = this.dimensions;
      var volume = 1;
      var additionalObj = {};
      for (var attr in config) {
        if (map.has(attr)) {
          var attrId = map.get(attr).get('id');
          switch (configType.get(attr)) {
            case 'Number':
              // update number
              if (dimensions.includes(attr)) {
                volume = config[attr] * volume;
              }
              var attrValue = map.get(attr).get('options').get(attr).get('id')
              result['bundle_option[' + attrId + ']'] = attrValue;
              result['bundle_option_qty[' + attrId + ']'] = config[attr];
              break;
              case 'Options':
              // update options
              // choose from leather or fabric
              if (attr === "Fabric Options" && config["Cover Material"] === "Leather" ||
                attr === "Leather Options" && config["Cover Material"] === "Fabric") {
                break;
            }
              // sometimes config[attr] is an obj...
              var configString = typeof config[attr] == 'string' ? config[attr] : config[attr].value;
              var attrValue = map.get(attr).get('options').get(configString).get('id');
              result['bundle_option[' + attrId + ']'] = attrValue;
              result['bundle_option_qty[' + attrId + ']'] = '1';
              break;
              case 'Boolean':
              // update boolean
              var attrValue = map.get(attr).get('options').get(config[attr].toString()).get('id');
              result['bundle_option[' + attrId + ']'] = attrValue;
              result['bundle_option_qty[' + attrId + ']'] = '1';
              break;
              case 'Color':
              // color will be treated as additional option
              break;
            }


          }
          else if (additionalOptions.includes(attr)) {
            var optionString = "";
            if (typeof config[attr] == 'string') {
              optionString = config[attr];
            }
            else if (typeof config[attr] == 'number') {
              if (dimensions.includes(attr)) {
                volume = config[attr] * volume;
              }
              optionString = config[attr].toString();
            }
            else if (typeof config[attr] == 'object') {
              for (var key in config[attr]) {
                if (config[attr].hasOwnProperty(key)) {
                  optionString = optionString + key + ": " + config[attr][key] + " ";
                }
              }
            }
            else {
              console.warn("Don't know how to print " + attr);
            }
            additionalObj[attr] = optionString;
          }
          else {
            console.warn(attr + " not found in config map");
          }
        }
      // update volume price
      volume = volume / 10;
      var materialPrice = config['Cover Material'] === "Leather" ? "Leather_Price" : "Fabric_Price";
      var volumeId = map.get('Volume_Price').get('id');
      var volumeOptionId = map.get('Volume_Price').get('options').get(materialPrice).get('id');
      result['bundle_option[' + volumeId + ']'] = volumeOptionId;
      result['bundle_option_qty[' + volumeId + ']'] = volume;

      // update additional options
      result['clara_additional_options'] = JSON.stringify(additionalObj);

      this.currentConfigVolume = volume;

      return result;
    }

    _isNumber (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }


    _updatePrice () {
      var volume = this.currentConfigVolume;
      var config = this.currentConfig;
      var map = this.configMap;
      // volume price based on material
      var materialPrice = config['Cover Material'] === "Leather" ? "Leather_Price" : "Fabric_Price";
      var unitPrice = map.get('Volume_Price').get('options').get(materialPrice).get('price');
      var result = volume ? volume * unitPrice : 0;

      for (var key in config) {
        if (map.has(key)) {
          var optionMap = map.get(key).get('options');
          if (optionMap.has(config[key])) {
            result += map.get(key).get('options').get(config[key]).get('price');
          }
        }
      }

      if (window.clara.updatePrice) {
        window.clara.updatePrice(result.toFixed(2));
      }
    }

  }

