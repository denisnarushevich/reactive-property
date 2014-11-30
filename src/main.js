var ReactiveProperty = require("./r");
var Events = require("../vendor/events/events");

var OLD = {};
var CHANGE = {};

function Accessor(host, key, defaultValue, validator){
    var prop = new ReactiveProperty(host, defaultValue, validator);

    function accessor(a, b, c, d) {
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

    accessor.OLD = OLD;
    accessor.CHANGE = CHANGE;

    return accessor;
}

function determineKey(host, accessor) {
    for (var key in host) {
        if (host[key] === accessor)
            return key;
    }
}

module.exports = function (defaultValue, validator) {
    function definitor() {
        var host = this;
        var key = determineKey(host, definitor);
        var accessor = Accessor(host, key, defaultValue, validator);

        host[key] = accessor;

        return accessor.apply(host, arguments);
    }

    definitor.OLD = OLD;
    definitor.CHANGE = CHANGE;

    return definitor;
};