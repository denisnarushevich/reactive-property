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