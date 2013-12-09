// Token: 12345
// Alternative URL: http://clientreview.thebigrede.net/wp-content/plugins/woocommerce-json-api/api.php

Salor.log_action_plugin("wcjsonapi_sr: Initializing Plugin WCJSON API");
// Use plugins. inside your functions, but don't use plugins.
// when registering a handler, as all handlers, hooks, filters
// are already relative to plugins.
plugins.wcjsonapi_sr = {
  conf: {},
  item_list_columns: function (cols) {
    // When we return strings, they need to be localized,
    // an entry for each supported language if that key isn't
    // already in the translation files.
    cols.push({name: 'wcjsonapi_sr_send_to_wp','en': "Send to WP"});
    return cols;
  },
  item_list_column: function (params) {
    var item = params.item;
    var col = params.column;
    Salor.log_action_plugin("wcjsonapi_sr: Params are: " + JSON.stringify(params));
    if ( col['name'] == 'wcjsonapi_sr_send_to_wp') {
      Salor.log_action_plugin("wcjsonapi_sr: col name was correct");
      params.column = '<img class="wc-jsonapi-sr-send-item-button" style="cursor:pointer;" id="send_to_wp_for_' + item.id + '" src="' + PLUGINS_BASE_URL + '/wcjsonapi_sr/wordpress_logo.svg" height="16"/>';
      params.column += '<script type="text/javascript">$("#send_to_wp_for_' + item.id + '").on("click",function () { wcjsonapi_sr.send_to_wp($(this),'+ JSON.stringify(item) +');});</script>'
    } else {
      Salor.log_action_plugin("wcjsonapi_sr: was not correct");
    }
    return params;
  },
  plugin_meta_fields_for_wcjsonapi_sr: function (fields) {
    var fields = {
      token: {
        name: "token",
        type: 'text',
        size: '55'
      },
       url: {
        name: "url",
        type: 'text',
        size: '80'
      }
    };
    return fields;
  }
}
/*
  This is optional, in case you want to save
*/
for (key in __plugin__) {
  plugins.wcjsonapi_sr.conf[key] = __plugin__[key];
}
Salor.add_filter('item_list_columns','wcjsonapi_sr.item_list_columns');
Salor.add_filter('item_list_column','wcjsonapi_sr.item_list_column');
Salor.add_filter('plugin_meta_fields_for_wcjsonapi_sr','wcjsonapi_sr.plugin_meta_fields_for_wcjsonapi_sr');


