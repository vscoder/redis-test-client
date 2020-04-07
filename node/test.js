// Example Redis client
"use strict";

var sprintf = require('sprintf-js').sprintf;
var util = require("util");
const Redis = require("ioredis");
const debug = require('debug')('redis_test');

const REDIS_MAX_DELAY = 5000;

const opts = {
  sentinels: [
    // This should be the FQDN of the `rfs-ldrs` Kubernetes Service
    // which should work as long as there is a Sentinel up and running
    {
      host: "rfs-ldrs",
      port: 26379
    },
  ],
  name: "mymaster",
  autoResubscribe: true,
  maxRetriesPerRequest: 1,  // only retry failed requests once
  enableOfflineQueue: true, // queue offline requests
  enableReadyCheck: true,
  retryStrategy: function(times) {
    return REDIS_MAX_DELAY;
  },
  reconnectOnError: function(err) {
    // only reconnect on error if the node you are connected to
    // has switched to READONLY mode
    return err.message.startsWith('READONLY')
  }
};

// make Redis connection
const redis = new Redis(opts)
.on('connect', () => {
  debug('Redis connect')
})
.on('ready', () => {
  debug('Redis ready')
})
.on('error', (e) => {
  debug('Redis ready', e)
})
.on('close', () => {
  debug('Redis close')
})
.on('reconnecting', () => {
  debug('Redis reconnecting')
})
.on('end', () => {
  debug('Redis end')
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function dumpStats(key, iterations, currentValue, previousValue) {
  util.log(sprintf("key: %-20s  total iterations: %-10d  current value: %-10d  delta: %-3d", key, iterations, currentValue, currentValue - previousValue))
}

function onExit() {
  redis.get(key).then(function(finalValue) {
    util.log('exitting...')
    dumpStats(key, iterations, finalValue, previousValue)
    redis.del(key)
    redis.quit()
    process.exit(0)
  })
}
process.on('SIGINT', onExit)
process.on('SIGTERM', onExit)

// Generate a random key to avoid collisions between multiple clients
var iterations = 0
var previousValue = 0
var key = sprintf("test-key-%05d", getRandomInt(1000))
dumpStats(key, iterations, 0, 0)

function dumpCounter() {
  redis.get(key, function(err, currentValue) {
    if (err != undefined) {
      console.log(err)
    } else {
      dumpStats(key, iterations, currentValue, previousValue)
      previousValue = currentValue
    }
  })
}
setInterval(dumpCounter, 1000); //time is in ms

function incCounter() {
  redis.incr(key, function(err, current) {
    if (err != undefined) {
      console.log(err)
    } else {
      iterations++
    }
  })
}
setInterval(incCounter, 25); //time is in ms
