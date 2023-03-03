var app = require("../app");
const request = require('supertest')
const { expectTokenResponse } = require("./utils")

describe('Testing Success Case GET /token', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/token')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectTokenResponse())
  })
})

// vim: sw=2:ai
