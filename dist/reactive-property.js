!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.reactiveProperty=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    if (typeof val === "function" && typeof val.onChange !== "undefined") {
        prop._subs.push(val.onChange(function () {
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

    facade.onChange = function (a, b, c) {
        return change(prop, facade, a, b, c);
    };

    facade.old = function () {
        return prop._oldVal;
    };

    accessor(prop, facade, defaultValue, true);

    return facade;
}
module.exports = reactiveProperty;
},{"../vendor/events/events.js":3}],2:[function(require,module,exports){
var Subscription = require("./subscription");

function offByToken(e, token) {
    var subs = e._subs;
    var subsArr = e._subsArr;
    var idx = subsArr.indexOf(subs[token]);
    if (idx !== -1) {
        subsArr[idx] = undefined;
        delete subs[token];
        return true;
    }
    return false;
}

function offByHandler(e, handler) {
    var subs = e._subs,
        subsArr = e._subsArr,
        l = subsArr.length,
        sub, i;

    for (i = 0; i < l; i++) {
        sub = subsArr[i];
        if (sub !== undefined && sub.handler === handler) {
            subsArr[i] = undefined;
            delete subs[sub.token];
            return true;
        }
    }
    return false;
}

function off(e, tokenOrHandler) {
    if (typeof tokenOrHandler === "function")
        return offByHandler(e, tokenOrHandler);

    return offByToken(e, tokenOrHandler);
}

function on(e, handler, data, once) {
    if (typeof handler !== "function")
        throw "Event handler should be a function";

    var token = e._lastToken++;
    var s = new Subscription(token, handler, data, once);

    e._subsArr.push(s);
    e._subs[token] = s;

    return token;
}

function once(e, handler, data) {
    return on(e, handler, data, true);
}

function fire(e, sender, args) {
    var i,
        subs = e._subsArr,
        l = subs.length,
        sub, handler,
        cleanUp = false;

    for (i = 0; i < l; i++) {
        sub = subs[i];

        if (sub === undefined) {
            cleanUp = true;
            continue;
        }

        if (sub.once)
            offByToken(e, sub.token);

        handler = sub.handler;
        handler(sender, args, sub.data);
    }

    if (cleanUp === true) {
        for (i = l - 1; i !== -1; i--)
            if (subs[i] === undefined)
                subs.splice(i, 1);
    }
}

function Event() {
    this._subsArr = [];
    this._subs = Object.create(null);
    this._lastToken = 0;
}

Event.on = on;
Event.off = off;
Event.once = once;
Event.fire = fire;

Event.prototype._subs = null;
Event.prototype._subsArr = null;

Event.prototype.on = function (handler, data) {
    return on(this, handler, data);
};

Event.prototype.once = function (handler, data) {
    return once(this, handler, data);
};

Event.prototype.off = function (tokenOrHandler) {
    return off(this, tokenOrHandler);
};

Event.prototype.fire = function (sender, args) {
    return fire(this, sender, args);
};

module.exports = Event;
},{"./subscription":4}],3:[function(require,module,exports){
var Event = require("./event");

/**
 * Retrieve Event object from host
 * @param host
 * @param name
 * @returns {*}
 */
function event(host, name){
    var e, events = host._events;

    if (events === undefined)
        events = host._events = Object.create(null);

    e = events[name];

    if (e === undefined)
        e = events[name] = new Event();

    return e;
}

/**
 * Subscribe to event of a given object
 * @param host {object}
 * @param name {string|number} Event name
 * @param handler {function}
 * @param data {object} Data that will be passed to callback
 * @param [once] {boolean}
 * @returns {number} Subscription id
 */
function on(host, name, handler, data) {
    var on = Event.on; //cached func runs faster
    return on(event(host, name), handler, data);
}

function once(host, name, handler, data) {
    var once = Event.once; //cached func runs faster
    return once(event(host, name), handler, data);
}

/**
 * Unsubscribe from event of a given object
 * @param host {object}
 * @param event {string|number} Event id
 * @param tokenOrListener {number|function} Subscription id or handler
 * @returns {boolean}
 */
function off(host, event, tokenOrListener) {
    var e, off = Event.off;

    if (host._events === undefined || host._events[event] === undefined)
        return false;

    e = host._events[event];

    return off(e, tokenOrListener);
}

/**
 * Dispatch an event of a given object
 * @param host {object}
 * @param event {string|number} Event id
 * @param [c] {object} Sender argument that will be passed to callback
 * @param d {object} Event arguments that will be passed to callback
 */
function fire(host, event, c, d) {
    var sender, args;

    if (d === undefined) {
        sender = host;
        args = c;
    } else {
        sender = c;
        args = d;
    }

    return _fire(host, event, sender, args);
}

function _fire(host, event, sender, args){
    if (host._events === undefined || host._events[event] === undefined)
        return;

    var fire = Event.fire; //cached func runs faster
    fire(host._events[event], sender, args);
}

function callableEvent(name) {
    function ev(sender, args) {
        if(sender === undefined && args === undefined) {
            return event(this, name);
        }else
            return _fire(this, name, sender, args);
    }

    return ev;
}

function Events(){
    this.on = on;
    this.once = once;
    this.off = off;
    this.fire = fire;
    this.event = callableEvent;
    this.Event = Event;
}

module.exports = new Events();


},{"./event":2}],4:[function(require,module,exports){
function Subscription(token, handler, data, once){
    this.handler = handler;
    this.data = data;
    this.once = once || false;
    this.token = token;
}

Subscription.prototype.token = -1;
Subscription.prototype.handler = null;
Subscription.prototype.data = null;
Subscription.prototype.once = null;

module.exports = Subscription;
},{}]},{},[1])(1)
});