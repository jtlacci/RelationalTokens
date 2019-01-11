const web3 = require('web3')


function schema(){

  //test schema
  let testSchema = {
    happymeal:{
      burger:{
        patty:false,
        buns:false,
        veg:{
          pickles:false,
          lettuce:false,
          onion:false,
        }
      },
      fries:false,
      drink:{
        cup:false,
        beverage:false,
      },
    }
  }

  async function createRootEntry(entry,children,contract){
    //get parent hash
    let hashedParent = await web3.utils.soliditySha3(entry)
    //upload parent to name service
    await contract.addToNameService(entry,hashedParent)
    //get hash for each child
    var hashes = []
    for (const [index, child] of children.entries()){
      //get parent index hash
      let parentIndexHash = web3.utils.soliditySha3(hashedParent,index)
      //upload parent index hash to name service
      await contract.addToNameService(child,parentIndexHash)
      //return parent index hash to array
      hashes.push(parentIndexHash)
    };
    //set array of child parent index hashes at parent
    await contract.addToSchema(hashedParent,hashes)
  }

  async function createChildEntry(entry,children,contract){
    //lookup parent hash
    let hashedParent = await contract.nameServiceLookup.call(entry)
    //get hash for each child
    var hashes = []
    for (const [index, child] of children.entries()){
      //get parent index hash
      let parentIndexHash = web3.utils.soliditySha3(hashedParent,index)
      //upload parent index hash to name service
      await contract.addToNameService(child,parentIndexHash)
      //return parent index hash to array
      hashes.push(parentIndexHash)
    };
    //set array of child parent index hashes at parent
    await contract.addToSchema(hashedParent,hashes)
  }

  async function uploadSchema(schema,contract){
    let rootLevel = Object.keys(testSchema)
    if(rootLevel.length > 1){
      throw new Error('can only have one root element')
    }
    //create root element
    let rootElement = rootLevel[0]
    let rootChildren = Object.keys(schema[rootElement])
    await createRootEntry(rootElement,rootChildren,contract)
    
    //create child elements
    await createChildElements(schema[rootElement])

    async function createChildElements(parent){
      //console.log(parent);
      let children = Object.keys(parent)
      for (const child of children){
        //if object doesn't have children
        if(parent[child] === false){
          //createEntry(relationName)
        }else{
          await createChildEntry(child,Object.keys(parent[child]),contract)
          await createChildElements(parent[child])
        }
      }
    }
  }

  return{
    testSchema,
    uploadSchema,
    createRootEntry,
    createChildEntry
  }

}

module.exports = schema()