// This benchmark script tests 4 implementations of encoding MQTT Publish packets
// The result is shown as Markdown table.

const mqttPacket = require('../')
const mqttPubPacket = require('./raw/pubPacket.js')
const mqttPubPacketBuf = require('./raw/pubPacketBuffer.js')
const mqttPubPacketInto = require('./raw/pubPacketInto.js')
const mqttOpifex = require('@seriousme/opifex/mqttPacket')
const max = 1000000
const PUBLISH = 3

const buf = Buffer.from('test')

function testMQTT (mqtt) {
  let i
  // initialize it
  mqtt.generate({
    cmd: 'publish',
    topic: 'test',
    payload: buf
  })

  const start = Date.now()

  for (i = 0; i < max; i++) {
    mqtt.generate({
      cmd: 'publish',
      topic: 'test',
      payload: buf
    })
  }

  const time = Date.now() - start
  return { time, packetsPerSecond: Math.floor(max / time * 1000) }
}

function testOpifex (mqtt) {
  let i
  // initialize it
  mqtt.encode({
    type: PUBLISH,
    topic: 'test',
    payload: buf
  })

  const start = Date.now()

  for (i = 0; i < max; i++) {
    mqtt.encode({
      type: PUBLISH,
      topic: 'test',
      payload: buf
    })
  }
  const time = Date.now() - start
  return { time, packetsPerSecond: Math.floor(max / time * 1000) }
}

console.log(
  'Round | mqtt time | mqtt packets/s | opifex time | opifex packets/s | pubPacket time | pubPacket packets/s | pubPacketInto time | pubPacketInto packets/s | pubPacketBuf time | pubPacketBuf packets/s '
)
console.log('-- | -- | -- | -- | -- | -- | -- | -- | -- | -- | --')
for (let j = 0; j < 10; j++) {
  const mqttResult = testMQTT(mqttPacket)
  const opifexResult = testOpifex(mqttOpifex)
  const pubPacketResult = testMQTT(mqttPubPacket)
  const pubPacketIntoResult = testMQTT(mqttPubPacketInto)
  const pubPacketBufResult = testMQTT(mqttPubPacketBuf)
  console.log(
    `${
      j + 1
    } | ${mqttResult.time} | ${mqttResult.packetsPerSecond} | ${
        opifexResult.time} | ${opifexResult.packetsPerSecond} | ${
        pubPacketResult.time} | ${pubPacketResult.packetsPerSecond} | ${
        pubPacketIntoResult.time} | ${pubPacketIntoResult.packetsPerSecond} | ${
        pubPacketBufResult.time} | ${pubPacketBufResult.packetsPerSecond}`
  )
}
