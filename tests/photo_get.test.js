var app = require("../app");
const request = require('supertest')
const { expectUserResponse, expectErrorResponse } = require("./utils")
const { fetchUrl } = require('fetch')
var initialData = require("../data/initialData.json")

describe.each([
  ...initialData.Users
])('Testing Success Case GET /user/{id}/photo', (user) => {
  let response;
  let originalPhoto;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get(`/user/${user.id}/photo`);
    originalPhoto = await new Promise((resolve, reject) => {
      fetchUrl(user.url, (err, meta, body) => {
        resolve(body)
      })
    })
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check binary', () => {
    expect(Buffer.compare(response.body, originalPhoto)).toBe(0)
  })
})
describe('Testing Wrong id Case GET /user/{id}/photo', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/user/abc/photo')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(400)
  })
})
describe('Testing Not Exsisting id Case GET /user/{id}/photo', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/user/9999999/photo')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(404)
  })
})

// vim: sw=2:ai
