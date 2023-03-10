const EventBridge = require('aws-sdk/clients/eventbridge')
const SNS = require('aws-sdk/clients/sns')
const XRay = require('aws-xray-sdk-core')

const eventBridge = XRay.captureAWSClient(new EventBridge())
const sns = XRay.captureAWSClient(new SNS())

const Log = require('@dazn/lambda-powertools-logger')
const wrap = require('@dazn/lambda-powertools-pattern-basic')

const busName = process.env.bus_name
const topicArn = process.env.restaurant_notification_topic

module.exports.handler = wrap(async (event) => {
  const order = event.detail
  const snsReq = {
    Message: JSON.stringify(order),
    TopicArn: topicArn
  }
  await sns.publish(snsReq).promise()

  const { restaurantName, orderId } = order
  Log.debug('notified restaurant', { restaurantName, orderId })

  await eventBridge.putEvents({
    Entries: [{
      Source: 'big-mouth',
      DetailType: 'restaurant_notified',
      Detail: JSON.stringify(order),
      EventBusName: busName
    }]
  }).promise()

  Log.debug("published 'restaurant_notified' event to EventBridge")
})
