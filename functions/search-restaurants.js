const { metricScope, Unit } = require('aws-embedded-metrics')
const axios = require('axios')

const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()

const defaultResults = process.env.defaultResults || 8
const tableName = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
  console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`)
  const req = {
    TableName: tableName,
    Limit: count,
    FilterExpression: 'contains(themes, :theme)',
    ExpressionAttributeValues: { ':theme': theme }
  }

  const resp = await dynamodb.scan(req).promise()
  console.log(`found ${resp.Items.length} restaurants`)
  return resp.Items
}

module.exports.handler = metricScope(metrics =>
  async (event, context) => {
    metrics.setNamespace(process.env.serviceName)
    metrics.putDimensions({ Service: 'Search-service' })

    const start = Date.now()
    const resp = await axios.get('https://emmanuelgenard.com')
    const end = Date.now()
    metrics.putMetric('latency', end - start, Unit.Milliseconds)
    metrics.putMetric('count', resp.data.length, Unit.Count)

    const req = JSON.parse(event.body)
    const theme = req.theme
    const restaurants = await findRestaurantsByTheme(theme, defaultResults)
    const response = {
      statusCode: 200,
      body: JSON.stringify(restaurants)
    }

    return response
  })
