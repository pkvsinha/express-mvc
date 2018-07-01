const http = require('http');
const axios = require('axios');
const winston = require('winston');

const TOKENS = {};

function tokenActive() {
  return !!TOKENS.token && TOKENS.expireTimeInMs > Date.now();
}

function authorizationToken() {
  if (tokenActive()) {
    return Promise.resolve(TOKENS.token.access_token);
  }
  TOKENS.expireTimeInMs = -1;
  TOKENS.token = undefined;
  return axios.post(process.env.IDENTITY_SVC_URL, {
    client_id: process.env.IDENTITY_SVC_CLIENT_ID,
    grant_type: 'password',
    scope: 'oob',
    username: process.env.IDENTITY_SVC_CLIENT_USERNAME,
    password: process.env.IDENTITY_SVC_CLIENT_PASSWORD
  }).then((response) => {
    TOKENS.token = response.data;
    TOKENS.expireTimeInMs = Date.now() + (TOKENS.token.expires_in * 1000);
    return TOKENS.token;
  });
}

function parseUrlForPipe(url) {
  const [emp, protocol, host, port, context] = url.split(/^(https?):?\/?\/?([a-zA-Z\.\-0-9]+):?(\d*)(\/?.*)$/);
  return { host, port, context };
}

function withAuthToken(options, callback, ...args) {
  const optionsTemp = options;
  if (process.env.DISABLE_IDENTITY && process.env.NODE_ENV !== 'production') {
    winston.warn('Identity Authorization Header for downstream system calls is disabled');
    return callback.apply(null, [options, ...args]);
  }
  return authorizationToken().then((_token) => {
    optionsTemp.headers.Authorization = `Bearer ${_token}`;
    return callback.apply(null, [options, ...args]);
  });
}

function handleRequest(options, req, res) {
  const downstreamReq = http.request(options, (downstreamRes) => {
    downstreamRes.pipe(res);
  });
  downstreamReq.on('error', (e) => {
    res.writeHead(500, {
      'Content-Type': 'application/json'
    });
    res.write(JSON.stringify({
      message: e.message
    }));
    res.end();
  });
  req.pipe(downstreamReq);
}

class RemoteHttp {
  constructor(remoteUrl) {
    this.remoteUrl = remoteUrl;
  }
}

RemoteHttp.prototype.get = function get(path, params, headers) {
  winston.info(`Downstream GET call to ${this.remoteUrl}/${path}`);
  return withAuthToken({
    url: `${this.remoteUrl}/${path}`,
    method: 'GET',
    params,
    headers: headers || {}
  }, axios);
};

RemoteHttp.prototype.getPipe = function getPipe(path, req, res) {
  winston.info(`Downstream piped GET call to ${this.remoteUrl}/${path}`);
  const { host, port, context } = parseUrlForPipe(this.remoteUrl);
  withAuthToken({
    host,
    port,
    path: `${context}/${path}`,
    method: 'GET',
    headers: req.headers
  }, handleRequest, req, res);
};

RemoteHttp.prototype.post = function post(path, data, headers) {
  winston.info(`Downstream POST call to ${this.remoteUrl}/${path}`);
  return withAuthToken({
    url: `${this.remoteUrl}/${path}`,
    method: 'POST',
    headers: headers || {},
    data
  }, axios);
};

RemoteHttp.prototype.postPipe = function getPipe(path, req, res) {
  winston.info(`Downstream piped POST call to ${this.remoteUrl}/${path}`);
  const { host, port, context } = parseUrlForPipe(this.remoteUrl);
  withAuthToken({
    host,
    port,
    path: `${context}/${path}`,
    method: 'POST',
    headers: req.headers
  }, handleRequest, req, res);
};

RemoteHttp.prototype.put = function put(path, data, headers) {
  winston.info(`Downstream PUT call to ${this.remoteUrl}/${path}`);
  return withAuthToken({
    url: `${this.remoteUrl}/${path}`,
    method: 'PUT',
    headers: headers || {},
    data
  }, axios);
};

RemoteHttp.prototype.putPipe = function putPipe(path, req, res) {
  winston.info(`Downstream piped PUT call to ${this.remoteUrl}/${path}`);
  const { host, port, context } = parseUrlForPipe(this.remoteUrl);
  withAuthToken({
    host,
    port,
    path: `${context}/${path}`,
    method: 'PUT',
    headers: req.headers
  }, handleRequest, req, res);
};

RemoteHttp.prototype.delete = function deleteMethod(path, params, headers) {
  winston.info(`Downstream DELETE call to ${this.remoteUrl}/${path}`);
  return withAuthToken({
    url: `${this.remoteUrl}/${path}`,
    method: 'DELETE',
    params,
    headers: headers || {}
  }, axios);
};

RemoteHttp.prototype.deletePipe = function deletePipe(path, req, res) {
  winston.info(`Downstream piped DELETE call to ${this.remoteUrl}/${path}`);
  const { host, port, context } = parseUrlForPipe(this.remoteUrl);
  withAuthToken({
    host,
    port,
    path: `${context}/${path}`,
    method: 'DELETE',
    headers: req.headers
  }, handleRequest, req, res);
};

module.exports = function RemoteHttpFactory(identifier) {
  return new RemoteHttp(identifier);
};
