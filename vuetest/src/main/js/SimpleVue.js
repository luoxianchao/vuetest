function SimpleVue(opts) {
    this.$options = opts || {};
    var data = this._data = this.$options.data;
    var me = this;
    Object.keys(data).forEach(function (key) {
        me._proxyData(key);
    });
    this._initComputed();
    observe(data, this);
    this.$complie = new Complie(this.$options.el, this);
}

SimpleVue.prototype = {
    $watch: function (key, cb, options) {
        new Watcher(this, key, cb);
    },
    _proxyData: function (key, setter, getter) {
        var me = this;
        setter = setter ||
            Object.defineProperty(me, key, {
                configurable: false,
                enumerable: true,
                get: function proxyGetter() {
                    return me._data[key];
                },
                set: function proxySetter(newVal) {
                    me._data[key] = newVal;
                }
            });
    },

    _initComputed: function () {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get,
                    set: function () {
                    }
                });
            });
        }
    }
}

