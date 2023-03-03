var app = require("../app");
const request = require('supertest')
const { expectResponse, expectErrorResponse } = require("./utils")
const { User } = require("../models")

describe.each([
  [
    'no params',
    {},
    {page: 1, total_pages: 2, count: 5, offset: 0, reqCount: 5}
  ],
  [
    'offset=0',
    {offset: 0},
    {page: 1, total_pages: 2, count: 5, offset: 0, reqCount: 5}
  ],
  [
    'offset=1',
    {offset: 1},
    {page: 1, total_pages: 2, count: 5, offset: 1, reqCount: 5}
  ],
  [
    'page=1',
    {page: 1},
    {page: 1, total_pages: 2, count: 5, offset: 0, reqCount: 5}
  ],
  [
    'page=2',
    {page: 2},
    {page: 2, total_pages: 2, count: 3, offset: 0, reqCount: 5}
  ],
  [
    'count=1',
    {count: 1},
    {page: 1, total_pages: 8, count: 1, offset: 0, reqCount: 1}
  ],
  [
    'count=6',
    {count: 6},
    {page: 1, total_pages: 2, count: 6, offset: 0, reqCount: 6}
  ],
  [
    'count=8',
    {count: 8},
    {page: 1, total_pages: 1, count: 8, offset: 0, reqCount: 8}
  ],
  [
    'count=100',
    {count: 100},
    {page: 1, total_pages: 1, count: 8, offset: 0, reqCount: 100}
  ],
  [
    'page=1, offset=2',
    {page: 1, offset: 2},
    {page: 1, total_pages: 2, count: 5, offset: 2, reqCount: 5}
  ],
  [
    'page=1, offset=3',
    {page: 1, offset: 3},
    {page: 1, total_pages: 1, count: 5, offset: 3, reqCount: 5},
  ],
  [
    'page=2, offset=1',
    {page: 2, offset: 1},
    {page: 2, total_pages: 2, count: 2, offset: 1, reqCount: 5},
  ],
  [
    'page=2, offset=2',
    {page: 2, offset: 2},
    {page: 2, total_pages: 2, count: 1, offset: 2, reqCount: 5},
  ],
  [
    'count=2, page=2',
    {count: 2, page: 2},
    {page: 2, total_pages: 4, count: 2, offset: 0, reqCount: 2},
  ],
  [
    'count=2, page=2, offset=3',
    {count: 2, page: 2, offset: 3},
    {page: 2, total_pages: 3, count: 2, offset: 3, reqCount: 2},
  ],
  [
    'count=2, page=3, offset=3',
    {count: 2, page: 3, offset: 3},
    {page: 3, total_pages: 3, count: 1, offset: 3, reqCount: 2},
  ],
])('Testing Success Case GET /users %s', (_, searchParams = {}, expectParams = {}, debug = false) => {
  let response;
  beforeAll(async () => {
    const params = (new URLSearchParams(searchParams)).toString()
    response = await request(process.env.APP_API_URL).get('/users?' + params)
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(200)
  })
  it('check properties', () => {
    if (debug) {
      console.log('RESPONSE', response.body)
      console.log('RESPONSE LENGTH', response.body.users.length)
      console.log('EXPECT', expectResponse(expectParams))
    }
    expect(response.body).toEqual(expectResponse(expectParams))
  })
})

describe.each([
  [
    'count=0',
    {count: 0},
    {
      message: 'Validation failed',
      fails: {count: ['The count must be at least 1.']}
    },
    422
  ],
  [
    'count=-1',
    {count: -1},
    {
      message: 'Validation failed',
      fails: {count: ['The count must be at least 1.']}
    },
    422
  ],
  [
    'count=101',
    {count: 101},
    {
      message: 'Validation failed',
      fails: {count: ['The count must be less than or equal to 100.']}
    },
    422
  ],
  [
    'count=abc',
    {count: 'abc'},
    {
      message: 'Validation failed',
      fails: {count: ['The count must be an integer.']}
    },
    422
  ],
  [
    'page=0',
    {page: 0},
    {
      message: 'Validation failed',
      fails: {page: ['The page must be at least 1.']}
    },
    422
  ],
  [
    'page=abc',
    {page: 'abc'},
    {
      message: 'Validation failed',
      fails: {page: ['The page must be an integer.']}
    },
    422
  ],
  [
    'offset=-1',
    {offset: -1},
    {
      message: 'Validation failed',
      fails: {offset: ['The offset must be at least 0.']}
    },
    422
  ],
  [
    'offset=abc',
    {offset: 'abc'},
    {
      message: 'Validation failed',
      fails: {offset: ['The offset must be an integer.']}
    },
    422
  ],
  [
    'count=0, page=0',
    {count: 0, page: 0},
    {
      message: 'Validation failed',
      fails: {
        count: ['The count must be at least 1.'],
        page: ['The page must be at least 1.']
      }
    },
    422
  ],
  [
    'count=0, page=0, offset=-1',
    {count: 0, page: 0, offset: -1},
    {
      message: 'Validation failed',
      fails: {
        count: ['The count must be at least 1.'],
        page: ['The page must be at least 1.'],
        offset: ['The offset must be at least 0.']
      }
    },
    422
  ],
  [
    'page=3',
    {page: 3},
    {
      message: 'Page not found',
    },
    404
  ],
  [
    'page=100',
    {page: 100},
    {
      message: 'Page not found',
    },
    404
  ],
])('Testing Failing Case GET /users %s', (_, searchParams = {}, expectParams = {}, statusCode, debug = false) => {
  let response;
  beforeAll(async () => {
    const params = (new URLSearchParams(searchParams)).toString()
    response = await request(process.env.APP_API_URL).get('/users?' + params)
  })
  it('check status code', () => {
    expect(response.statusCode).toEqual(statusCode)
  })
  it('check properties', () => {
    if (debug) {
      console.log('RESPONSE', response.body)
      console.log('EXPECT', expectErrorResponse(expectParams))
    }
    expect(response.body).toEqual(expectErrorResponse(expectParams))
  })
})

// vim: sw=2:ai
