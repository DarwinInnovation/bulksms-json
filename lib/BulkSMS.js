'use strict';

const _ = require('lodash');
const BulkSMSRun = require('./BulkSMSRun');

class BulkSMS {
  constructor(options) {
    if (!_.isObject(options)) {
      throw new Error('No options provided to BulkSMS');
    }
    if (!_.has(options, 'token') && !_.has(options, 'login')) {
      throw new Error('No security credentials provided to BulkSMS');
    }

    this.options = _.defaults({}, options, {
      region: 'GB',
    });
  }

  createRun(options) {
    let runOptions = _.defaults(options, this.options.runDefaults || {});
    return new BulkSMSRun(this, runOptions);
  }

  send(to, body) {
    let run = new BulkSMSRun(this, {});
    run.addMsg(to, body);
    run.send();

    return run;
  }

  getRestURL(path) {
    return 'https://api.bulksms.com/v1' + path;
  }

  getAuthCredentials() {
    if (_.has(this.options, 'token')) {
      const tkn = this.options.token;
      return {
        user: tkn.id,
        password: tkn.secret,
        sendImmediately: true,
      };
    }
  }

  getMsgBase() {
    return {};
  }

  getDefaultRegion() {
    return this.options.region;
  }
}

module.exports = {
  BulkSMS: BulkSMS,
};
