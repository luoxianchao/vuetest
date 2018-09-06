var compileUtil = {
    text: function (node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    html: function (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model');
        var me = this, val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            me._setVMVal(vm, exp, newValue);
            val = newValue;
        })
    },
    class: function (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },
    bind: function (node, vm, exp, dir) {
        var updateFn = updater[dir + 'Updater'];
        // 第一次初始化视图
        updateFn && updateFn(node, this._getVMVal(vm, exp));
        // 实例化订阅者，此操作会在对应的属性消息订阅器中添加了该订阅者watcher
        new Watcher(vm, exp, function (value, oldValue) {
            // 一旦属性值有变化，会收到通知执行此更新函数，更新视图
            updateFn && updateFn(node, value, oldValue);
        });
    },
    // 事件处理
    eventHandler: function (node, vm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    _getVMVal: function (vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function (vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

var updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value;
    },
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value === 'undefined' ? '' : value;
    },
    modelUpdater: function (node, value) {
        node.value = typeof value === 'undefined' ? '' : value;
    },
    classUpdater: function (node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    }
}

//因为遍历过程中会涉及到多次的dom操作，为了避免产生的性能问题，这里会先将el转换成文档碎片fragment
function Complie(el, vm) {
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}

Complie.prototype = {
    init: function () {
        this.compileElement(this.$fragment)
    },
    node2Fragment: function (el) {
        var fragment = document.createDocumentFragment(), child;
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },
    compileElement: function (el) {
        //遍历所有节点及其子节点，进行解析编译并且调用指令对应的渲染函数渲染数据，以及指令对应的更新函数进行绑定
        var childNodes = el.childNodes, me = this;
        //把childNodes转换成数组，并进行遍历
        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/; //表达式文本
            //按元素节点方式编译
            if (me.isElementNode(node)) {
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) {
                me.compileText(node, RegExp.$1);
            }
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },
    compile: function (node) {
        var nodeAttr = node.attributes, me = this;
        [].slice.call(nodeAttr).forEach(function (attr) {
            //规定指令以v-xxx开头
            var attrName = attr.name;
            if (me.isDirective(attrName)) {
                //判断是否是指令属性
                var exp = attr.value;//指令的表达式
                var dir = attrName.substring(2);//指令的类型
                if (me.isEventDirective(attrName)) {
                    //事件类型指令
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                    // 普通指令，此处是否支持自定义指令？
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
                node.removeAttribute(attrName);
            }
        })
    },
    compileText: function (node, exp) {
        complieUtil.text(node, this.$vm, exp);
    },
    isDirective: function (attrName) {
        return attrName.indexOf('v-') === 0;
    },
    isEventDirective: function (attrName) {
        return attrName.indexOf('v-on') === 0;
    },
    isElementNode: function (node) {
        return node.nodeType === 1;
    },
    isTextNode: function (node) {
        return node.nodeType === 3;
    }
}
