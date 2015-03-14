//sol Wallet
// Multi-sig, daily-limited account proxy/wallet.
// @authors:
// Gav Wood <g@ethdev.com>
// inheritable "property" contract that enables methods to be protected by requiring the acquiescence of either a
// single, or, crucially, each of a number of, designated owners.
// usage:
// use modifiers onlyowner (just own owned) or onlymanyowners(hash), whereby the same hash must be provided by
// some number (specified in constructor) of the set of owners (specified in the constructor, modifiable) before the
// interior is executed.
contract multiowned {
    // struct for the status of a pending operation.
    struct PendingState {
        uint yetNeeded;
        uint ownersDone;
    }
    // this contract only has five types of events: it can accept a confirmation, in which case
    // we record owner and operation (hash) alongside it.
    event Confirmation(address owner, hash operation);
    // some others are in the case of an owner changing.
    event OwnerChanged(address oldOwner, address newOwner);
    event OwnerAdded(address newOwner);
    event OwnerRemoved(address oldOwner);
    // the last one is emitted if the required signatures change
    event RequirementChanged(uint newRequirement);
    // constructor is given number of sigs required to do protected "onlymanyowners" transactions
    // as well as the selection of addresses capable of confirming them.
    function multiowned() {
        m_required = 1;
        m_numOwners = 1;
        m_owners[m_numOwners] = msg.sender;
        m_ownerIndex[msg.sender] = m_numOwners;
    }
    // simple single-sig function modifier.
    modifier onlyowner {
        if (isOwner(msg.sender))
            _
    }
    // multi-sig function modifier: the operation must have an intrinsic hash in order
    // that later attempts can be realised as the same underlying operation and
    // thus count as confirmations.
    modifier onlymanyowners(hash _operation) {
        if (confirmed(_operation))
            _
    }
    function confirmed(hash _operation) internal returns (bool) {
        // determine what index the present sender is:
        uint ownerIndex = m_ownerIndex[msg.sender];
        // make sure they're an owner
        if (ownerIndex == 0) return;

        var pending = m_pending[_operation];
        // if we're not yet working on this operation, switch over and reset the confirmation status.
        if (pending.yetNeeded == 0) {
            // reset count of confirmations needed.
            pending.yetNeeded = m_required;
            // reset which owners have confirmed (none) - set our bitmap to 0.
            pending.ownersDone = 0;
        }
        // determine the bit to set for this owner.
        uint ownerIndexBit = 2**ownerIndex;
        // make sure we (the message sender) haven't confirmed this operation previously.
        if (pending.ownersDone & ownerIndexBit == 0) {
            Confirmation(msg.sender, _operation);
            // ok - check if count is enough to go ahead.
            if (pending.yetNeeded == 1) {
                // enough confirmations: reset and run interior.
                delete m_pending[_operation];
                return true;
            }
            else
            {
                // not enough: record that this owner in particular confirmed.
                pending.yetNeeded--;
                pending.ownersDone |= ownerIndexBit;
            }
        }
    }
    // Replaces an owner `_from` with another `_to`.
    function changeOwner(address _from, address _to) onlymanyowners(sha3(msg.data)) {
        uint ownerIndex = m_ownerIndex[_from];
        if (ownerIndex == 0) return;
        if (isOwner(_to)) return;

        m_owners[ownerIndex] = _to;
        m_ownerIndex[_from] = 0;
        m_ownerIndex[_to] = ownerIndex;
        OwnerChanged(_from, _to);
    }
    function addOwner(address _owner) onlymanyowners(sha3(msg.data)) {
        if (isOwner(_owner)) return;

        m_numOwners++;
        m_owners[m_numOwners] = _owner;
        m_ownerIndex[_owner] = m_numOwners;
        OwnerAdded(_owner);
    }
    function removeOwner(address _owner) onlymanyowners(sha3(msg.data)) {
        uint ownerIndex = m_ownerIndex[_owner];
        if (ownerIndex == 0) return;

        m_owners[ownerIndex] = 0;
        m_ownerIndex[_owner] = 0;
        OwnerRemoved(_owner);
    }
    function changeRequirement(uint _newRequired) onlymanyowners(sha3(msg.data)) {
        m_required = _newRequired;
        RequirementChanged(_newRequired);
    }
    function isOwner(address _addr) returns (bool) {
        return m_ownerIndex[_addr] > 0;
    }

    // the number of owners that must confirm the same operation before it is run.
    uint m_required;
    // pointer used to find a free slot in m_owners
    uint m_numOwners;
    // list of owners
    mapping(uint => address) m_owners;
    // index on the list of owners to allow reverse lookup
    mapping(address => uint) m_ownerIndex;
    // the ongoing operations.
    mapping(hash => PendingState) m_pending;
}

// inheritable "property" contract that enables methods to be protected by placing a linear limit (specifiable)
// on a particular resource per calendar day. is multiowned to allow the limit to be altered. resource that method
// uses is specified in the modifier.
contract daylimit is multiowned {
    // constructor - just records the present day's index.
    function daylimit() {
        m_lastDay = today();
    }
    // (re)sets the daily limit. needs many of the owners to confirm. doesn't alter the amount already spent today.
    function setDailyLimit(uint _newLimit) onlymanyowners(sha3(msg.data)) {
        m_dailyLimit = _newLimit;
    }
    // (re)sets the daily limit. needs many of the owners to confirm. doesn't alter the amount already spent today.
    function resetSpentToday() onlymanyowners(sha3(msg.data)) {
        m_spentToday = 0;
    }
    // checks to see if there is at least `_value` left from the daily limit today. if there is, subtracts it and
    // returns true. otherwise just returns false.
    function underLimit(uint _value) internal onlyowner returns (bool) {
        // reset the spend limit if we're on a different day to last time.
        if (today() > m_lastDay) {
            m_spentToday = 0;
            m_lastDay = today();
        }
        // check to see if there's enough left - if so, subtract and return true.
        if (m_spentToday + _value >= m_spentToday && m_spentToday + _value <= m_dailyLimit) {
            m_spentToday += _value;
            return true;
        }
        return false;
    }
    // simple modifier for daily limit.
    modifier limitedDaily(uint _value) {
        if (underLimit(_value))
            _
    }
    // determines today's index.
    function today() private constant returns (uint) { return block.timestamp / (60 * 60 * 24); }
    uint m_spentToday;
    uint m_dailyLimit;
    uint m_lastDay;
}
// interface contract for multisig proxy contracts; see below for docs.
contract multisig {
    event Deposit(address from, uint value);
    event SingleTransact(address owner, uint value, address to, bytes data);
    event MultiTransact(address owner, hash operation, uint value, address to, bytes data);
    event ConfirmationNeeded(hash operation, address initiator, uint value, address to, bytes data);
    function changeOwner(address _from, address _to) {}
    function execute(address _to, uint _value, bytes _data) returns (hash) {}
    function confirm(hash _h) returns (bool) {}
}
// usage:
// hash h = Wallet(w).from(oneOwner).transact(to, value, data);
// Wallet(w).from(anotherOwner).confirm(h);
contract Wallet is multisig, multiowned, daylimit {
    // Transaction structure to remember details of transaction lest it need be saved for a later call.
    struct Transaction {
        address to;
        uint value;
        bytes data;
    }
    /*
    // logged events:
    // Funds has arrived into the wallet (record how much).
    event Deposit(address from, uint value);
    // Single transaction going out of the wallet (record who signed for it, how much, and to whom it's going).
    event SingleTransact(address owner, uint value, address to, bytes data);
    // Multi-sig transaction going out of the wallet (record who signed for it last, the operation hash, how much, and to whom it's going).
    event MultiTransact(address owner, hash operation, uint value, address to, bytes data);*/
    // constructor - just pass on the owner arra to the multiowned.
    event Created();
    function Wallet() {
        Created();
    }
    // kills the contract sending everything to `_to`.
    function kill(address _to) onlymanyowners(sha3(msg.data)) {
        suicide(_to);
    }
    // gets called when no other function matches
    function() {
        // just being sent some cash?
        if (msg.value > 0)
            Deposit(msg.sender, msg.value);
    }
    // Outside-visible transact entry point. Executes transacion immediately if below daily spend limit.
    // If not, goes into multisig process. We provide a hash on return to allow the sender to provide
    // shortcuts for the other confirmations (allowing them to avoid replicating the _to, _value
    // and _data arguments). They still get the option of using them if they want, anyways.
    function execute(address _to, uint _value, bytes _data) returns (hash _r) {
        // first, take the opportunity to check that we're under the daily limit.
        if (underLimit(_value)) {
            SingleTransact(msg.sender, _value, _to, _data);
            // yes - just execute the call.
            _to.call.value(_value)(_data);
            return 0;
        }
        // determine our operation hash.
        _r = sha3(msg.data);
        if (!confirm(_r) && m_txs[_r].to == 0) {
            m_txs[_r].to = _to;
            m_txs[_r].value = _value;
            m_txs[_r].data = _data;
            ConfirmationNeeded(_r, msg.sender, _value, _to, _data);
        }
    }
    // confirm a transaction through just the hash. we use the previous transactions map, m_txs, in order
    // to determine the body of the transaction from the hash provided.
    function confirm(hash _h) onlymanyowners(_h) returns (bool) {
        if (m_txs[_h].to != 0) {
            m_txs[_h].to.call.value(m_txs[_h].value)(m_txs[_h].data);
            MultiTransact(msg.sender, _h, m_txs[_h].value, m_txs[_h].to, m_txs[_h].data);
            delete m_txs[_h];
            return true;
        }
    }
    // // internally confirm transaction with all of the info. returns true iff confirmed good and executed.
    // function confirmVerbose(hash _h, address _to, uint _value, bytes _data) private onlymanyowners(_h) returns (bool) {
    //     _to.call.value(_value)(_data);
    //     MultiTransact("out", msg.sender, _h, _value, _to);
    //     return true;
    // }
    // pending transactions we have at present.
    mapping (hash => Transaction) m_txs;
}
