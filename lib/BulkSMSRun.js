'use strict';

const _ = require('lodash');
const PhoneNumber = require('awesome-phonenumber');
const rp = require('request-promise-native');
rp.debug = true;

const getUidInt32 = require('get-uid'); // For 32-bit integer id
const uid = require('uid'); // For string message uid;

class BulkSMSMsg {
  constructor(msgRun, to, body, options) {
    this.userSuppliedId = uid(12);

    this.to = new PhoneNumber(to, msgRun.getDefaultRegion());
    this.body = body;

    this.options = _.defaults({}, options);
  }

  get id() {
    return this.userSuppliedId;
  }

  bulksms(msgRun) {
    if (this.to.isValid()) {
      return _.extend(msgRun._getMsgBase(), {
        to: this.to.getNumber('e164'),
        body: this.body,
        userSuppliedId: this.id
      });
    }
  }
}

class BulkSMSRun {
  constructor(bulksms, options) {
    this.bulksms = bulksms;

    this._msgBase = _.defaults({}, options.msg, bulksms.getMsgBase());

    let paramKeys = ['deduplication-id', 'auto-unicode', 'schedule-date', 'schedule-description'];
    this._runParams = _.defaults({}, _.pick(options, paramKeys), {
      'deduplication-id': getUidInt32()
    });

    this._msgs = {};
  }

  addMsg(to, body, options) {
    let msg = new BulkSMSMsg(this, to, body, options);
    this._msgs[msg.id] = msg;
    return msg;
  }

  async send() {
    let opts = this._fillRequestOptions('POST', '/messages', {});
    opts.body = this._getMsgArray();

    let reply = await rp(opts);
    return reply;
  }

  getDefaultRegion() {
    return 'GB';
  }

  getMsgCount() {
    return _.size(this._msgs);
  }

  _getMsgBase() {
    return this._msgBase;
  }

  _fillRequestOptions(method, path, opts) {
    return _.assign(opts || {}, {
      method: method,
      uri: this.bulksms.getRestURL(path),
      qs: this._runParams,
      auth: this.bulksms.getAuthCredentials(),
      json: true,
      resolveWithFullResponse: true
    });
  }

  _getMsgArray(msgArr) {
    msgArr = msgArr || [];
    _.each(this._msgs, msg => {
      msgArr.push(msg.bulksms(this));
    });
    return msgArr;
  }
}

module.exports = BulkSMSRun;
