AbiHtml = function(abiString, config) {
    // set propeties not specifid by the user
    if (!config) config = {}
    this.config = this.applyMissingDefaults(config)

    this.functions = []
    this.events = []
    this.abi = []
    this.abi = this.loadAbi(abiString);
}

AbiHtml.prototype.applyMissingDefaults = function(userConfig) {
    // define default values here
    var defaultConfig = {
        function: {},
        event: {}
    }

    // safety check
    if (!userConfig) userConfig = {}

    // apply default properties to missing user properties
    for (var k in defaultConfig) {
        if (!userConfig.hasOwnProperty(k))
            userConfig[k] = defaultConfig[k]
    }

    return userConfig
}


AbiHtml.prototype.loadAbi = function(abiString) {
    var abi;

    // support multiple param types
    if (typeof abiString === 'string')
        abi = JSON.parse(abiString)
    else
        return

    // sanity check
    if (abi == null || !abi instanceof Array)
        return

    // create contract
    this.contract = web3.eth.contract(abi)

    // loop through all abi items
    for (var i = 0; i < abi.length; i++) {
        var abiItem = abi[i]
        if ("inputs" in abiItem)
            for (var j = 0; j < abiItem.inputs.length; j++) {
                abiItem.inputs[j].solType = this.splitType(abiItem.inputs[j].type)
            }

        if ("outputs" in abiItem)
            for (var j = 0; j < abiItem.outputs.length; j++) {
                abiItem.outputs[j].solType = this.splitType(abiItem.outputs[j].type)
            }

        // console.log(abiItem)
        switch (abiItem.type) {
            case 'function':
                var func = new Function(this.config.functions, abiItem, this.contract)
                this.functions.push(func)
                break;
            case 'event':
                var ev = new Event(this.config.events, abi, abiItem, this.contract)
                this.events.push(ev)
                break;
            case 'constructor':
                // contructors are not accessible
                break;
            default:
                console.log('Unknown field type', abiItem.name, abiItem.type)
        }
    }

    return abi
}


AbiHtml.prototype.splitType = function(solidityType) {
    var firstDigit = solidityType.match(/\d/);
    if (firstDigit === null) {
        return {
            base: solidityType,
            size: null
        }
    }
    var index = solidityType.indexOf(firstDigit);
    return {
        base: solidityType.substring(0, index),
        size: solidityType.substring(index, solidityType.length)
    }
}

/*




*/


var Function = function(config, abiItem, contract) {
    if (abiItem.type != 'function') return
    this.config = this.applyMissingDefaults(config)
    this.contract = contract

    // generate internal representation of inputs
    if ("inputs" in abiItem) {
        for (var j = 0; j < abiItem.inputs.length; j++) {
            var param = abiItem.inputs[j];

            if (this.config.inputIdPrefix.length > 0)
                param.htmlId = [this.config.inputIdPrefix, abiItem.name, param.name].join(this.config.idJoinString)
            else
                param.htmlId = [abiItem.name, param.name].join(this.config.idJoinString)
        }
    }

    // generate internal representation of outputs
    if ("outputs" in abiItem) {
        for (var k = 0; k < abiItem.outputs.length; k++) {
            var param = abiItem.outputs[k];

            if (param.name.length < 1)
                param.name = this.config.outputEmptyName

            if (this.config.outputIdPrefex.length > 0)
                param.htmlId = [this.config.outputIdPrefex, abiItem.name, param.name].join(this.config.idJoinString)
            else
                param.htmlId = [abiItem.name, param.name].join(this.config.idJoinString)
        }
    }

    this.abiItem = abiItem

}

Function.prototype.applyMissingDefaults = function(userConfig) {
    var that = this
    var defaultConfig = {
        idJoinString: "-",

        inputIdPrefix: "func-in",
        inputFieldsetName: "Inputs",
        inputScaffolding: function(fieldsIn) {
            if (fieldsIn.length > 0) {
                var fsi = document.createElement('fieldset')
                fsi.className = 'input';

                if (this.inputFieldsetName.length > 0) {
                    var leg = document.createElement('legend');
                    leg.innerHTML = this.inputFieldsetName;
                    fsi.appendChild(leg);
                }

                for (var i = 0; i < fieldsIn.length; i++) {
                    fsi.appendChild(fieldsIn[i])
                }
                // fieldsIn.forEach(function(field) {
                //     console.log(field)
                //     fsi.appendChild(field)
                // })
                return fsi
            }

        },

        outputIdPrefex: "func-out",
        outputFieldsetName: "Outputs",
        outputEmptyName: "return",
        outputScaffolding: function(fieldsOut) {
            if (fieldsOut.length > 0) {
                var fso = document.createElement('fieldset')
                fso.className = 'output';

                if (this.outputFieldsetName.length > 0) {
                    var leg = document.createElement('legend');
                    leg.innerHTML = this.outputFieldsetName;
                    fso.appendChild(leg);
                }
                fieldsOut.forEach(function(field) {
                    fso.appendChild(field);
                })
                return fso
            }

        },

        callButtonText: "Call",
        callIdAffix: "call",
        callButtonText: "Call",
        callScaffolding: function(abiItem) {
            var btn = document.createElement('button')
            btn.type = 'button'
            btn.id = [abiItem.name, this.callIdAffix].join(this.idJoinString)
            btn.innerHTML = this.callButtonText
            btn.addEventListener('click', function(ev) {
                that.config.callFunction(address, abiItem)
            })
            return btn
        },
        callFunction: function(address, abiItem) {
            var inputMap = []
            for (var i = 0; i < abiItem.inputs.length; i++) {
                var item = abiItem.inputs[i]
                var v = document.getElementById(item.htmlId).value
                if (item.solType.base == "int" || item.solType.base == "uint")
                    if (v.substring(0, 2) != "0x")
                        v = web3.toHex(v)
                inputMap.push(v)
            }

            that.call(address, inputMap, abiItem)
        },
        callCallback: function(err, result, abiItem) {
            if (err)
                console.log(err)
            else {
                console.log('Contract call returned', result);
            }
        },

        transactButtonText: "Transact",
        transactIdAffix: "transact",
        transactScaffolding: function(abiItem) {
            var btn = document.createElement('button')
            btn.type = 'button'
            btn.id = [abiItem.name, this.transactIdAffix].join(this.idJoinString)
            btn.innerHTML = this.transactButtonText
            btn.addEventListener('click', function(ev) {
                that.config.transactFunction(address, abiItem)
            })
            return btn
        },
        transactFunction: function(address, abiItem) {
            var inputMap = []
            for (var i = 0; i < abiItem.inputs.length; i++) {
                var item = abiItem.inputs[i]
                var v = document.getElementById(item.htmlId).value
                if (item.solType.base == "int" || item.solType.base == "uint")
                    if (v.substring(0, 2) != "0x")
                        v = web3.toHex(v)
                inputMap.push(v)
            }

            that.transact(address, inputMap, abiItem)
        },
        transactCallback: function(err, result, abiItem) {
            if (err)
                console.log(err)
            else
                console.log('Transaction returned', result)
        },
        renderCallback: function(htmlDom) {
            console.log('Got DOM', htmlDom)
        }
    }

    // safety check
    if (!userConfig) userConfig = {}

    // apply default config to missing user config
    for (var k in defaultConfig) {
        if (!userConfig.hasOwnProperty(k))
            userConfig[k] = defaultConfig[k]
    }

    return userConfig
}

Function.prototype.call = function(toAddress, kv, abiItem) {
    // set transaction options
    var options = {
        from: toAddress,
        gas: 1000000,
        gasPrice: web3.toWei(500, 'finney')
    }
    kv.push(options);


    // set callback
    var that = this
    var cb = function(err, results) {
        if (that.config.callCallback)
            that.config.callCallback(err, results, abiItem)
    }
    kv.push(cb)

    // get instance of contract
    var contract = this.contract.at(toAddress)
    var func = contract[abiItem.name]
    func.call.apply(func, kv)
}

Function.prototype.transact = function(toAddress, kv, abiItem) {
    // set transaction options
    var options = {
        from: "0x392af429f1b9537f28d97b8467e4b4e3498d5108",
        to: toAddress,
        gas: 1000000,
        gasPrice: web3.gasPrice
    }
    kv.push(options);


    // set callback
    var that = this
    var cb = function(err, results) {
        if (that.config.transactCallback)
            that.config.transactCallback(err, results, abiItem)
    }
    kv.push(cb)

    // get instance of contract
    var contract = this.contract.at(toAddress)
    var func = contract[abiItem.name]
    func.sendTransaction.apply(func, kv)
}

Function.prototype.generateHtml = function() {
    var abiItem = this.abiItem

    var div = document.createElement('div')
    div.className = ['function'].join(' ')
    div.id = 'function' + abiItem.name

    var h3 = document.createElement('h3')
    h3.innerHTML = abiItem.name
    div.appendChild(h3)


    // Make inputs
    var ins = []
    for (var i = 0; i < abiItem.inputs.length; i++) {
        var inDom = this.makeField(abiItem.inputs[i], true)
        if (inDom)
            ins.push(inDom)
    }
    if (ins.length > 0)
        div.appendChild(this.config.inputScaffolding(ins))

    // Call button is only useful when there is a return value
    if (abiItem.outputs.length > 0)
        div.appendChild(this.config.callScaffolding(abiItem))

    // Transact button available when not constant (constant functions cannot modify state)
    if (!abiItem.constant)
        div.appendChild(this.config.transactScaffolding(abiItem))

    // Make outputs
    var outs = []
    for (var i = 0; i < abiItem.outputs.length; i++) {
        var outDom = this.makeField(abiItem.outputs[i], false)
        if (outDom)
            outs.push(outDom)
    }
    if (outs.length > 0)
        div.appendChild(this.config.outputScaffolding(outs))

    // callback if available
    // if (typeof this.config.renderCallback === "function")
    this.config.renderCallback(div);
}

Function.prototype.makeField = function(field, isEditable) {
    var html = []
    switch (field.solType.base) {
        case 'bool':
            html = this.makeBool(field, isEditable)
            break
        case 'address':
            html = this.makeAddress(field, isEditable)
            break
        case 'string':
        case 'bytes':
            html = this.makeBytes(field, isEditable)
            break
        case 'int':
        case 'uint':
            html = this.makeInt(field, isEditable)
            break
        default:
            console.log('unknown field type:', field.name, solType.base, solType.size)
    }
    return html;
}

Function.prototype.makeBool = function(field, isEditable) {
    var div = document.createElement('div');
    div.className = field.solType.base
    if (field.solType.size)
        div.className = [div.className, field.solType.base + field.solType.size].join(' ')

    var label = document.createElement('label');
    label.htmlFor = field.htmlId;
    label.innerHTML = field.name;

    var input = document.createElement('input');
    input.id = field.htmlId;
    if (!!isEditable)
        input.type = 'checkbox'
    else
        input.type = 'text'
    input.className = div.className
    if (!isEditable) {
        input.className = [div.className, 'readonly'].join(' ')
        input.readOnly = true;
    }

    div.appendChild(label)
    div.appendChild(input)

    return div;
};

Function.prototype.makeAddress = function(field, isEditable) {
    var div = document.createElement('div');
    div.className = field.solType.base
    if (field.solType.size)
        div.className = [div.className, field.solType.base + field.solType.size].join(' ')

    var label = document.createElement('label');
    label.htmlFor = field.htmlId;
    label.innerHTML = field.name;

    var input = document.createElement('input');
    input.id = field.htmlId;
    input.type = 'text';
    input.className = div.className

    if (!isEditable) {
        input.className = [div.className, 'readonly'].join(' ')
        input.readOnly = true;
    }

    div.appendChild(label)
    div.appendChild(input)

    return div;
}

Function.prototype.makeBytes = function(field, isEditable) {
    var div = document.createElement('div');
    div.className = field.solType.base
    if (field.solType.size)
        div.className = [div.className, field.solType.base + field.solType.size].join(' ')

    var label = document.createElement('label');
    label.htmlFor = field.htmlId;
    label.innerHTML = field.name;

    var input = document.createElement('textarea');
    input.id = field.htmlId;
    input.rows = 4
    input.cols = 40
    input.className = div.className

    if (!isEditable) {
        input.className = [div.className, 'readonly'].join(' ')
        input.readOnly = true;
    }

    div.appendChild(label)
    div.appendChild(input)

    return div;
}

Function.prototype.makeInt = function(field, isEditable) {
    var div = document.createElement('div');
    div.className = field.solType.base
    if (field.solType.size)
        div.className = [div.className, field.solType.base + field.solType.size].join(' ')

    var label = document.createElement('label');
    label.htmlFor = field.htmlId;
    label.innerHTML = field.name;

    var input = document.createElement('input');
    input.id = field.htmlId;
    input.type = 'input';
    input.className = div.className

    if (!isEditable) {
        input.className = [div.className, 'readonly'].join(' ')
        input.readOnly = true;
    }

    div.appendChild(label)
    div.appendChild(input)

    return div;
}

/*





*/


var Event = function(config, abi, abiItem) {
    if (abiItem.type != 'event') return;
    this.abiItem = abiItem
    this.config = this.applyMissingDefaults(config)

    // generate internal representation of inputs
    if ("inputs" in abiItem) {
        for (var j = 0; j < abiItem.inputs.length; j++) {
            var param = abiItem.inputs[j];

            if (this.config.eventIdPrefix.length > 0)
                param.htmlId = [this.config.eventIdPrefix, abiItem.name, param.name].join(this.config.idJoinString)
            else
                param.htmlId = [abiItem.name, param.name].join(this.config.idJoinString)
        }
    }

    this.abi = abi

}


Event.prototype.applyMissingDefaults = function(userConfig) {
    var defaultConfig = {
        idJoinString: "-",

        eventIdPrefix: "event",
        eventFieldsetName: "Events",
        eventScaffolding: function() {

        },
        renderCallback: function(err, results, htmlDom) {
            console.log(htmlDom)
        },
        watchCallback: function(err, results, htmlDom) {
            if (err)
                console.log(err)
            else {
                console.log('Heard event', results)
            }
        },
    }

    // safety check
    if (!userConfig) userConfig = {}

    // apply default config to missing user config
    for (var k in defaultConfig) {
        if (!userConfig.hasOwnProperty(k))
            userConfig[k] = defaultConfig[k]
    }

    return userConfig
}

Event.prototype.get = function(address, filterFields) {
    var params = [];

    if (!filterFields)
        params.push({});

    // set transaction options to only watch for newly mined
    var options = {
        fromBlock: '0',
        toBlock: 'latest',
        address: address
    }
    params.push(options)

    // get instance of contract
    var contract = web3.eth.contract(this.abi).at(address);
    // get function as object
    var func = contract[this.abiItem.name]
        // call the contract storing result
    this.filter = func.apply(func, params)

    if (this.filter) {
        var that = this
        this.filter.get(function(err, results) {
            for (var i = 0; i < results.length; i++) {
                var doc = that.generateHtml(err, results[i])
                that.config.watchCallback(err, results[i], doc)
            }
        })
    }
}

Event.prototype.watch = function(address, filterFields) {
    var params = [];

    if (!filterFields)
        params.push({});

    // set transaction options to only watch for newly mined
    var options = {
        fromBlock: 'latest',
        toBlock: 'latest',
        address: address
    }
    params.push(options)

    // get instance of contract
    var contract = web3.eth.contract(this.abi).at(address);
    // get function as object
    var func = contract[this.abiItem.name]
        // call the contract storing result
    this.filter = func.apply(func, params)

    if (this.filter) {
        var that = this
        this.filter.watch(function(err, results) {
            var doc = that.generateHtml(err, results)
            that.config.renderCallback(err, results, doc)

        })
    }
}

Event.prototype.generateHtml = function(err, results) {
    this.abiItem.name
    var div = document.createElement('div');
    div.className = ['event'].join(' ');
    div.id = 'event' + this.abiItem.name;

    var h3 = document.createElement('h3');
    h3.innerHTML = this.config.eventFieldsetName
    div.appendChild(h3);

    var fields = [];
    for (var i = 0; i < this.abiItem.inputs.length; i++) {
        var field = this.abiItem.inputs[i]
        var v = null
        if (results)
            v = results.args[this.abiItem.inputs[i].name]
        var html = this.makeText(field, v)
        html.forEach(function(el) {
            fields.push(el)
        })
    }

    if (fields.length > 0) {

        var fsi = document.createElement('fieldset')
        fsi.className = 'event';

        if (this.config.eventFieldsetName.length > 0) {
            var leg = document.createElement('legend');
            leg.innerHTML = this.abiItem.name;
            fsi.appendChild(leg);
        }

        fields.forEach(function(field) {
            fsi.appendChild(field);
        });

        div.appendChild(fsi);
    }

    if (results) {
        var p = document.createElement('p')
        p.innerHTML = 'Transaction Hash: ' + results.transactionHash
        div.appendChild(p)
    }

    if (this.config.renderCallback)
        this.config.renderCallback(err, results, div)

    return div
}

Event.prototype.makeText = function(field, value) {
    var div = document.createElement('div');
    div.className = field.solType.base
    if (field.solType.size)
        div.className = [div.className, field.solType.base + field.solType.size].join(' ')

    var label = document.createElement('label');
    label.htmlFor = field.htmlId;
    label.innerHTML = field.name;

    var input = document.createElement('textarea');
    input.id = field.htmlId
    input.cols = 40
    input.rows = 4
    input.className = [div.className, 'event', 'readonly'].join(' ')
    input.readOnly = true;
    input.value = value

    div.appendChild(label)
    div.appendChild(input)

    return [div];
}
