import DB from '../lib/index.js'

const db = await new DB({
  collection: [
    { name: 'test' }
  ]
}).init()

db.test.insert({ a:233 })
db.test.insert({ a:666 })
db.test.insert({ a:7777 })
db.test.removeAll({ a:233 })

console.log(db)