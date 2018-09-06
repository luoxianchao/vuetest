//Object.defineProperty()监听属性变动
function Observer(data) {
    this.data = data;
    this.init(data);
}

Observer.prototype = {
    init: function (data) {
        var self = this;
        Object.keys(data).forEach(function (key) {
            self.convert(key, data[key]);
        })
    },
    convert: function (key, value) {
        this.defineActive(this.data, key, value);
    },
    //使用Object.defineProperty()监听变化
    defineActive: function (data, key, value) {
        var dep = new Dep();
        var child = observe(value); // 子对象被监听

        Object.defineProperty(data, key, {
            enumerable: true,//此属性可被枚举的
            configurable: false, // 此属性不可以被重新定义
            set: function (newValue) {
                //如果没有发生变化不做更新
                if (newValue === value) return;
                console.log('observer value change');
                value = newValue;
                //若新值为object，则监听
                child = observe(newValue);
                dep.notify();//通知订阅者更新
            },
            get: function () {
                if (Dep.target) {
                    dep.depend();
                }
                return value;
            }
        })
    }
};

function observe(value, vm) {
    if (!value || typeof value !== 'object') return;
    //遍历被监听数据对象，若存在子对象，递归调用Observer
    return new Observer(value);
}

var uid = 0;

//收集订阅者用于在配置监听数据变化时，可以通知到订阅者，进行更新操作
function Dep() {
    this.id = uid++;
    this.subs = [];//订阅者列表，用一个数组存放当前数据模型的所有订阅者
}

Dep.prototype = {
    addSub: function (sub) {
        //添加订阅者
        this.subs.push(sub);
    },
    depend: function () {
        Dep.target.addDep(this);
    },
    notify: function () {
        //所有订阅者接收到通知，调用更新回调
        this.subs.forEach(function (sub) {
            sub.update();
        })
    },
    removeSub: function (sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    }
};
Dep.target = null;