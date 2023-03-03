var { Position, User, Photo, sequelize } = require("../models");
var axios = require("axios");
var initialData = require("../data/initialData.json")

async function init() {
  await sequelize.sync({
    force: true
  })
  await Position.bulkCreate(initialData.Positions);
  await initialData.Users.reduce(async function(promise, info) {
    await promise;
    const photo = await axios.get(info.url, {responseType: 'arraybuffer'}).then(res => {
      return res.data
    })
    const PhotoIns = await Photo.create({
      data: photo
    })
    return User.create({
      name: info.name,
      email: info.email,
      phone: info.phone,
      positionAsId: info.position,
      photoAsId: PhotoIns.id
    })
  }, Promise.resolve())
  sequelize.close();
};
init();

// vim: sw=2:ai
