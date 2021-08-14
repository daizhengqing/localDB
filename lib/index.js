import {
  has,
  mkdir,
  read,
  write
} from './file'

/**
 * @param {object} ctx
 * @param {string} ctx.root db root dir path
 * @param {[]} ctx.collection collection
 */
export default class DB {
  constructor (ctx) {
    Object.assign(this, {
      root: path.resolve(),

      onLoadError () {}
    }, ctx)

    this.init();
  }

  init () {
    if (!await has(this.root)) await mkdir(this.root);

    await Promise.all(this.collection.map(async item => {
      const file = path.join(this.root, `${item.name}.json`);
      
      if (!await has(file)) await write(file, item.default);

      this[item.name] = await this.connect(file);

      return true;
    }));
  }

  async connect (file) {
    const collection = {};

    try {
      collection.data = JSON.parse((await read(file)).toString());
    } catch (error) {
      collection.data = { rows: [] };

      await write(file, '{ "rows": [] }');
    }

    collection.chain = lodash.chain(collection.data);

    collection.write = async () => await write(file, JSON.stringify(collection.data));

    Object.assign(collection, {
      insert: this.insert.bind(collection),
      insertMany: this.insertMany.bind(collection),
      find: this.find.bind(collection),
      findAll: this.findAll.bind(collection),
      remove: this.remove.bind(collection),
      removeAll: this.removeAll.bind(collection),
      update: this.update.bind(collection),
      updateAll: this.updateAll.bind(collection),
      updateOrAdd: this.updateOrAdd.bind(collection)
    });

    return collection;
  }

  insert (value) {
    return new Promise((resolve, reject) => {
      this.data.rows.push(value);

      this.write().then(() => resolve(value))
        .catch(reject);
    });
  }

  insertMany (values) {
    return new Promise((resolve, reject) => {
      values.forEach(value => this.data.rows.push(value));

      this.write().then(() => resolve(values))
        .catch(reject);
    });
  }

  find (filter) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.chain.get('rows').find(filter)
          .value());
      } catch (err) {
        reject(err);
      }
    });
  }

  findAll (filter) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.chain.get('rows').filter(filter)
          .value());
      } catch (err) {
        reject(err);
      }
    });
  }

  remove (filter) {
    return new Promise((resolve, reject) => {
      this.find(filter).then(res => {
        lodash.pull(this.data.rows, res);

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }

  removeAll (filter) {
    return new Promise((resolve, reject) => {
      this.findAll(filter).then(res => {
        res.forEach(item => lodash.pull(this.data.rows, item));

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }

  update (filter, value) {
    return new Promise((resolve, reject) => {
      this.find(filter).then(res => {
        lodash.assign(res, value);

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }

  updateAll (filter, value) {
    return new Promise((resolve, reject) => {
      this.findAll(filter).then(res => {
        res.forEach(item => lodash.assign(item, value));

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }
}