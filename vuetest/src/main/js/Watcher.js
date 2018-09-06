function Watcher(vm, expOrFn, callback) {
    this.cb = callback;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};
    if (typeof expOrFn === 'function') {
        this.getter = expOrFn;
    } else {
        this.getter = this.parseGetter(expOrFn);
    }
    this.value = this.get();
}

Watcher.prototype = {
    update: function () {
        this.run();
    },
    run: function () {
        //获取当前值
        var value = this.get();
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    },
    addDep: function (dep) {
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    },
    get: function () {
        //当前的watcher
        Dep.target = this;
        //当前属性的getter
        var value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    },
    parseGetter: function (exp) {
        //简单类型
        if (/[^\w.$]/.test(exp)) return;
        var exps = exp.split('.');
        return function (obj) {
            for (var i = 0; i < exps.length; i++) {
                if (!obj) return;
                obj = obj[exps[i]];
            }
            return obj;
        }
    }
};