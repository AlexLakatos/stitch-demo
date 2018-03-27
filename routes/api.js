var express = require('express');
var path = require('path');
var router = express.Router();
var Nexmo = require('nexmo');
var config = require('../config');
var debug = require('debug')('stitch-demo:server');


var nexmo = new Nexmo({ apiKey: config.API_KEY, apiSecret: config.API_SECRET, applicationId: config.APP_ID, privateKey: config.PRIVATE_KEY });

const adminAcl = {
  "paths": {
    "/v1/sessions/**": {},
    "/v1/users/**": {},
    "/v1/conversations/**": {}
  }
}

const nonAdminAcl = {
  "paths": {
    "/v1/sessions/**": {
      "methods": ["GET"]
    },
    "/v1/users/*": {
      "methods": ["GET"]
    },
    "/v1/conversations/*": {
      "methods": ["GET", "POST", "PUT"]
    }
  }
}

router.post('/users', function (req, res, next) {
  var username = req.body.username
  var admin = req.body.admin

  nexmo.users.create({
    name: username
  }, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json({
        user: response,
        user_jwt: Nexmo.generateJwt(config.PRIVATE_KEY, {
          application_id: config.APP_ID,
          sub: username,
          exp: new Date().getTime() + 86400,
          acl: admin
            ? adminAcl
            : nonAdminAcl
        })
      })
    }
  })
});

router.post('/conversations', function (req, res, next) {
  var displayName = req.body.displayName

  nexmo.conversations.create({
    display_name: displayName
  }, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  })
});


router.put('/conversations', function (req, res, next) {
  debug(req.body)
  var conversationId = req.body.conversationId
  var userId = req.body.userId
  var action = req.body.action

  nexmo.conversations.members.add(conversationId, {
    "action": action,
    "user_id": userId,
    "channel": {
      "type": "app"
    }
  }, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  })
})

router.get('/users', function (req, res) {
  nexmo.users.get({}, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  });
});

router.get('/conversations', function (req, res) {
  nexmo.conversations.get({}, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  });
});

router.get('/conversations/:id', function (req, res) {
  nexmo.conversations.get(req.params.id, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  });
});


router.get('/jwt/:user', function (req, res, next) {
  var admin = req.query.admin
  nexmo.users.get({}, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      var filteredUsers = response.filter(user => user.name == req.params.user)
      if (filteredUsers.length === 0) {
        res.json({ error: "User not found" })
      } else {
        res.json({
          user_jwt: Nexmo.generateJwt(config.PRIVATE_KEY, {
            application_id: config.APP_ID,
            sub: req.params.user,
            exp: new Date().getTime() + 86400,
            acl: admin
              ? adminAcl
              : nonAdminAcl
          })
        });
      }
    }
  });
});

router.get('/', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


module.exports = router;
