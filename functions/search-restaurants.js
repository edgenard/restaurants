// const { metricScope, Unit } = require('aws-embedded-metrics')
// const axios = require('axios')
const middy = require('@middy/core')
const ssm = require('@middy/ssm')

const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()

const { serviceName, stage, paramStore } = process.env

const findRestaurantsByTheme = async (theme, count, tableName) => {
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

module.exports.handler = middy(
  async (event, context) => {
    const req = JSON.parse(event.body)
    const theme = req.theme
    const defaultResults = context.config.defaultResults
    const tableName = context.tableName

    const restaurants = await findRestaurantsByTheme(theme, defaultResults, tableName)
    const response = {
      statusCode: 200,
      body: JSON.stringify(restaurants)
    }

    console.log('Secret String', context.secretString)

    return response
  }
).use(ssm({
  cache: true,
  cacheExpiry: 1 * 60 * 1000, // 1 mins
  setToContext: true,
  fetchData: {
    config: `/${serviceName}/${paramStore}/search-restaurants/config`,
    tableName: `/${serviceName}/${stage}/restaurants_table`,
    secretString: `/${serviceName}/${paramStore}/search-restaurants/secretString`
  }
}))

// module.exports.handler = metricScope(metrics =>
//   async (event, context) => {
//     metrics.setNamespace(process.env.serviceName)
//     metrics.putDimensions({ Service: 'Search-service' })

//     const start = Date.now()
//     const resp = await axios.get('https://emmanuelgenard.com')
//     const end = Date.now()
//     metrics.putMetric('latency', end - start, Unit.Milliseconds)
//     metrics.putMetric('count', resp.data.length, Unit.Count)

//     const req = JSON.parse(event.body)
//     const theme = req.theme
//     const restaurants = await findRestaurantsByTheme(theme, defaultResults)
//     const response = {
//       statusCode: 200,
//       body: JSON.stringify(restaurants)
//     }

//     return response
//   })
