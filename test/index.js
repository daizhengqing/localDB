import DB from '../lib/index.js'

const db = new DB({
  collection: [
    { name: 'test' }
  ]
})

console.log(db)