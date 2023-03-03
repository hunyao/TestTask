var app = require("../app");
const request = require('supertest')
const { expectUserRegistrationResponse, expectErrorResponse, setField, wait } = require("./utils")
const { User, sequelize } = require("../models");
const { fetchUrl } = require('fetch')
const fs = require('fs');
var initialData = require("../data/initialData.json")

const TEST_USER = [
  {
    name: 'Test1 Kumokawa',
    email: 'test1@gmail.com',
    phone: '+380123456780',
    position_id: 1,
    photo: __dirname + '/fixtures/test_photo.jpg'
  },
  {
    name: 'Test2 Kumokawa',
    email: 'test2@gmail.com',
    phone: '+380123456781',
    position_id: 2,
    photo: __dirname + '/fixtures/test_photo.jpg'
  },
]
describe('Testing Success Case POST /users', () => {
  let response;
  let userId;
  beforeAll(async () => {
    const {
      body: {
        token
      }
    } = await request(process.env.APP_API_URL).get('/token');
    response = request(process.env.APP_API_URL)
      .post('/users')
      .set('token', token)
    response = await setField(response, TEST_USER[0])
    userId = response.body.user_id;
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectUserRegistrationResponse())
  })
  it('check record', async () => {
    return request(process.env.APP_API_URL)
      .get(`/user/${userId}`)
      .then(({body: {user}}) => {
        expect(user.name).toEqual(TEST_USER[0].name)
        expect(user.email).toEqual(TEST_USER[0].email)
        expect(user.phone).toEqual(TEST_USER[0].phone)
        expect(user.position_id).toEqual(TEST_USER[0].position_id)
        return user;
      })
      .then(user => {
        return new Promise((resolve, reject) => {
          fetchUrl(user.photo, (err, meta, body) => {
            const local = fs.readFileSync(TEST_USER[0].photo);
            expect(Buffer.compare(body, local)).toBe(0)
            resolve();
          })
        })
      })
  })

  afterAll(async () => {
    const user = await User.findByPk(response.body.user_id, {logging: false})
    await user.destroy({logging: false})
  })
})
describe('Testing Reusing Token Case POST /users', () => {
  let response;
  let token;
  beforeAll(async () => {
    const {
      body
    } = await request(process.env.APP_API_URL).get('/token');
    response = request(process.env.APP_API_URL)
      .post('/users')
      .set('token', body.token)
    token = body.token;
    response = await setField(response, TEST_USER[0])
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectUserRegistrationResponse())
  })
  it('reusing the token', async () => {
    let req = request(process.env.APP_API_URL)
      .post('/users')
      .set('token', token)
    const res = await setField(req, TEST_USER[1]);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(expectErrorResponse({
      "message": "The token is invalid."
    }));
  })

  afterAll(async () => {
    const user = await User.findByPk(response.body.user_id, {logging: false})
    await user.destroy({logging: false})
  })
})
describe('Testing No Token Case POST /users', () => {
  let response;
  beforeAll(async () => {
    response = request(process.env.APP_API_URL).post('/users')
    response = await setField(response, TEST_USER[0])
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(401)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectErrorResponse({
      "message": "The token is required."
    }))
  })
})
describe('Testing Wrong Token Case POST /users', () => {
  let response;
  beforeAll(async () => {
    response = request(process.env.APP_API_URL)
      .post('/users')
      .set('token', 'WRONGTOKEN')
    response = await setField(response, TEST_USER[0])
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(400)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectErrorResponse({
      "message": "The token is invalid."
    }))
  })
})
describe('Testing Expired Token Case POST /users', () => {
  let response;
  beforeAll(async () => {
    const {
      body: { token }
    } = await request(process.env.APP_API_URL).get('/token');
    await wait(process.env.APP_TOKEN_EXPIRED_SECOND*1000);
    response = request(process.env.APP_API_URL)
      .post('/users')
      .set('token', token)
    response = await setField(response, TEST_USER[0])
  }, 100000)
  it('check status code', () => {
    expect(response.statusCode).toEqual(401)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectErrorResponse({
      "message": "The token expired."
    }))
  })
})
describe.each([
  [
    'Missing All params',
    {},
    {
      "message": "Validation failed",
      "fails": {
        "name": [ "The name field is required." ],
        "email": [ "The email field is required." ],
        "phone": [ "The phone field is required." ],
        "position_id": [ "The position_id field is required." ],
        "photo": [ "The photo field is required." ],
      }
    },
  ],
  [
    'Missing only "name" param',
    {
      ...Object.fromEntries(
        Object.entries(TEST_USER[0]).filter(([key]) => key !== 'name')
      )
    },
    {
      "message": "Validation failed",
      "fails": {
        "name": [ "The name field is required." ],
      }
    },
  ],
  [
    'Missing only "email" param',
    {
      ...Object.fromEntries(
        Object.entries(TEST_USER[0]).filter(([key]) => key !== 'email')
      )
    },
    {
      "message": "Validation failed",
      "fails": {
        "email": [ "The email field is required." ],
      }
    },
  ],
  [
    'Missing only "phone" param',
    {
      ...Object.fromEntries(
        Object.entries(TEST_USER[0]).filter(([key]) => key !== 'phone')
      )
    },
    {
      "message": "Validation failed",
      "fails": {
        "phone": [ "The phone field is required." ],
      }
    },
  ],
  [
    'Missing only "position_id" param',
    {
      ...Object.fromEntries(
        Object.entries(TEST_USER[0]).filter(([key]) => key !== 'position_id')
      )
    },
    {
      "message": "Validation failed",
      "fails": {
        "position_id": [ "The position_id field is required." ],
      }
    },
  ],
  [
    'Missing only "photo" param',
    {
      ...Object.fromEntries(
        Object.entries(TEST_USER[0]).filter(([key]) => key !== 'photo')
      )
    },
    {
      "message": "Validation failed",
      "fails": {
        "photo": [ "The photo field is required." ],
      }
    },
  ],
  [
    'Too Short Length "name" param',
    {
      ...TEST_USER[0],
      "name": "A"
    },
    {
      "message": "Validation failed",
      "fails": {
        "name": [ "The name must be at least 2 characters." ],
      }
    },
  ],
  [
    'Too Long Length "name" param',
    {
      ...TEST_USER[0],
      "name": "A".repeat(61)
    },
    {
      "message": "Validation failed",
      "fails": {
        "name": [ "The name must be less than or equal to 60 characters." ],
      }
    },
  ],
  [
    'Too Short Length "email" param',
    {
      ...TEST_USER[0],
      "email": "A"
    },
    {
      "message": "Validation failed",
      "fails": {
        "email": [ "The email must be at least 2 characters.", "The email must be a valid email address." ],
      }
    },
  ],
  [
    'Too Long Length "email" param',
    {
      ...TEST_USER[0],
      "email": "A".repeat(101)
    },
    {
      "message": "Validation failed",
      "fails": {
        "email": [ "The email must be less than or equal to 100 characters.", "The email must be a valid email address." ],
      }
    },
  ],
  [
    'Invalid "phone" param case1',
    {
      ...TEST_USER[0],
      "phone": "+390123456789"
    },
    {
      "message": "Validation failed",
      "fails": {
        "phone": [ "The phone must be a valid phone number" ],
      }
    },
  ],
  [
    'Invalid "phone" param case2',
    {
      ...TEST_USER[0],
      "phone": "+38012345678"
    },
    {
      "message": "Validation failed",
      "fails": {
        "phone": [ "The phone must be a valid phone number" ],
      }
    },
  ],
  [
    'Invalid "phone" param case3',
    {
      ...TEST_USER[0],
      "phone": "+abcdefghijk"
    },
    {
      "message": "Validation failed",
      "fails": {
        "phone": [ "The phone must be a valid phone number" ],
      }
    },
  ],
  [
    'Invalid "position_id" param case1',
    {
      ...TEST_USER[0],
      "position_id": "A"
    },
    {
      "message": "Validation failed",
      "fails": {
        "position_id": [ "The position_id must be an integer." ],
      }
    },
  ],
  [
    'Invalid "position_id" param case2',
    {
      ...TEST_USER[0],
      "position_id": "999999999"
    },
    {
      "message": "Validation failed",
      "fails": {
        "position_id": [ "The position_id is invalid." ],
      }
    },
  ],
  [
    'Greater than 5MB "photo" param',
    {
      ...TEST_USER[0],
      "photo": __dirname + '/fixtures/greater_than_5mb.jpg'
    },
    {
      "message": "Validation failed",
      "fails": {
        "photo": [ "The photo may not be greater than 5 Mbytes." ],
      }
    },
  ],
  [
    'Not jpeg "photo" param',
    {
      ...TEST_USER[0],
      "photo": __dirname + '/fixtures/not_jpeg.png'
    },
    {
      "message": "Validation failed",
      "fails": {
        "photo": [ "Image is invalid." ],
      }
    },
  ],
  [
    'Too small "photo" param',
    {
      ...TEST_USER[0],
      "photo": __dirname + '/fixtures/too_small.jpg'
    },
    {
      "message": "Validation failed",
      "fails": {
        "photo": [ "The dimensions of photo must be 70x70px or larger." ],
      }
    },
  ],
  [
    'Already Exsisting a phone number',
    {
      ...TEST_USER[0],
      "phone": initialData.Users[0].phone
    },
    {
      "message": "User with this phone or email already exist",
    },
    409
  ],
  [
    'Already Exsisting an email address',
    {
      ...TEST_USER[0],
      "email": initialData.Users[0].email
    },
    {
      "message": "User with this phone or email already exist",
    },
    409
  ],
])('Testing Failing Case POST /users %s', (_, postParams = {}, expectParams = {}, statusCode = 422, debug = false) => {
  let response;
  beforeAll(async () => {
    const {
      body: { token }
    } = await request(process.env.APP_API_URL).get('/token');
    response = request(process.env.APP_API_URL)
      .post('/users')
      .set('token', token)
    response = await setField(response, postParams)
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(statusCode)
  })
  it('check properties', () => {
    if (debug) {
      console.log('RESPONSE', response.body)
    }
    expect(response.body).toEqual(expectErrorResponse(expectParams))
  })
})
afterAll(async () => {
  await sequelize.close()
})

// vim: sw=2:ai
