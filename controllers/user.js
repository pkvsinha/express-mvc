const winston = require('winston');
const users = [
  { name: 'Manager 1', id: 1 },
  { name: 'Manager 2', id: 2 }
];
exports.endpoint = '/user';

exports.api = {
  get: (req, res, httpClient) => {
    const user = users.find(user => user.id == req.params.id);
    if (!user) return res.sendStatus(404);
    res.send(user);
  },
  list: (req, res, httpClient) => {
    res.send(users);
  },
  update: (req, res, httpClient) => {
    const user = users.find(user => user.id == req.params.id);
    if (!user) return res.sendStatus(404);
    user.name = req.body.name;
    res.send(user);
  },
  create: (req, res, httpClient) => {
    const manager = req.body;
    manager.id = id++;
    users.push(manager);
    res.send(manager);
  },
  delete: (req, res, httpClient) => {let i = 0;
    for (; i <= users.length; i++) {
      if (users[i].id == req.params.id) {
        break;
      }
    }
    res.send(users.splice(i, 1));
  },
  myOwnMethod: {
    url: '/upload/:someParam',
    method: 'POST',
    handler: (req, res, httpClient) => {
      httpClient
        .postPipe(`files?resourceType=${req.params.someParam}`, req, res);
    }
  }
};
