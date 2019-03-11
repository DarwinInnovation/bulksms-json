'use strict';
const EventEmitter = require('events').EventEmitter;

const _ = require('lodash');
const rp = require('request-promise-native');

const getUidInt32 = require('get-uid'); // For 32-bit integer id
const BulkSMSMsg = require('./BulkSMSMsg');

const runParameters = {
  id: 'deduplication-id',
  autoUnicode: 'auto-unicode',
  scheduleDate: 'schedule-date',
  desc: 'schedule-description',
};

class BulkSMSRun extends EventEmitter {
  constructor(bulksms, options) {
    super();

    this.bulksms = bulksms;

    this._msgBase = _.defaults({}, options.msg, bulksms.getMsgBase());

    this._runParams = _.defaults(
      {},
      _.pick(options, Object.keys(runParameters)),
      {
        id: getUidInt32(),
      }
    );

    if (_.has(this._runParams, 'schedule-date')) {
      let scheduleDate = this._runParams['schedule-date'];
      if (!_.isString(scheduleDate)) {
        this._runParams['schedule-date'] = scheduleDate.toISOString();
      }
    }

    this._region = options.region || bulksms.getDefaultRegion();

    this._msgsBySuppliedId = {};
  }

  addMsg(to, body, options) {
    let msg = new BulkSMSMsg(this, to, body, options);
    this._msgsBySuppliedId[msg.id] = msg;
    return msg;
  }

  async send() {
    let opts = this._fillRequestOptions('POST', '/messages', {});
    opts.body = this._getMsgArray();

    let reply = await rp(opts);

    const result = {
      success: false,
      messages: [],
    };

    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      result.success = true;
      result.messages = reply.body;
    }

    return result;
  }

  getRegion() {
    return this._region;
  }

  getMsgCount() {
    return _.size(this._msgsBySuppliedId);
  }

  _getMsgBase() {
    return this._msgBase;
  }

  _fillRequestOptions(method, path, opts) {
    return _.assign(opts || {}, {
      method: method,
      uri: this.bulksms.getRestURL(path),
      qs: this._convertRunParams(),
      auth: this.bulksms.getAuthCredentials(),
      json: true,
      resolveWithFullResponse: true,
    });
  }

  _getMsgArray(msgArr) {
    msgArr = msgArr || [];
    _.each(this._msgsBySuppliedId, msg => {
      msgArr.push(msg.bulksms(this));
    });
    return msgArr;
  }

  _convertRunParams() {
    const runParams = {};
    _.each(this._runParams, (val, key) => {
      if (_.has(runParameters, key)) {
        key = runParameters[key];
      }

      runParams[key] = val.toString();
    });
    console.log(runParams);
    return runParams;
  }
}

module.exports = BulkSMSRun;
