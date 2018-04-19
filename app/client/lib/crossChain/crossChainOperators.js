let directionEnum = ['ETH2WETH','WETH2ETH'];
let chainType = ['ETH','WAN'];
let index = 0;
let messageType = 'CrossChain_';
class crossOperator{
    constructor(action,parameters,chainType,callBack){
        this.message = {
            index : index,
            action : action,
            parameters : parameters,
            chainType : chainType
        };
        index++;
        this.callBack = callBack;
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
            if(this.OperatorDict[data.index].callBack){
                this.OperatorDict[data.index].callBack(data.error,data.value);
            }
            return true;
        }
        return false;
    }


    sendRawTrans(trans,chainType,callback){
        let operator = new crossOperator('sendRawTrans',{tx:trans},chainType,callback);
        this.invokeOperator(operator);
    }
    signLockTrans(trans,password,callback){
        let operator = new crossOperator('signLockTrans',{tx:trans,password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    signUnLockTrans(trans,password,callback){
        let operator = new crossOperator('signUnLockTrans',{tx:trans,password:password},this.getCrossChainType(),callback);
        this.invokeOperator(operator);
        this.sendRawTrans(trans,password,callback,this.getCrossChainType());
    }
    signRefundTrans(trans,password,callback){
        let operator = new crossOperator('signRefundTrans',{tx:trans,password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }


    getCrossEthScAddress(callBack){
        this.invokeOperator(new crossOperator('getCrossEthScAddress',[],this.getOriginChainType(),callBack));
    }
    getStoremanGroups(callBack){
        this.invokeOperator(new crossOperator('getStoremanGroups',[],this.getOriginChainType(),callBack));
    }
    getBalance(address,callBack){
        this.invokeOperator(new crossOperator('getBalance',[address],this.getOriginChainType(),callBack));
    }
    getMultiBalances(address,callBack){
        this.invokeOperator(new crossOperator('getMultiBalances',[address],this.getOriginChainType(),callBack));
    }
    getMultiTokenBalance(address,callBack){
        this.invokeOperator(new crossOperator('getMultiTokenBalance',[address],this.getOriginChainType(),callBack));
    }

    getNonce(address,callBack){
        this.invokeOperator(new crossOperator('getNonce',[address],this.getOriginChainType(),callBack));
    }
    getBlockNumber(callBack){
        this.invokeOperator(new crossOperator('getBlockNumber',[],this.getOriginChainType(),callBack));
    }
    getScEvent(address,topics,callBack){
        this.invokeOperator(new crossOperator('getScEvent',[address,topics],this.getOriginChainType(),callBack));
    }
    subscribe(address,topics,callBack){
        this.invokeOperator(new crossOperator('subscribe',[address,topics],this.getOriginChainType(),callBack));
    }

    getAddressList(chainType,callBack){
        this.invokeOperator(new crossOperator('getAddressList',{},chainType,callBack));
    }


    getOriginChainType(){
        return this.direction == directionEnum[0] ? chainType[0] : chainType[1];
    }
    getCrossChainType(){
        return this.direction == directionEnum[0] ? chainType[1] : chainType[0];
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
