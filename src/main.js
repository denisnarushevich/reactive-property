var ReactiveProperty = require("./ReactiveProperty");
var Events = require("../vendor/events/events");

var OLD = {};
var CHANGE = {};

function determineKey(host, accessor) {
    for (var key in host) {
        if (host[key] === accessor)
            return key;
    }
}

module.exports = function (defaultValue, validator) {
    function reactiveProperty(a, b, c, d) {
        var host = this;

        var key = "__" + determineKey(host, reactiveProperty);

        var prop = host[key];

        if (prop === undefined)
            prop = host[key] = new ReactiveProperty(host, defaultValue, validator);

        if (arguments.length === 0) {
            return prop.get();
        } else if (a === CHANGE) {
            if (b instanceof Events.Subscription) {
                return prop.off(b);
            } else {
                return prop.on(b, c, d);
            }
        } else if (a === OLD) {
            return prop.old();
        } else {
            return prop.set(a);
        }
    }

    reactiveProperty.OLD = OLD;
    reactiveProperty.CHANGE = CHANGE;

    return reactiveProperty;
};