const EventBridge = require('aws-sdk/clients/eventbridge')
const eventBridge = new EventBridge()
const chance = require('chance').Chance()
const Log = require('@dazn/lambda-powertools-logger')
const wrap = require('@dazn/lambda-powertools-pattern-basic')

const busName = process.env.bus_name

module.exports.handler = wrap(async (event) => {
  const restaurantName = JSON.parse(event.body).restaurantName

  const orderId = chance.guid()
  Log.debug('Placing Order', { orderId, restaurantName })
  await eventBridge.putEvents({
    Entries: [{
      Source: 'big-mouth',
      DetailType: 'order_placed',
      Detail: JSON.stringify({
        orderId,
        restaurantName
      }),
      EventBusName: busName
    }]
  }).promise()

  Log.debug("published 'order_placed' event into EventBridge")

  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  }

  return response
})
