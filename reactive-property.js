(function (global, Events) {
    function unsubscribe(subs) {
        for(var i in subs){
            Events.off(subs[i]);
        }
        subs.length = 0;
    }

    function fire(from, to, p) {
        Events.fire(p, "change", {
            from: from,
            to: to
        });
    }

    function nestedSubscribe(val, subs, oldVal, val, p) {
        if (typeof val === "object" || Array.isArray(val))
            for (var i in val)
                trySubscribe(val[i], subs, oldVal, val, p);
        else trySubscribe(val, subs, oldVal, val, p);
    }

    function trySubscribe(prop, subs, oldVal, val, p) {
        if (typeof prop === "function" && prop.toString() === p.toString()) {
            subs.push(prop.on(function () {
                fire(oldVal, val, p);
            }));
        }
    }

    function reactiveProperty(defaultValue, validation) {
        var oldVal = null;
        var val = undefined;
        var subs = [];

        property(defaultValue);

        /**
         * Read or write property
         * @param {*} [newValue]
         * @returns {*}
         */
        function property(newVal) {
            if (newVal === undefined)
                return val;

            if (validation !== undefined && !validation(newVal) || val === newVal)
                return property;

            oldVal = val;
            val = newVal;

            unsubscribe(subs);
            nestedSubscribe(val, subs, oldVal, newVal, property);

            fire(oldVal, newVal, property);

            return property;
        }

        /**
         * Subscribe to property's change
         * @param {function} listener
         * @param {boolean} immediate Fire immediately after subscription
         * @returns {int} Subscription id
         */
        property.on = function (listener, immediate) {
            var sub = Events.on(property, "change", listener, property);

            if (immediate === true)
                fire();

            return sub;
        };

        /**
         * Unsubscribe from property
         * @param {function|int} listenerOrSubscription Subscription id or listener
         */
        property.off = function (listenerOrSubscription) {
            Events.off(property, "change", listenerOrSubscription);
        };

        return property;
    }

    return this.reactiveProperty = reactiveProperty;
})(this, Events);