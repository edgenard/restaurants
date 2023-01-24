const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()
const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const validator = require('@middy/validator')
// const transpileSchema = require('@middy/validator/transpile')

const { serviceName, stage } = process.env
// const tableName = process.env.restaurants_table

const getRestaurants = async (count, tableName) => {
  console.log(`fetching ${count} restaurants from ${tableName}...`)
  const req = {
    TableName: tableName,
    Limit: count
  }

  const resp = await dynamodb.scan(req).promise()
  console.log(`found ${resp.Items.length} restaurants`)
  return resp.Items
}

const responseSchema = {
  type: 'object',
  required: ['body', 'statusCode'],
  properties: {
    body: {
      type: 'string'
    },
    statusCode: {
      type: 'number'
    }
  }
}

module.exports.handler = middy(async (event, context) => {
  const restaurants = await getRestaurants(
    context.config.defaultResults,
    context.tableName
  )
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants),
    header: {
      'content-type': 'application/json'
    }
  }

  return response
}).use(ssm({
  cache: true,
  cacheExpiry: 1 * 60 * 1000, // 1 mins
  setToContext: true,
  fetchData: {
    config: `/${serviceName}/${stage}/get-restaurants/config`,
    tableName: `/${serviceName}/${stage}/restaurants_table`
  }
})).use(validator({ responseSchema }))
