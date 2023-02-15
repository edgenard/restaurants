const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()
const ssm = require('@middy/ssm')
const { serviceName, paramStore, restaurants_table: tableName } = process.env
const Log = require('@dazn/lambda-powertools-logger')
const wrap = require('@dazn/lambda-powertools-pattern-basic')

const getRestaurants = async (count, tableName) => {
  Log.debug(`fetching ${count} restaurants from ${tableName}...`)
  const req = {
    TableName: tableName,
    Limit: count
  }

  const resp = await dynamodb.scan(req).promise()
  Log.debug('restaurants found', { count: resp.Items.length })
  return resp.Items
}

module.exports.handler = wrap(async (event, context) => {
  const restaurants = await getRestaurants(
    context.config.defaultResults,
    tableName
  )
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  return response
}).use(
  ssm({
    cache: true,
    cacheExpiry: 1 * 60 * 1000, // 1 mins
    setToContext: true,
    fetchData: {
      config: `/${serviceName}/${paramStore}/get-restaurants/config`
    }
  })
)
