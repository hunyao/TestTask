var initialData = require("../data/initialData.json")

const wait = (time = 1000) => {
  return new Promise((resolve, reject) => setTimeout(resolve, time))
}
const setField = (request, obj) => {
  Object.entries(obj)
    .forEach(([key, val]) => {
      if (key === 'photo') {
        request = request.attach(key, val)
      } else {
        request = request.field(key, val)
      }
    })
  return request;
}
const makePositionResponse = (id) => {
  return {
    position: initialData.Positions.find(position => Number(position.id) === Number(id)).name,
    position_id: id
  }
}
const makeUserResponse = (users, count = 5, page = 1, offset = 0) => {
  const startIndex = offset + ((page - 1) * count);
  const endIndex = startIndex + count;
  return users.map((user, k) => {
    const id = k + 1;
    return {
      id: id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      registration_timestamp: expect.anything(),
      photo: `${process.env.APP_API_URL}/user/${id}/photo`,
      ...makePositionResponse(user.position)
    }
  }).reverse().slice(startIndex, endIndex);
}
const makeLinkResponse = (page, count, offset, total_pages) => {
  let next_url = null, prev_url = null;
  if (total_pages > page) {
    const params = (new URLSearchParams({
      page: page + 1,
      count, offset
    })).toString()
    next_url = `${process.env.APP_API_URL}/users?` + params
  }
  if (page > 1) {
    const params = (new URLSearchParams({
      page: page - 1,
      count, offset
    })).toString()
    prev_url = `${process.env.APP_API_URL}/users?` + params
  }
  return {
    "links": {
      next_url,
      prev_url
    }
  }
}
const expectResponse = (props) => {
  const {
    page = 1,
    total_pages = 2,
    count = 5,
    offset = 0,
    reqCount = 5
  } = props;
  return {
    "success": true,
    page,
    total_pages,
    "total_users": initialData.Users.length - offset,
    count,
    "users": makeUserResponse(initialData.Users, reqCount, page, offset),
    ...makeLinkResponse(page, reqCount, offset, total_pages)
  }
}
const expectUserResponse = (userId) => {
  const user = initialData.Users.find(u => u.id === userId);
  return {
    "success": true,
    "user": {
      "id": userId,
      "name": user.name,
      "email": user.email,
      "phone": user.phone,
      "photo": `${process.env.APP_API_URL}/user/${userId}/photo`,
      ...makePositionResponse(user.position)
    }
  }
}
const expectUserRegistrationResponse = () => {
  return {
    "success": true,
    "user_id": expect.any(Number),
    "message": "New user successfully registered"
  }
}
const expectErrorResponse = (props) => {
  const {
    message,
    ...rest
  } = props;

  return {
    "success": false,
    message,
    ...rest
  }
}
const expectPositionsResponse = () => {
  return {
    "success": true,
    "positions": initialData.Positions
  }
}
const expectTokenResponse = () => {
  return {
    "success": true,
    "token": expect.stringMatching(/^[a-zA-Z0-9-_]+$/)
  }
}

module.exports = {
  expectResponse,
  expectUserResponse,
  expectUserRegistrationResponse,
  expectErrorResponse,
  expectPositionsResponse,
  expectTokenResponse,
  setField,
  wait
}
