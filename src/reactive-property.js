var Events = require("../vendor/events/events.js");

function unsubscribe(prop) {
    var subs = prop._subs,
        sub;
    for (var i in subs) {
        sub = subs[i];
        prop.change().off(sub.token);
    }
    subs.length = 0;
}

function nestedSubscribe(prop, caller) {
    var val = prop._val;

    if (Array.isArray(val))
        for (var i in val)
            trySubscribe(prop, val[i], caller);
    else trySubscribe(prop, val, caller);
}

function trySubscribe(prop, val, caller) {
    if (typeof val === "function" && typeof val.change !== "undefined") {
        prop._subs.push(val.change(function () {
            prop.change(caller, caller());
        }));
    }
}

function accessor(prop, caller, newVal, quiet) {
    var val = prop._val;
    var validator = prop._validator;

    if (newVal === undefined)
        return val;

    if (validator !== null && !validator(newVal) || val === newVal)
        return caller;

    prop._oldVal = val;
    prop._val = newVal;

    unsubscribe(prop);
    nestedSubscribe(prop, caller);

    if (quiet === undefined || !quiet)
        prop.change(caller, newVal);

    return caller;
}

function on(prop, caller, listener, immediate, data) {
    var sub = prop.change().on(listener, data);

    if (immediate === true)
        listener(caller, caller(), data);

    return sub;
}

function off(prop, listenerOrSubscription) {
    return prop.change().off(listenerOrSubscription);
}

function change(prop, caller, a, b, c) {
    if (typeof a === "function")
        return on(prop, caller, a, b, c);
    else
        return off(prop, a);
}

function Prop(validator) {
    this.change = Events.event("change");
    this._validator = validator || null;
    this._subs = [];
}

Prop.prototype._validator = null;
Prop.prototype._subs = null;
Prop.prototype._val = undefined;
Prop.prototype._oldVal = undefined;

/**
 * @param {*} [defaultValue]
 * @param {function:boolean} [validation]
 * @returns {function} Accessor
 */
function reactiveProperty(defaultValue, validation) {
    var prop = new Prop(validation),
        facade;

    facade = function (newVal, quiet) {
        return accessor(prop, facade, newVal, quiet);
    };

    facade.change = function (a, b, c) {
        return change(prop, facade, a, b, c);
    };

    facade.old = function () {
        return prop._oldVal;
    };

    accessor(prop, facade, defaultValue, true);

    return facade;
}
module.exports = reactiveProperty;