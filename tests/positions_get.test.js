var app = require("../app");
const request = require('supertest')
const { expectPositionsResponse } = require("./utils")

describe('Testing Success Case GET /positions', () => {
  let response;
  beforeAll(async () => {
    response = await request(process.env.APP_API_URL).get('/positions')
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check properties', () => {
    expect(response.body).toEqual(expectPositionsResponse())
  })
})

// vim: sw=2:ai
