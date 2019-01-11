var web3 = require('web3')
var Contract = artifacts.require("./erc721y.sol");
var schema = require('../utils/schema')

function hash(){
  return web3.utils.soliditySha3.apply(this,Object.values(arguments))
}

contract('ERC721Y', function(accounts) {
  //
  //
  //TEST SETTINGS
  let amount = 20
  let item = web3.utils.fromAscii('pickle')
  //
  //

  it(`be able to create ${amount} items`, async () => {
    let instance = await Contract.deployed();
    await instance.createInventory(item, amount,{from:accounts[0]})
    let inventory = await instance.checkItemOwnership.call(item,{from:accounts[0]})
    for(i=0;i<amount;i++){
      assert.equal(inventory[i], true, `Item ${i} Created!`)
    }
  });
  it(`can transfer ${amount} items`, async () => {
    let itemIndexs = [];
    for(i=0;i<amount;i++){
      itemIndexs.push(i)
    }
    let instance = await Contract.deployed();
    await instance.transfer(accounts[1],item, itemIndexs,{from:accounts[0]})
    let ownInventory = await instance.checkItemOwnership.call(item,{from:accounts[0]})
    let recInventory = await instance.checkItemOwnership.call(item,{from:accounts[1]})
    for(i=0;i<amount;i++){
      assert.equal(ownInventory[i], false, `Item ${i} Transfered!`)
      assert.equal(recInventory[i], true, `Item ${i} Transfered!`)
    }
  });
  it('can upload root entry', async () => {
    let root = 'happymeal'
    let children = ['burger','fries','drink']
    let instance = await Contract.deployed();
    await schema.createRootEntry(root,children,instance)
    let happymealHash = await instance.nameServiceLookup.call('happymeal')
    assert.equal(happymealHash, web3.utils.soliditySha3('happymeal'))
    let hmChildHashes = await instance.schemaLookup.call(happymealHash)
    await children.map(async(child,index) => {
      let childHash = await instance.nameServiceLookup.call(child)
      assert.equal(childHash,hmChildHashes[index], `Child #${index} : ${child} created`)
    })
  })

  it(`can upload a child entry`, async () => {
    let root = 'happymeal'
    let children = ['burger','fries','drink']
    let gChildren = ['patty','buns','veg']
    let instance = await Contract.deployed();
    await schema.createChildEntry('burger',gChildren,instance)
    let vegHash = await instance.nameServiceLookup('veg')
    let calcRootHash = hash(root)
    let calcBurgerHash = hash(calcRootHash,0)
    let burgHash = await instance.nameServiceLookup('burger')
    assert.equal(burgHash,calcBurgerHash,'child hashes named correctly')
    let calcVegHash = hash(calcBurgerHash,2)
    // also written as:
    //let calcVegHash = hash(hash(hash(root),0),2)
    assert.equal(calcVegHash, vegHash)
  });

  it(`can upload the test schema`, async () => {
    let instance = await Contract.new();
    await schema.uploadSchema(schema.testSchema,instance)
    let happymealHash = await instance.nameServiceLookup.call('happymeal')
    let rootChildHashes = await instance.schemaLookup.call(happymealHash)
    // let burgerCalc = hash(hash('happymeal'),0)
    // assert.equal(rootChildHashes[0], burgerCalc,'burger nested correctly')
    // let burgerHash = await instance.nameServiceLookup.call('burger')
    // assert.equal(burgerHash,burgerCalc,'burger uploaded to name service correctly')
    let burgChildHashes = await instance.schemaLookup.call(rootChildHashes[0])
    //pickle lookup
    // let vegHash = web3.utils.soliditySha3(web3.utils.soliditySha3(web3.utils.soliditySha3('happymeal'),0),2)
    // let vegChildHashs = await instance.schemaLookup.call(vegHash)
    let pickles = await instance.nameServiceLookup.call('pickles')
    let calcPickles = hash(hash(hash(hash('happymeal'),0),2),0)
    assert.equal(pickles,calcPickles,'Pickle Created')
  });

  it(`can create collections`, async () => {
    let NULL = 99
    let parent = 'veg'
    let children = ['pickles','lettuce','onion']
    let instance = await Contract.new();
    await schema.uploadSchema(schema.testSchema,instance)
    let vegHash = await instance.nameServiceLookup.call(parent)
    let childHashes =  await Promise.all(children.map((child) => instance.nameServiceLookup.call(child,{from:accounts[0]})))
    //create 1 inventory for each child
    await Promise.all(childHashes.map((hash) => instance.createInventory(hash,1,{from:accounts[0]})))
    await instance.createInventory(vegHash,1,{from:accounts[0]})

    let formattedChildren = [0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL]

    await instance.createCollection(vegHash,0,formattedChildren,{from:accounts[0]})
    let vegID = hash(vegHash,0)
    let collectionRaw = await instance.collectionLookup(vegID)
    let collection = collectionRaw.map((element) => (element.toNumber()))
    
    assert.deepEqual(collection,formattedChildren, 'collection created')

    let vegOwner = await instance.checkItemOwnership.call(vegHash)
    assert.equal(vegOwner[0],true,'vegitable still owned')

    let lettOwner = await instance.checkItemOwnership.call(childHashes[1])
    assert.equal(lettOwner[0],false,'lettuce not owned')

    let lettuceItem = await instance.checkInventoryOwnership.call(childHashes[1],0)
    assert.equal(lettuceItem[0], vegID, 'veg owns lettuce')
  });

  it(`can can update collection`, async () => {
    let NULL = 99
    let parent = 'veg'
    let children = ['pickles','lettuce','onion']
    let instance = await Contract.new();
    await schema.uploadSchema(schema.testSchema,instance)
    let vegHash = await instance.nameServiceLookup.call(parent)
    let childHashes =  await Promise.all(children.map((child) => instance.nameServiceLookup.call(child,{from:accounts[0]})))
    //create 1 inventory for each child
    await Promise.all(childHashes.map((hash) => instance.createInventory(hash,1,{from:accounts[0]})))
    await instance.createInventory(vegHash,1,{from:accounts[0]})

    let formattedChildren = [0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL]

    await instance.createCollection(vegHash,0,formattedChildren,{from:accounts[0]})
  });
})
