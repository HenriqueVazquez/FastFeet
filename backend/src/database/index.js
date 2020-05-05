import Sequelize from 'sequelize';

import dataBaseConfig from '../config/database';

import User from '../app/models/User';
import Recipients from '../app/models/Recipients';

const models = [User, Recipients];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(dataBaseConfig);

    models.map(model => model.init(this.connection));
  }
}

export default new Database();
