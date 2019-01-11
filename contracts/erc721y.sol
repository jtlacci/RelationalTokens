pragma solidity ^0.4.18;

contract erc721y {
    
    uint NULLCHILD = 99;

    struct item {
        bytes32 parent;
        address owner;
    }
    //map human readable names to inventory type
    mapping(string => bytes32) nameService;
    //schema of how different types of inventory are related to eachother
    mapping(bytes32 => bytes32[10]) public schema; 
    //collection is one instance of a schema with the item number of the inventory type at each location
    mapping(bytes32 => uint[10]) public collection;
    //type of inventory mapped to each item of that type that exists
    //inventory items can be owned by users or by other inventory items
    mapping(bytes32 => item[100]) public inventory;
    mapping(bytes32 => uint) public inventoryLength;
    //user ownership of different inventory items
    mapping(address => mapping(bytes32 => bool[100])) public ownership;

    function addToNameService(string name, bytes32 id) public {
        nameService[name] = id;
    }

    function addToSchema(bytes32 parent, bytes32[] children) public {
        for(uint i = 0;i<children.length;i++){
            schema[parent][i] = children[i];
        }    
    }

    function nameServiceLookup(string name) public view returns (bytes32 id){
        return nameService[name];
    }
    function schemaLookup(bytes32 _item) public view returns (bytes32[10] children){
        return schema[_item];
    }

    function createInventory(bytes32 _item, uint _amount) public {
        //get inventory Length
        uint invLen = inventoryLength[_item];
        //push each member of new inventory to the inventory array
        for (uint i = 0; i < _amount; i++){
            //set inv at element location
            inventory[_item][invLen + i].owner = msg.sender;
            //set owner at element location
            ownership[msg.sender][_item][invLen + i] = true;
        }
        //update inventory Length 
        inventoryLength[_item] += _amount;
        
    }
    
    function transfer(address _recipient, bytes32 _item, uint[] _inventoryIndexs) public {
        //iterate through each supplied index
        for (uint i = 0; i < _inventoryIndexs.length; i++){
            //check ownership 
            require(ownership[msg.sender][_item][_inventoryIndexs[i]] == true,"User does not own this item");
            //remove ownership
            ownership[msg.sender][_item][_inventoryIndexs[i]] = false;
            //add ownership
            ownership[_recipient][_item][_inventoryIndexs[i]] = true;
        }
    }

    function createCollection(bytes32 _parentType, uint _parentIndex, uint[10] _childIndexs) public {
        //check ownership of parent inventory
        require(inventory[_parentType][_parentIndex].owner == msg.sender, "msg sender does not own parent");
        //create parentType Index hash
        bytes32 parentHash = keccak256(abi.encodePacked(_parentType,_parentIndex));
        //create child arr
        uint[10] memory collectionChildren;
          //for each child 
        for(uint i = 0; i<10;i++){
            //get child index
            uint childIndex = _childIndexs[i];
            //if the child is not null
            if(childIndex != NULLCHILD){
                //check the schema for child type
                bytes32 childType = schema[_parentType][i];
                //check the ownership of the child
                require(inventory[childType][childIndex].owner == msg.sender, "msg sender does not own child");
                //change child ownership to false
                ownership[msg.sender][childType][childIndex] = false;
                //remove item owner 
                inventory[childType][childIndex].owner = address(0);
                //set child owner to parent object
                inventory[childType][childIndex].parent = parentHash;
                //set child index in collectionChildren
                collectionChildren[i] = childIndex;
            }else{
                collectionChildren[i] = NULLCHILD;
            }
        }
        //set child array at parent typeindex hash collection 
        collection[parentHash] = collectionChildren;
    }
    
    function checkItemOwnership(bytes32 _item) public view returns(bool[100]){
        return ownership[msg.sender][_item];
    }
    
    function checkInventoryOwnership(bytes32 _item, uint _index) public view returns(bytes32,address){
        bytes32 parent = inventory[_item][_index].parent;
        address owner = inventory[_item][_index].owner;
        return (parent,owner);
    }

    function collectionLookup(bytes32 _item) public view returns(uint[10]){
        return collection[_item];
    }

    //TODO add splitting function


    
}
