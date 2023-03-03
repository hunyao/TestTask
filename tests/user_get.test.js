var app = require("../app");
const request = require('supertest')
const { expectUserResponse, expectErrorResponse } = require("./utils")

describe('Testing Success Case GET /user/{id}', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/user/1')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectUserResponse(1))
  })
})
describe('Testing Wrong id Case GET /user/{id}', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/user/abc')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(400)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectErrorResponse({
      "message": "Validation failed",
      "fails": {
        "user_id": [
          "The user_id must be an integer."
        ]
      }
    }))
  })
})
describe('Testing Not Exsisting id Case GET /user/{id}', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/user/9999999')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(404)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectErrorResponse({
      "message": "The user with the requested identifier does not exist",
      "fails": {
        "user_id" : [
          "User not found"
        ]
      }
    }))
  })
})

// vim: sw=2:ai
