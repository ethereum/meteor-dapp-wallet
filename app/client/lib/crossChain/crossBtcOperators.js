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

    getBtcMultiBalances(chainType,callback){
        this.invokeOperator(new crossOperator('getBtcMultiBalances',{},chainType,callback));
    };

    getOriginChainType(){
        return this.direction === directionEnum[0] ? chainType[0] : chainType[1];
    }
    getCrossChainType(){
        return this.direction === directionEnum[0] ? chainType[1] : chainType[0];
    }
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
