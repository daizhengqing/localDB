export const has = path => {
  return new Promise((resolve) => {
    fs.stat(path, (err, stats) => {
      err ? resolve(false) : stats ? resolve(true) : resolve(false);
    });
  });
};

export const mkdir = (path) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      err
        ? reject(err)
        : resolve();
    });
  });
};

export const write = path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      err
        ? reject(err)
        : resolve(data);
    });
  });
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

export const copyTo = (to, from) => {
  return new Promise((resolve, reject) => {
    fs.copyFile(from, to, err => {
      err
        ? reject()
        : resolve();
    });
  });
};