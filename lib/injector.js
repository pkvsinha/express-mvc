const RemoteHttp = require('./http-client');

const _SERVICES = {
  httpClient: new RemoteHttp(process.env.SOME_ENDPOINT),
};

const ARROW_ARG = /^([^(]+?)=>/;
const FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function extractArguments(fn) {
  const fnText = Function.prototype.toString.call(fn).replace(STRIP_COMMENTS, '');
  return fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
}

function annotateFn(argFn) {
  if (Array.isArray(argFn)) {
    return {
      fn: argFn.splice(-1)[0],
      args: argFn
    };
  } else if (typeof argFn === 'function') {
    const args = [];
    extractArguments(argFn)[1]
      .split(FN_ARG_SPLIT).forEach((arg) => {
        arg.replace(FN_ARG, (all, underscore, name) => {
          args.push(name);
        });
      });
    return {
      fn: argFn,
      args
    };
  }
}

module.exports = function Injector(argFn) {
  const annotatedFn = annotateFn(argFn);
  const injectArgs = annotatedFn.args;
  const { fn } = annotatedFn;
  return function AnnotatedRequest(request, response, next) {
    const args = [];
    const locals = {
      request,
      response,
      next,
      req: request,
      res: response
    };
    for (let i = 0, { length } = injectArgs; i < length; i += 1) {
      const key = injectArgs[i];
      args.push(locals && Object.prototype.hasOwnProperty.call(locals, key)
        ? locals[key] : _SERVICES[key]);
    }
    fn.apply({}, args);
  };
};
