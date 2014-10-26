(function (global, Events) {
    function unsubscribe(prop) {
        var subs = prop._subs,
            sub;
        for (var i in subs) {
            sub = subs[i];
            Events.off(sub.target, events.change, sub.token);
        }
        subs.length = 0;
    }

    function fire(prop) {
        Events.fire(prop, events.change, prop._facade);
    }

    function nestedSubscribe(prop) {
        var val = prop._val;

        if (Array.isArray(val))
            for (var i in val)
                trySubscribe(prop, val[i]);
        else trySubscribe(prop, val);
    }

    function trySubscribe(prop, val) {
        if (typeof val === "function" && typeof val._isReactiveProperty !== "undefined") {
            prop._subs.push(val.on(function () {
                fire(prop);
            }));
        }
    }

    var events = {
        change: "change"
    };

    /**
     * @param {*} defaultValue
     * @param {function:bool} [validator]
     * @returns {function(this:Prop)}
     * @constructor
     */
    function Prop(defaultValue, validator) {
        this._validator = validator || null;
        this._subs = [];
        this.accessor(defaultValue);

        this._facade = Prop.prototype.accessor.bind(this);
        this._facade.on = Prop.prototype.on.bind(this);
        this._facade.off = Prop.prototype.off.bind(this);
        this._facade.old = Prop.prototype.old.bind(this);
        this._facade._isReactiveProperty = true;

        return this._facade;
    }

    Prop.events = events;

    Prop.prototype._validator = null;
    Prop.prototype._subs = null;
    Prop.prototype._val = undefined;
    Prop.prototype._oldVal = undefined;

    /**
     * @param {*} [newVal]
     * @returns {Prop}
     */
    Prop.prototype.accessor = function (newVal, quiet) {
        var val = this._val;
        var validator = this._validator;

        if (newVal === undefined)
            return val;

        if (validator !== null && !validator(newVal) || val === newVal)
            return this._facade;

        this._oldVal = val;
        this._val = newVal;

        unsubscribe(this);
        nestedSubscribe(this);

        if (quiet === undefined || !quiet)
            fire(this);

        return this._facade;
    };

    Prop.prototype.old = function () {
        return this._oldVal;
    };

    /**
     * Subscribe to property change
     * @param {function} listener
     * @param {boolean} immediate Call listener immediately after subscription
     * @param {*} data Will be passed to listener
     * @returns {int}
     */
    Prop.prototype.on = function (listener, immediate, data) {
        var sub = Events.on(this, events.change, listener, data);

        if (immediate === true)
            listener(this, this._facade, data);

        return sub;
    };

    /**
     * Unsubscribe from property
     * @param {function|int} listenerOrSubscription Listener or subscription id
     */
    Prop.prototype.off = function (listenerOrSubscription) {
        return Events.off(this, events.change, listenerOrSubscription);
    };

    /**
     * @param {*} defaultValue
     * @param {function:boolean} validation
     * @returns {Prop}
     */
    function reactiveProperty(defaultValue, validation) {
        return new Prop(defaultValue, validation);
    }

    return this.reactiveProperty = reactiveProperty;
})(this, Events);