let directionEnum = ['ETH2WETH','WETH2ETH'];
let chainType = ['ETH','WAN'];
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
class crossChainOperators{
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
        window.postMessage({type : messageType+this.crossType ,message:crossOperator.message}, (!location.origin || location.origin === "null" ) ? '*' : location.origin);
    };
    invokeCallback(data){
        console.log('invokeCallback : ',data);
        if(this.OperatorDict[data.index]){
            if(this.OperatorDict[data.index].callback){
                this.OperatorDict[data.index].callback(data.error,data.value);
            }
            return true;
        }
        return false;
    }


    sendRawTrans(trans,chainType,callback){
        let operator = new crossOperator('sendRawTrans',{tx:trans},chainType,callback);
        this.invokeOperator(operator);
    }
    listHistory(addrList, callback){
        this.invokeOperator(new crossOperator('listHistory',{addrList:addrList},this.getOriginChainType(),callback));
    }
    getLockTransData(trans,callback){
        let operator = new crossOperator('getLockTransData',{tx:trans},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    getRefundTransData(trans,password,callback){
        let operator = new crossOperator('getRefundTransData',{tx:trans},this.getCrossChainType(),callback);
        this.invokeOperator(operator);
    }
    getRevokeTransData(trans,callback){
        let operator = new crossOperator('getRevokeTransData',{tx:trans},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }

    signLockTrans(trans,password,secretX, callback){
        let operator = new crossOperator('signLockTrans',{tx:trans,secretX:secretX, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }

    signRefundTrans(trans,password,secretX,callback){
        let operator = new crossOperator('signUnLockTrans',{tx:trans,secretX:secretX, password:password},this.getCrossChainType(),callback);
        this.invokeOperator(operator);
    }
    signRevokeTrans(trans,password,secretX,callback){
        let operator = new crossOperator('signRevokeTrans',{tx:trans,secretX:secretX, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }

    sendLockTrans(trans,password,secretX, callback){
        let operator = new crossOperator('sendLockTrans',{tx:trans,secretX:secretX, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }

    sendRefundTrans(trans,password,secretX,callback){
        let operator = new crossOperator('sendRefundTrans',{tx:trans,secretX:secretX, password:password},this.getCrossChainType(),callback);
        this.invokeOperator(operator);
    }
    sendRevokeTrans(trans,password,secretX,callback){
        let operator = new crossOperator('sendRevokeTrans',{tx:trans,secretX:secretX, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    getCrossEthScAddress(callback){
        this.invokeOperator(new crossOperator('getCrossEthScAddress',[],this.getOriginChainType(),callback));
    }
    getStoremanGroups(callback){
        this.invokeOperator(new crossOperator('syncStoremanGroups',[],this.getOriginChainType(),callback));
    }
    getBalance(address,callback){
        this.invokeOperator(new crossOperator('getBalance',[address],this.getOriginChainType(),callback));
    }
    getMultiBalances(address,callback){
        this.invokeOperator(new crossOperator('getMultiBalances',[address],this.getOriginChainType(),callback));
    }
    getMultiTokenBalance(address,callback){
        this.invokeOperator(new crossOperator('getMultiTokenBalance',[address],this.getOriginChainType(),callback));
    }

    getNonce(address,callback){
        this.invokeOperator(new crossOperator('getNonce',[address],this.getOriginChainType(),callback));
    }
    getBlockNumber(callback){
        this.invokeOperator(new crossOperator('getBlockNumber',[],this.getOriginChainType(),callback));
    }
    getGasPrice(callback){
        this.invokeOperator(new crossOperator('getGasPrice',[],this.getOriginChainType(),callback));
    }
    getScEvent(address,topics,callback){
        this.invokeOperator(new crossOperator('getScEvent',[address,topics],this.getOriginChainType(),callback));
    }
    subscribe(address,topics,callback){
        this.invokeOperator(new crossOperator('subscribe',[address,topics],this.getOriginChainType(),callback));
    }

    getAddressList(chainType,callback){
        this.invokeOperator(new crossOperator('getAddressList',{},chainType,callback));
    }


    getOriginChainType(){
        return this.direction === directionEnum[0] ? chainType[0] : chainType[1];
    }
    getCrossChainType(){
        return this.direction === directionEnum[0] ? chainType[1] : chainType[0];
    }
}

if(typeof mist !== 'undefined')
{
    let ethCrossChain = new crossChainOperators('ETH2WETH');
    mist.ETH2WETH = function () {
        ethCrossChain.direction = directionEnum[0];
        return ethCrossChain;
    };
    mist.WETH2ETH = function () {
        ethCrossChain.direction = directionEnum[1];
        return ethCrossChain;
    };
}
