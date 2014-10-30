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

