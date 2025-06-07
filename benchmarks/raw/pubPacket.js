// High speed implementation of the encoding of a Publish packet
// This version uses new Uint8Array() to allocate the buffer and TextEncoder for strings

const utf8Encoder = new TextEncoder()

const BitMask = {
  bit0: 2 ** 0,
  bit1: 2 ** 1,
  bit2: 2 ** 2,
  bit3: 2 ** 3,
  bit4: 2 ** 4,
  bit5: 2 ** 5,
  bit6: 2 ** 6,
  bit7: 2 ** 7
}

const PacketType = { publish: 3 }

class MQTT {
  // {
  //     cmd: 'publish',
  //     topic: 'test',
  //     payload: buf
  //   }

  generate (packet) {
    const packetType = PacketType[packet.cmd]
    if (packetType === undefined) {
      throw new Error(`Unknown packet type: ${packet.cmd}`)
    }
    const topic = utf8Encoder.encode(packet.topic)
    const topicLength = topic.length
    const payload = packet.payload
    const payloadLength = payload.length
    const messageId = packet.messageId || 0 // Default to 0 if not provided
    const qos = packet.qos || 0
    const flags = (packet.dup ? BitMask.bit3 : 0) +
      (qos & 2 ? BitMask.bit2 : 0) +
      (qos & 1 ? BitMask.bit1 : 0) +
      (packet.retain ? BitMask.bit0 : 0)
    const qosLength = qos > 0 ? 2 : 0 // QoS level requires 2 bytes if > 0
    const remainingLength = qosLength + 2 + topicLength + payloadLength // 2 bytes for topic length
    const result = new Uint8Array(remainingLength + 2) // Placeholder for the result buffer
    let offset = 0
    // Write the fixed header
    result[offset++] = (packetType << 4) | flags
    // Write the remaining length
    let remainingLengthEncoded = remainingLength
    do {
      let byte = remainingLengthEncoded % 128
      remainingLengthEncoded = Math.floor(remainingLengthEncoded / 128)
      if (remainingLengthEncoded > 0) {
        byte |= 128 // Set the continuation bit
      }
      result[offset++] = byte
    } while (remainingLengthEncoded > 0)
    // Write the messageId if applicable
    if (qosLength !== 0) {
      result[offset++] = (messageId >> 8) & 0xFF // MSB
      result[offset++] = messageId & 0xFF // LSB
    }
    // Write the topic length
    result[offset++] = (topicLength >> 8) & 0xFF // MSB
    result[offset++] = topicLength & 0xFF // LSB
    // Write the topic
    result.set(topic, offset)
    offset += topicLength
    // Write the payload
    result.set(payload, offset)
    offset += payloadLength
    // Return the result as a new Uint8Array with the correct length
    return result
  }
}

module.exports = new MQTT()
