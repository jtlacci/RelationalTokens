#Relation Token Schema Contract

##Tokens(Inventory)
- Tokens exist within an inventory type (i.e. Vegitable4 Vegitable245)
- Tokens can have a user owner or tokens can be owned by another token (i.e. Burger8 owns Vegitable4)
- Immediate lookup, because each item number exist at that index position in their type array 

##Schemas 
- A parent/child hierarchical structure, defined as token types. 
- (Parent) Burger => (Children) Vegitable, Bun, Patty
- (Child) Vegitable => (GrandChildren) Onion, Tomato, Pickle

#Collection
- Instance of a schema or instance of a subset of a schema 
- Burger3 => [2,5,17]
- Vegetable4 => [31,6,7]
- Item IDs mapping keys are hashed, to prevent collisions
- Collection owners are the owners of the root item
- Collection owners can be users or other tokens, provided it aligns with the schema

