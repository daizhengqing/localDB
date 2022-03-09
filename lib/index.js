import path from 'path';

import _ from 'lodash';

import Ajv from 'ajv';

import dayjs from 'dayjs';

import {
  has,
  mkdir,
  read,
  write
} from './file.js';

const _validator = new Ajv();

const _validate = function (schema, data) {
  const result = _validator.validate(schema, data) ? true : { stack: 'Schema Validate Error', message: _validator.errors };

  _validator.removeSchema(schema);

  return result;
};

export default class DB {
  constructor (ctx = {}) {
    Object.assign(this, {
      root: path.resolve(),

      default: '{ "rows": [] }',

      collection: [],
    }, ctx);
  }

  /**
   * 初始化
   */
  async init () {
    if (!await has(this.root)) await mkdir(this.root);

    await Promise.all(this.collection.map(async item => {
      const file = path.join(this.root, `${item.name}.json`);
      
      if (!await has(file)) await write(file, item.default ?? this.default);

      this[item.name] = await this.connect(file, item.schema);

      this[item.name].schema = item.schema;

      this[item.name].physicalDeletion = item.physicalDeletion ?? false;

      return true;
    }));

    return this;
  }

  /**
   * 初始化数据表
   * @param {String} file 文件路径
   * @returns 返回collection
   */
  async connect (file) {
    const collection = {};

    try {
      collection.data = JSON.parse((await read(file)).toString());
    } catch (error) {
      collection.data = { rows: [] };

      await write(file, '{ "rows": [] }');
    }

    collection.chain = _.chain(collection.data);

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
    });

    return collection;
  }

  /**
   * 插入一条数据
   * @param {Object} value
   */
  insert (value) {
    return new Promise((resolve, reject) => {
      const result = this.schema ? _validate(this.schema, value) : true;

      if (result !== true) reject(result);

      this.data.rows.push(_.assign({}, this.schema?.default, value, { created: dayjs().unix(), isDelete: false }));

      this.write().then(() => resolve(value))
        .catch(reject);
    });
  }

  /**
   * 插入多条数据
   * @param {Object} values
   */
  insertMany (values) {
    return new Promise((resolve, reject) => {
      values.forEach(value => {
        const result = this.schema ? _validate(this.schema, value) : true;

        if (result !== true) reject(result);
      });

      values.forEach(value => this.data.rows.push(_.assign({}, this.schema?.default, value, { created: dayjs().unix(), isDelete: false })));

      this.write().then(() => resolve(values))
        .catch(reject);
    });
  }

  /**
   * 查询满足条件的第一条数据
   * @param {Object} filter 
   * @returns 
   */
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

  /**
   * 查询满足条件的所有数据
   * @param {Object} filter 
   * @returns 
   */
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

  /**
   * 删除满足条件的第一条数据
   * @param {Object} filter 
   */
  remove (filter, physicalDeletion = false) {
    return new Promise((resolve, reject) => {
      this.find(filter).then(res => {
        this.physicalDeletion || physicalDeletion
          ? _.pull(this.data.rows, res)
          : res.isDelete = true;

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }

  /**
   * 删除满足条件的所有数据
   * @param {Object} filter 
   */
  removeAll (filter, physicalDeletion = false) {
    return new Promise((resolve, reject) => {
      this.findAll(filter).then(res => {
        res.forEach(item => {
          this.physicalDeletion || physicalDeletion
            ? _.pull(this.data.rows, item)
            : item.isDelete = true;
        });

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }

  /**
   * 更新满足条件的第一条数据
   * @param {Object} filter 
   * @param {Object} value 
   */
  update (filter, value) {
    return new Promise((resolve, reject) => {
      const result = this.schema ? _validate(_.omit(this.schema, 'required'), value) : true;

      if (result !== true) reject(result);

      this.find(filter).then(res => {
        _.assign(res, value);

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }

  /**
   * 更新满足条件的所有数据
   * @param {Object} filter 
   * @param {Object} value 
   */
  updateAll (filter, value) {
    return new Promise((resolve, reject) => {
      const result = this.schema ? _validate(_.omit(this.schema, 'required'), value) : true;

      if (result !== true) reject(result);

      this.findAll(filter).then(res => {
        res.forEach(item => _.assign(item, value));

        this.write().then(() => resolve(res))
          .catch(reject);
      });
    });
  }
}
