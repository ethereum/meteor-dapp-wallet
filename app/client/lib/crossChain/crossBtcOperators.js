let directionEnum = ['BTC2WBTC','WBTC2BTC'];
let chainType = ['BTC','WAN'];
let index = 0;
let messageType = 'CrossChain_';
class crossOperator{
    constructor(action,parameters,chainType,callback){
        this.message = {
            index : index,
            action : action,
            parameters : parameters,
            chainType : chainType
        };
        index++;
        this.callback = callback;
    }
}
class crossBtcOperators{
    constructor(crossType){
        this.crossType = crossType;
        this.direction = directionEnum[0];
        this.OperatorDict = {}
    }
    invokeOperator(crossOperator){
        this.OperatorDict[crossOperator.message.index] = crossOperator;
        this.postMessage(crossOperator);
    }

    postMessage(crossOperator) {
        window.postMessage({type: messageType+this.crossType,message:crossOperator.message}, (!location.origin || location.origin === "null" ) ? '*' : location.origin);
    };

    invokeCallback(data){
        // console.log('invokeCallback : ',data);
        if(this.OperatorDict[data.index]){
            if(this.OperatorDict[data.index].callback){
                this.OperatorDict[data.index].callback(data.error,data.value);
            }
            return true;
        }
        return false;
    }

    getBtcMultiBalances(chainType,callback){
        this.invokeOperator(new crossOperator('getBtcMultiBalances',{},chainType,callback));
    };

    sendBtcToAddress(chainType,parameters,callback){
        this.invokeOperator(new crossOperator('sendBtcToAddress',parameters,chainType,callback));
    };

    getAddressList(chainType,callback){
        this.invokeOperator(new crossOperator('listBtcAddress',{},chainType,callback));
    };

    getBtcBalance(chainType,callback){
        this.invokeOperator(new crossOperator('getBtcBalance',{},chainType,callback));
    };

    getOriginChainType(){
        return this.direction === directionEnum[0] ? chainType[0] : chainType[1];
    };
    getCrossChainType(){
        return this.direction === directionEnum[0] ? chainType[1] : chainType[0];
    };

    getStoremanGroups(chainType, callback){
        this.invokeOperator(new crossOperator('listStoremanGroups',[], chainType, callback));
    };

    lockBtc(chainType,parameters,callback){
        this.invokeOperator(new crossOperator('lockBtc',parameters,chainType,callback));
    };
}

if(typeof mist !== 'undefined')
{
    let btcCrossChain = new crossBtcOperators('BTC2WBTC');
    mist.BTC2WBTC = function () {
        btcCrossChain.direction = directionEnum[0];
        return btcCrossChain;
    };
    mist.WBTC2BTC = function () {
        btcCrossChain.direction = directionEnum[1];
        return btcCrossChain;
    };
}
