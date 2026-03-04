const fs = require('fs');
const path = require('path');
const { dataDir } = require('./storage');

const queueFile = path.join(dataDir, 'queue.json');

function readQueue() {
  try {
    if (!fs.existsSync(queueFile)) fs.writeFileSync(queueFile, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeQueue(q) {
  fs.writeFileSync(queueFile, JSON.stringify(q, null, 2));
}

function enqueue(job) {
  const q = readQueue();
  q.push(job);
  writeQueue(q);
}

function dequeue() {
  const q = readQueue();
  const job = q.shift();
  writeQueue(q);
  return job;
}

function peek() {
  const q = readQueue();
  return q[0];
}

module.exports = { enqueue, dequeue, peek, readQueue };
