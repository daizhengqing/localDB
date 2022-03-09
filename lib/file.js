import fs from 'fs';

import { dirname } from 'path';

import { v4 as uuidv4 } from 'uuid';

import EventEmitter from 'events';

const writeTasks = new Map();

const writeTasksEvent = new EventEmitter();

writeTasksEvent.setMaxListeners(9999);

export const has = path => {
  return new Promise((resolve) => {
    fs.stat(path, (err, stats) => {
      err ? resolve(false) : stats ? resolve(true) : resolve(false);
    });
  });
};

export const mkdir = (path) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (err, data) => {
      err
        ? reject(err)
        : resolve();
    });
  });
};

const writeFile = async (path, data, taskId) => {
  if (!await has(dirname(path))) await mkdir(dirname(path));

  fs.writeFile(path, data, (err, data) => {
    if (err) {
      console.error(path, data, err);

      writeTasksEvent.emit(taskId, { status: false, result: err });
    } else {
      writeTasksEvent.emit(taskId, { status: true, result: data });
    }

    writeTasks.get(path).shift();

    if (writeTasks.get(path).length > 0) {
      const { taskId, data } = writeTasks.get(path)[0];

      writeFile(path, data, taskId);
    } else {
      writeTasks.delete(path);
    }
  });
};

export const write = async (path, data) => {
  try {
    return new Promise((resolve, reject) => {
      const taskId = uuidv4();

      writeTasksEvent.once(taskId, res => {
        res.status ? resolve(res.result) : reject(res.result);
      });
    
      if (writeTasks.has(path)) {
        writeTasks.get(path).push({ taskId, data });
      } else {
        writeTasks.set(path, [{ taskId, data }]);

        writeFile(path, data, taskId);
      }
    });
  } catch (err) {
    throw new Error(err);
  }
};

export const read = path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      err
        ? reject(err)
        : resolve(data);
    });
  });
};

export const remove = (path) => {
  return new Promise((resolve, reject) => {
    fs.rm(path, { force: true, maxRetries: 10, recursive: true, retryDelay: 500 }, (err, data) => {
      err
        ? reject(err)
        : resolve();
    });
  });
};