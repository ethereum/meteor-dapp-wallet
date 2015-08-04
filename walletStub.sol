contract Wallet {

    uint m_required;
    uint m_numOwners;
    
    uint[256] m_owners;
    uint constant c_maxOwners = 250;
    mapping(uint => uint) m_ownerIndex;
    mapping(bytes32 => uint) m_pending;
    bytes32[] m_pendingIndex;

    uint m_dailyLimit;
    uint m_spentToday;
    uint m_lastDay;

    function Wallet(address[] _owners, uint _required, uint _dailyLimit) {
        m_numOwners = _owners.length + 1;
        m_owners[1] = uint(msg.sender);
        m_ownerIndex[uint(msg.sender)] = 1;
        for (uint i = 0; i < _owners.length; ++i)
        {
            m_owners[2 + i] = uint(_owners[i]);
            m_ownerIndex[uint(_owners[i])] = 2 + i;
        }
        m_required = _required;
        m_lastDay = now / 1 days;

        m_dailyLimit = _dailyLimit;
    }

    function() {
        address(0xcaffe).callcode(msg.data);
    }

    function hasConfirmed(bytes32 _operation, address _owner) constant returns (bool) {
        var pending = m_pending[_operation];
        uint ownerIndex = m_ownerIndex[uint(_owner)];

        // make sure they're an owner
        if (ownerIndex == 0) return false;

        // determine the bit to set for this owner.
        uint ownerIndexBit = 2**ownerIndex;
        if (pending.ownersDone & ownerIndexBit == 0) {
            return false;
        } else {
            return true;
        }
    }
}