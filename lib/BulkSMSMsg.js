'use strict';
const EventEmitter = require('events').EventEmitter;

const uid = require('uid'); // For string message uid;
const PhoneNumber = require('awesome-phonenumber');
const _ = require('lodash');

class BulkSMSMsg extends EventEmitter {
  constructor(msgRun, to, body, options) {
    super();

    this.userSuppliedId = uid(12);

    this.to = new PhoneNumber(to, msgRun.getRegion());
    this.body = body;

    this.options = _.defaults({}, options);
  }

  get id() {
    return this.userSuppliedId;
  }

  bulksms(msgRun) {
    let phoneNumber;
    if (this.options.testRecipient) {
      phoneNumber = '1111111';
    } else if (this.to.isValid()) {
      phoneNumber = this.to.getNumber('e164');
    } else {
      throw new Error('Invalid number');
    }
    return _.extend(msgRun._getMsgBase(), {
      to: phoneNumber,
      body: this.body,
      userSuppliedId: this.id,
    });
  }

  monitor(msgRun) {
    this._monitor = msgRun.getMonitorTimer();
    this._monitor.start(() => {});
  }

  stop() {}
}

module.exports = BulkSMSMsg;
