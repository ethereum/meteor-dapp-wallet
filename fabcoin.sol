contract FabCoin {
    function FabCoin() {
        balances[msg.sender] = 1000;
        
    }
    
    function send(address to, uint256 amount) {
        if(balances[msg.sender] >= amount) {
            balances[msg.sender] -= amount;
            balances[to] += amount;
            
            // call event
            received(msg.sender, amount);
        }
    }
    
    function balance(address who) returns (uint256 value) {
        value = balances[who];
    }

    event received(address from, uint256 value);
    
    mapping(address => uint256) balances;
}