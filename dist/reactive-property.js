!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.reactiveProperty=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Events = require("../vendor/events/events");

function Property(host, defaultValue, validator){
    this._host = host;

    if(validator !== undefined)
        this._validator = validator;

    this.set(defaultValue);
}

Property.prototype._old = undefined;
Property.prototype._val = undefined;

Property.prototype._validator = undefined;

Property.prototype._change = Events.event("change");

Property.prototype.get = function(){
    return this._val;
};

Property.prototype.set = function(val){
    if((this._validator === undefined || this._validator(val)) && val !== this._val){
        this._old = this._val;
        this._val = val;
        this._change(this._host, val);
        return true;
    }
    return false;
};

Property.prototype.old = function(){
    return this._old;
};

Property.prototype.on = function(listener, immediate, data){
    var s = this._change(listener, data);

    if(immediate)
        listener(this._host, this._val, data);

    return s;
};

Property.prototype.off = function(subscription){
    return this._change(subscription);
};

module.exports = Property;
},{"../vendor/events/events":4}],2:[function(require,module,exports){
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
},{"../vendor/events/events":4,"./ReactiveProperty":1}],3:[function(require,module,exports){
var Subscription = require("./subscription");

function offByToken(e, sub) {
    var tkn = sub.token;
    var subs = e._subs;
    var subsArr = e._subsArr;
    var idx = subsArr.indexOf(sub);
    if (idx !== -1) {
        subsArr[idx] = undefined;
        delete subs[tkn];
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

    return s;
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
            offByToken(e, sub);

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
},{"./subscription":5}],4:[function(require,module,exports){
var Event = require("./event");
var Subscription = require("./subscription");

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
    function ev(a, b) {
        if(a === undefined && b === undefined) {
            return event(this, name);
        }else if(a instanceof Subscription){
            return off(this, name, a);
        }else if(typeof a === "function"){
            return on(this, name, a, b);
        }else {
            return _fire(this, name, a, b);
        }
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
    this.Subscription = Subscription;
}

module.exports = new Events();


},{"./event":3,"./subscription":5}],5:[function(require,module,exports){
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
},{}]},{},[2])(2)
});