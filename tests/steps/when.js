const APP_ROOT = '../../'
const _ = require('lodash')
const aws4 = require('aws4')
const URL = require('url')
const http = require('axios')
const mode = process.env.TEST_MODE
const EventBridge = require('aws-sdk/clients/eventbridge')

const viaEventBridge = async (busName, source, detailType, detail) => {
  console.log('adding messages to eventbridge')
  console.log(JSON.stringify(detail))
  const eventBridge = new EventBridge()
  await eventBridge.putEvents({
    Entries: [{
      Source: source,
      DetailType: detailType,
      Detail: JSON.stringify(detail),
      EventBusName: busName
    }]
  }).promise()
}

const viaHandler = async (event, functionName) => {
  const handler = require(`${APP_ROOT}/functions/${functionName}`).handler

  const context = { awsRequestId: 'test' }
  const response = await handler(event, context)
  const contentType = _.get(
    response,
    'headers.content-type',
    'application/json'
  )
  if (_.get(response, 'body') && contentType === 'application/json') {
    response.body = JSON.parse(response.body)
  }
  return response
}

const respondFrom = async (httpRes) => ({
  statusCode: httpRes.status,
  body: httpRes.data,
  headers: httpRes.headers
})

const signHttpRequest = (url) => {
  const urlData = new URL.URL(url)
  const opts = {
    host: urlData.hostname,
    path: urlData.pathname
  }

  aws4.sign(opts)
  return opts.headers
}

const viaHttp = async (relPath, method, opts) => {
  const url = `${process.env.rest_api_url}/${relPath}`
  console.info(`invoking via HTTP ${method} ${url}`)
  const data = _.get(opts, 'body')
  let headers = {}
  if (_.get(opts, 'iam_auth', false) === true) {
    headers = signHttpRequest(url)
  }

  const authHeader = _.get(opts, 'auth')
  if (authHeader) {
    headers.Authorization = authHeader
  }

  try {
    const httpReq = http.request({
      method,
      url,
      headers,
      data
    })

    const res = await httpReq
    return respondFrom(res)
  } catch (err) {
    if (err.status) {
      return {
        statusCode: err.status,
        headers: err.response.headers
      }
    } else {
      throw err
    }
  }
}
const weInvokeGetIndex = async () => {
  switch (mode) {
    case 'handler':
      return await viaHandler({}, 'get-index')
    case 'http':
      return await viaHttp('', 'GET')
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}
const weInvokeGetRestaurants = async () => {
  switch (mode) {
    case 'handler':
      return await viaHandler({}, 'get-restaurants')
    case 'http':
      return await viaHttp('restaurants', 'GET', { iam_auth: true })
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}
const weInvokeSearchRestaurants = async (theme, user) => {
  const body = JSON.stringify({ theme })
  const auth = user.idToken
  switch (mode) {
    case 'handler':
      return await viaHandler({ body }, 'search-restaurants')
    case 'http':
      return await viaHttp('restaurants/search', 'POST', { body, auth })
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}

const weInvokePlaceOrder = async (user, restaurantName) => {
  const body = JSON.stringify({ restaurantName })
  const auth = user.idToken
  switch (mode) {
    case 'handler':
      return await viaHandler({ body }, 'place-order')
    case 'http':
      return await viaHttp('orders', 'POST', { body, auth })
    default:
      throw new Error(`unsupported mode: ${mode}`)
  }
}

const weInvokeNotifyRestaurant = async (event) => {
  if (mode === 'handler') {
    await viaHandler(event, 'notify-restaurant')
  } else {
    const busName = process.env.bus_name
    await viaEventBridge(busName, event.source, event['detail-type'], event.detail)
  }
}

module.exports = {
  we_invoke_get_index: weInvokeGetIndex,
  we_invoke_get_restaurants: weInvokeGetRestaurants,
  we_invoke_search_restaurants: weInvokeSearchRestaurants,
  we_invoke_place_order: weInvokePlaceOrder,
  we_invoke_notify_restaurant: weInvokeNotifyRestaurant
}
