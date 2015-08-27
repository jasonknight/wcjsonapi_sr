wcjsonapi_sr.last_order = null;
wcjsonapi_sr.createSlugFromName = function (name) {
    var slug = name;
    slug = slug.toLowerCase();
    slug = slug.replace(/[^a-z]/g, "-");
    return slug;
}

wcjsonapi_sr.send_to_wp = function (sender,item) {
    if ( ! wcjsonapi_sr.website_categories ) {
        wcjsonapi_sr.maybeShowErrors({errors: [ {text: "Please wait until cats are loaded."} ]});
        return;
    }
    //console.log(item);
    var product = {
        name: item.name,
        sku: item.sku,
        price: sr.fn.math.round(item.price_cents / 100,2),
        description: item.description,
        product_type: 'simple',
        type: 'product',
        weight: item.weight,
        height: item.height,
        length: item.length

    }
    product.quantity = item.quantity;
    product.visibility = "visible";
    product.manage_stock = 'yes';
    product.status = 'instock';
    product.allow_backorders = 'yes';
    

    var find_req = wcjsonapi_sr.prepareRequest('get_products');
    find_req.arguments.skus = [item.sku];
    sr.fn.messages.displayMessage("notice","WCJSONAPI: Getting Products...");
    wcjsonapi_sr.getRequest(find_req,function (data) {
        if ( data.payload.length > 0 ) {
            var website_product = data.payload[0];
            //console.log("Website Product Is: ", website_product);
            for ( k in product ) {
                if ( k == "description" || k == "categories" ) {
                    // We don't override the desc.
                    continue;
                }
                website_product[k] = product[k];
            }
            product = website_product;
        } else {
            var salor_category = null;
            for ( i in sr.data.resources.category_array ) {
                var cat = sr.data.resources.category_array[i];
                if ( cat.id == item.category_id ) {
                    salor_category = cat;
                    break;
                }
            }
            if ( salor_category ) {
                var website_category = null;
                for (i in wcjsonapi_sr.website_categories ) {
                    var cat = wcjsonapi_sr.website_categories[i];
                    if ( cat.name == salor_category.name ) {
                        website_category = cat;
                        break;
                    }
                }
                if ( ! website_category ) {
                    website_category = {taxonomy: 'product_cat',name: salor_category.name, slug: wcjsonapi_sr.createSlugFromName(salor_category.name) }
                }
                product.categories = [website_category];
            }
        }
        //console.log("Product is: ", product);
        var req = wcjsonapi_sr.prepareRequest('set_products');
        req.payload = [product];
        req.wcjsonapi_sr_sender = sender.attr('id');
        sr.fn.messages.displayMessage("notice","WCJSONAPI: Setting Products...");
        wcjsonapi_sr.getRequest(req,function (data) {
            sr.fn.messages.displayMessage("notice","WCJSONAPI: Done!");
            //console.log("set_products", data);
            wcjsonapi_sr.maybeShowErrors(data);
            wcjsonapi_sr.maybeShowNotifications(data);
        });
    });
}


wcjsonapi_sr.prepareRequest = function (name,existing_req) {
  var req = {};
  if ( existing_req )
    req = existing_req;
  var s = wcjsonapi_sr.getSettings();
  req.action = "woocommerce_json_api";
  req.proc = name;
  req.arguments = {
    token: wcjsonapi_sr.meta.token
  };
  req.errors = [];
  req.payload = [];
  req.notifications = [];
  req.store_name = jQuery('#store_name').val();
  return req;
}

wcjsonapi_sr.reveal = function (m) {
    // example: reveal(item) == "[object Object]"
    return Object.prototype.toString.call(m);
}
wcjsonapi_sr.getSettings = function () {
    return wcjsonapi_sr.meta;
}
wcjsonapi_sr.debug = function(txt) {
    if ( wcjsonapi_sr.meta.debug == 'yes' ) {
        //console.log(txt);
    }
}
wcjsonapi_sr.displayRequestDebug = function (req) {
    wcjsonapi_sr.debug(req);
}
wcjsonapi_sr.showProgressBar = function () {

}
wcjsonapi_sr.hideProgressBar = function () {

}
wcjsonapi_sr.maybeShowNotifications = function (req) {

}
wcjsonapi_sr.maybeShowErrors = function (req) {
    var text = "";
    if ( req.errors && req.errors.length > 0) {
        for ( i in req.errors ) {
            var error = req.errors[i];
            text += "<li>" + error.text + "</li>"
        }
        text = '<ul class="errors">' + text + '</ul>';
        var dialog = shared.draw.dialog("WooCommerce JSON API Errors",'wcjsonapi_sr_error_dialog',text);
    }

}
wcjsonapi_sr.getRequest = function(req, callback, options) {
    var s = wcjsonapi_sr.getSettings();
    //$.getJSON(s.url, req, onGetRequestComplete );
    wcjsonapi_sr.displayRequestDebug(req);
    wcjsonapi_sr.showProgressBar();
    $.ajax({
        type: "POST",
        url: wcjsonapi_sr.meta.url + "?jsonp=?",
        data: { json: JSON.stringify(req) },
        contentType: 'application/json',
        success: function(data) {

            if ( wcjsonapi_sr.meta.debug == 'yes' ) {
                console.log("getRequest RECEIVED:", data);
            }
            wcjsonapi_sr.maybeShowNotifications(data);
            wcjsonapi_sr.maybeShowErrors(data);
            wcjsonapi_sr.hideProgressBar();
            wcjsonapi_sr.statistics = data.statistics;
            if (callback) {
                callback(data);
            }

        },
        dataType: 'json',
        error: function (xhr,type) {
            if ( wcjsonapi_sr.meta.debug == 'yes' )
                console.log( "ERROR", xhr, type);
        }
    });

    if ( wcjsonapi_sr.meta.debug == 'yes' ) {
        console.log("getRequest SENT:", req);
    }
}
wcjsonapi_sr.update_server_quantities = function () {
    if ( sr.data.pos_core.last_completed_order.id != wcjsonapi_sr.last_order.id) {

        // we do this here just to be sure we don't spam the server
        wcjsonapi_sr.last_order = sr.data.pos_core.last_completed_order;


        var req = wcjsonapi_sr.prepareRequest('set_products_quantities',null);
        var products = [];
        var order_items = wcjsonapi_sr.last_order.order_items;
        for (i in order_items) {
            var item = order_items[i].item;
            var product = {"sku": item.sku, "quantity": item.quantity};
            products.push(product);
        }
        req.payload = products;
        sr.fn.messages.displayMessage("notice","WCJSONAPI: Setting Updating Online Store...");
        wcjsonapi_sr.getRequest(req,function (data) {
            sr.fn.messages.displayMessage("notice","WCJSONAPI: Done!");
            //console.log("set_products", data);
            wcjsonapi_sr.maybeShowErrors(data);
            wcjsonapi_sr.maybeShowNotifications(data);
        });

    }
}
$(function () {
    var req = wcjsonapi_sr.prepareRequest("get_categories")
    sr.fn.messages.displayMessage("notice","WCJSONAPI: Loading Categories...");
    wcjsonapi_sr.getRequest(req,function (data) {
        if ( data.status ) {
          sr.fn.messages.displayMessage("notice","WCJSONAPI: Loading Categories done!");
          wcjsonapi_sr.website_categories = data.payload;
        }
    });
    if ( sr.data.params.controller == 'orders' && sr.data.params.action == 'new' ) {
        console.log("We are on the pos page");
        wcjsonapi_sr.last_order = sr.data.pos_core.last_completed_order;
        setInterval(wcjsonapi_sr.update_server_quantities,2000);
    }
})