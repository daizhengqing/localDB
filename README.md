# db
### Init
```
const db = await new DB({
  collection: [
    { name: 'test' }
  ]
}).init()
```

### Options
```
new DB({
  root: path.resolve() // the db file root path
  
  default: '{ "rows": [] }',    // db file default value,  you can set default data in "rows",
  
  collection: [ // db file list
    {
      name: 'test', // db name
      
      schema,  // json schema, add this to validate data when insert or update,
      
      physicalDeletion: false,  // when remove data, if set physicalDeletion true, will remove data in json, but set false, just set "isDelete" true in data
    }
  ]
})
```

### API
#### insert
```
db.test.insert({
  id: 1,
  text: 2333
})
```

#### insertMany
```
db.test.insertMany([
  {
    id: 2,
    text: 666
  },
  {
    id: 3,
    text: 666
  }
])
```

#### find
```
db.test.find({ id: 1 })
```

#### findAll
```
db.test.findAll({ text: 666 })
```

#### remove
```
db.test.remove({ id: 1 })
```

#### removeAll
```
db.test.removeAll({ text: 666 })
```

#### update
```
db.test.update({ id: 3 })
```

#### updateAll
```
db.test.updateAll({ text: 666 })
```
