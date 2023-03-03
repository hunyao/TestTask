var Crypto = require("crypto");
var express = require('express');
var router = express.Router();
var { Sequelize, User, Position, Photo, Token } = require('../models');
var { Op } = require("sequelize");
var multer = require('multer');
var upload = multer();
var moment = require('moment');
var sizeOf = require('image-size')
const TOKEN_EXPIRED_SECOND = process.env.APP_TOKEN_EXPIRED_SECOND || 40*60
const getUrl = (req) => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https': req.protocol;
  return `${protocol}://${req.get('host')}`
}

/* GET home page. */
router.get('/token', async function(req, res, next) {
  const token = await Token.create({
    token: Crypto.randomBytes(128).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
    used: false
  })
  res.json({
    "success": true,
    "token": token.token
  })
});
router.get('/users', async function(req, res, next) {
  const page = req.query.page || 1;
  const offset = req.query.offset || 0;
  const count = req.query.count || 5;
  const errmsg = {
    count: [],
    page: [],
    offset: []
  };
  let err = false;

  if (isNaN(page) === true) {
    err = true;
    errmsg.page.push('The page must be an integer.');
  }
  if (Number(page) < 1) {
    err = true;
    errmsg.page.push('The page must be at least 1.');
  }
  if (isNaN(offset) === true) {
    err = true;
    errmsg.offset.push('The offset must be an integer.');
  }
  if (Number(offset) < 0) {
    err = true;
    errmsg.offset.push('The offset must be at least 0.');
  }
  if (isNaN(count) === true) {
    err = true;
    errmsg.count.push('The count must be an integer.');
  }
  if (Number(count) < 1) {
    err = true;
    errmsg.count.push('The count must be at least 1.');
  }
  if (Number(count) > 100) {
    err = true;
    errmsg.count.push('The count must be less than or equal to 100.');
  }
  if (err) {
    res.status(422);
    res.json({
      "success": false,
      "message": "Validation failed",
      "fails": Object.fromEntries(
        Object.entries(errmsg).filter(([_, val]) => val.length > 0)
      )
    })
    return;
  }

  const nextPage = Number(page) + 1;
  const prevPage = Number(page) - 1;
  const userCounts = (await User.count()) - Number(offset);
  const totalPages = Math.ceil(userCounts / Number(count));
  const users = await User.findAll({
    attributes: [
      'id',
      'name',
      'email',
      'phone',
      [
        Sequelize.col('positionAs.name'),
        'position'
      ],
      [
        'positionAsId',
        'position_id'
      ],
      [
        Sequelize.literal('extract(epoch FROM "User"."createdAt")'),
        'registration_timestamp'
      ]
    ],
    include: [
      {
        model: Position,
        as: 'positionAs',
        attributes: []
      }
    ],
    limit: count,
    offset: (Number(offset) + Number(count) * (Number(page) - 1) ),
    order: [
      [Sequelize.col('User.createdAt'), 'DESC']
    ]
  });
  if (users.length === 0) {
    res.status(404);
    res.json({
      "success": false,
      "message": "Page not found"
    })
    return;
  }
  res.json({
    "success": true,
    "page": Number(page),
    "total_pages": userCounts < Number(count) ? 1 : totalPages,
    "total_users": userCounts,
    "count": users.length,
    "links": {
      "next_url": Number(page) === totalPages ? null : `${getUrl(req)}/users?page=` + nextPage + "&count=" + count + "&offset=" + offset,
      "prev_url": Number(page) === 1 ? null : `${getUrl(req)}/users?page=` + prevPage + "&count=" + count + "&offset=" + offset
    },
    "users": users.map(u => {
      return {
        ...u.toJSON(),
        photo: `${getUrl(req)}/user/` + u.id + '/photo'
      }
    })
  });
});
const cpUpload = upload.fields([
  { name: 'name', maxCount: 1 },
  { name: 'email', maxCount: 1 },
  { name: 'phone', maxCount: 1 },
  { name: 'position_id', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
])
router.post('/users', cpUpload, async function(req, res, next) {
  const {
    token
  } = req.headers;
  const {
    name,
    email,
    phone,
    position_id,
  } = req.body || {}
  const {
    photo
  } = req.files || {}

  if (token === undefined) {
    res.status(401);
    res.json({
      "success": false,
      "message": "The token is required."
    });
    return;
  }
  const tokenData = await Token.findOne({
    where: {
      token: token
    }
  });
  if (!tokenData || tokenData.used) {
    res.status(400);
    res.json({
      "success": false,
      "message": "The token is invalid."
    });
    return;
  }
  if (moment(tokenData.createdAt).add(TOKEN_EXPIRED_SECOND, 's').isBefore(moment())) {
    res.status(401);
    res.json({
      "success": false,
      "message": "The token expired."
    });
    return;
  }
  const errMsg = {
    name: [],
    email: [],
    phone: [],
    position_id: [],
    photo: []
  }
  let err = false;
  const emailRegrex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
  const phoneRegrex = /^[\+]{0,1}380([0-9]{9})$/
  if (!name) {
    errMsg.name.push('The name field is required.');
    err = true;
  }
  if (name && name.length < 2) {
    errMsg.name.push('The name must be at least 2 characters.');
    err = true;
  }
  if (name && name.length > 60) {
    errMsg.name.push('The name must be less than or equal to 60 characters.');
    err = true;
  }
  if (!email) {
    errMsg.email.push('The email field is required.');
    err = true;
  }
  if (email && email.length < 2) {
    errMsg.email.push('The email must be at least 2 characters.');
    err = true;
  }
  if (email && email.length > 100) {
    errMsg.email.push('The email must be less than or equal to 100 characters.');
    err = true;
  }
  if (email && !email.match(emailRegrex)) {
    errMsg.email.push('The email must be a valid email address.');
    err = true;
  }
  if (!phone) {
    errMsg.phone.push('The phone field is required.');
    err = true;
  }
  if (phone && !phone.match(phoneRegrex)) {
    errMsg.phone.push('The phone must be a valid phone number');
    err = true;
  }
  if (!position_id) {
    errMsg.position_id.push('The position_id field is required.');
    err = true;
  }
  if (position_id && isNaN(position_id) === true) {
    errMsg.position_id.push('The position_id must be an integer.');
    err = true;
  }
  if (!photo || photo.length === 0) {
    errMsg.photo.push('The photo field is required.');
    err = true;
  }
  if (photo && photo[0].size > 5*1024*1024) {
    errMsg.photo.push('The photo may not be greater than 5 Mbytes.');
    err = true;
  }
  if (photo && photo[0].mimetype !== 'image/jpeg' ) {
    errMsg.photo.push('Image is invalid.');
    err = true;
  }
  if (photo && photo[0].mimetype === 'image/jpeg' ) {
    const { height, width } = sizeOf(photo[0].buffer);
    if (height < 70 || width < 70) {
      errMsg.photo.push('The dimensions of photo must be 70x70px or larger.');
      err = true;
    }
  }
  if (!isNaN(position_id)) {
    const position = await Position.findByPk(position_id);
    if (!position) {
      errMsg.position_id.push('The position_id is invalid.');
      err = true;
    }
  }
  if (err) {
    res.status(422);
    res.json({
      "success": false,
      "message": "Validation failed",
      "fails": Object.fromEntries(
        Object.entries(errMsg).filter(([_, val]) => val.length > 0)
      )
    })
    return;
  }
  const userForChecking = await User.findAll({
    where: {
      [Op.or]: [
        {
          email: email,
        },
        {
          phone: phone
        }
      ]
    }
  })
  if (userForChecking.length !== 0) {
    res.status(409)
    res.json({
      "success": false,
      "message": "User with this phone or email already exist"
    });
    return;
  }

  tokenData.used = true;
  await tokenData.save();
  const PhotoIns = await Photo.create({
    data: photo[0].buffer
  })
  const UserIns = await User.create({
    name: name,
    email: email,
    phone: phone,
    positionAsId: position_id,
    photoAsId: PhotoIns.id
  })
  res.json({
    "success" : true,
    "user_id" : UserIns.id,
    "message" : "New user successfully registered"
  })
});

router.get('/user/:id', async function(req, res, next) {
  const { id } = req.params;
  if (isNaN(id) === true) {
    res.status(400);
    res.json({
      "success": false,
      "message": "Validation failed",
      "fails": {
        "user_id": [
          "The user_id must be an integer."
        ]
      }
    });
    return;
  }

  const user = await User.findByPk(id, {
    attributes: [
      'id',
      'name',
      'email',
      'phone',
      [
        Sequelize.col('positionAs.name'),
        'position'
      ],
      [
        'positionAsId',
        'position_id'
      ],
    ],
    include: [
      {
        model: Position,
        as: 'positionAs',
        attributes: []
      }
    ],
  });
  if (!user) {
    res.status(404);
    res.json({
      "success": false,
      "message": "The user with the requested identifier does not exist",
      "fails": {
        "user_id" : [
          "User not found"
        ]
      }
    });
    return;
  }

  res.json({
    "success": true,
    "user": {
      ...user.toJSON(),
      photo: `${getUrl(req)}/user/` + user.id + '/photo'
    }
  })
});
router.get('/user/:id/photo', async function(req, res, next) {
  const { id } = req.params;
  if (isNaN(id) === true) {
    res.status(400);
    res.send();
    return;
  }
  const user = await User.findByPk(id);
  if (!user) {
    res.status(404);
    res.send();
    return;
  }
  const photo = await Photo.findByPk(user.photoAsId);
  if (!photo) {
    res.status(404);
    res.send();
    return;
  }
  res.contentType('image/jpeg')
  res.send(photo.data)
});
router.get('/positions', async function(req, res, next) {
  const positions = await Position.findAll({
    attributes: [
      "id", "name"
    ],
    order: [
      ['id', 'ASC']
    ]
  });

  if (positions.length === 0) {
    res.status(404);
    res.json({
      "success": false,
      "message": "Positions not found"
    })
  }

  res.json({
    "success": true,
    "positions": positions
  })
});

module.exports = router;
