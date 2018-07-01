const express = require('express');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const injector = require('./injector');

const PATH = path.join(__dirname, '..', 'controllers');
const REGEX = /^\//;
const PATH_REGEX = /^\/:/;
function formMethodUrl(key, prefix, pathId) {
  if (REGEX.test(prefix)) {
    prefix = prefix.slice(1);
  }
  if (PATH_REGEX.test(pathId)) {
    pathId = pathId.slice(2);
  }
  if (REGEX.test(pathId)) {
    pathId = pathId.slice(1);
  }
  let method;
  let url;
  switch (key) {
    case 'get':
      method = 'get';
      url = `/${prefix}/:${pathId}`;
      break;
    case 'list':
      method = 'get';
      url = `/${prefix}s`;
      break;
    case 'edit':
      method = 'get';
      url = `/${prefix}/:${pathId}/edit`;
      break;
    case 'update':
      method = 'put';
      url = `/${prefix}/:${pathId}`;
      break;
    case 'create':
      method = 'post';
      url = `/${prefix}`;
      break;
    case 'delete':
      method = 'delete';
      url = `/${prefix}/:${pathId}`;
      break;
    case 'index':
      method = 'get';
      url = '/';
      break;
    default:
      /* istanbul ignore next */
      throw new Error(`unrecognized route: ${name}.${key}`);
  }
  return { method, url };
}

function processAPI(key, handler, prefix, pathId) {
  if (Array.isArray(handler) || typeof handler === 'function') {
    return { handler: injector(handler), ...formMethodUrl(key, prefix, pathId) };
  }

  if (typeof handler === 'object') {
    const methodHandler = injector(handler.handler);
    if (!handler.method) {
      return {
        ...formMethodUrl(key, prefix, handler.url),
        handler: methodHandler,
        before: handler.before
      };
    }
    return {
      method: handler.method.toLowerCase(),
      url: prefix + handler.url,
      handler: methodHandler,
      before: handler.before
    };
  }

  return undefined;
}

module.exports = function loadControllers(parent, options) {
  winston.info('Automatically Detecting Controller files...');
  fs.readdirSync(PATH).forEach((name) => {
    const file = path.join(PATH, name);
    if (fs.statSync(file).isDirectory()) return;
    winston.info('\t%s:', file);
    const obj = require(file);
    const prefix = obj.endpoint || name;
    const pathId = obj.pathId || 'id';
    const app = express.Router();
    Object.getOwnPropertyNames(obj.api).forEach((key) => {
      const {
        method, url, handler, before
      } = processAPI(key, obj.api[key], prefix, pathId);
      winston.info(`\t \t ${method.toUpperCase()} - ${options.contextPath}/api${url}`);
      // before middleware support
      if (before) {
        app[method](url, before, handler);
      } else {
        app[method](url, handler);
      }
    });
    // mount the app
    parent.use(`${options.contextPath}/api`, app);
  });
};
