var Events = require("../vendor/events/events");

function Property(host, defaultValue, validator) {
    this._host = host;

    if (validator !== undefined)
        this._validator = validator;

    this.set(defaultValue);
}

Property.prototype._old = undefined;
Property.prototype._val = undefined;

Property.prototype._validator = undefined;

Property.prototype._change = Events.event("change");

Property.prototype.get = function () {
    return this._val;
};

Property.prototype.set = function (val) {
    if ((this._validator === undefined || this._validator(val)) && val !== this._val) {
        this._old = this._val;
        this._val = val;
        this._change(this._host, val);
        return true;
    }
    return false;
};

Property.prototype.old = function () {
    return this._old;
};

Property.prototype.on = function (listener, immediate, data) {
    var s = this._change(listener, data);

    if (immediate)
        listener(this._host, this._val, data);

    return s;
};

Property.prototype.off = function (subscription) {
    return this._change(subscription);
};

module.exports = Property;