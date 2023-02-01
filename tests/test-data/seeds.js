const NodeEnvironment = require('jest-environment-node').TestEnvironment
const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const dynamodb = new AWS.DynamoDB.DocumentClient()
require('dotenv').config()

const restaurants = [
  {
    name: 'Test-Fangtasia',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/fangtasia.png',
    themes: ['true blood']
  },
  {
    name: "Test-Shoney's",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/shoney's.png",
    themes: ['cartoon', 'rick and morty']
  },
  {
    name: "Test-Freddy's BBQ Joint",
    image: "https://d2qt42rcwzspd6.cloudfront.net/manning/freddy's+bbq+joint.png",
    themes: ['netflix', 'house of cards']
  },
  {
    name: 'Test-Pizza Planet',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/pizza+planet.png',
    themes: ['netflix', 'toy story']
  },
  {
    name: 'Test -Leaky Cauldron',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/leaky+cauldron.png',
    themes: ['movie', 'harry potter']
  },
  {
    name: "Test - Lil' Bits",
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/lil+bits.png',
    themes: ['cartoon', 'rick and morty']
  },
  {
    name: 'Test - Fancy Eats',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/fancy+eats.png',
    themes: ['cartoon', 'rick and morty']
  },
  {
    name: 'Test -Don Cuco',
    image: 'https://d2qt42rcwzspd6.cloudfront.net/manning/don%20cuco.png',
    themes: ['cartoon', 'rick and morty']
  }
]

const putReqs = restaurants.map(x => ({
  PutRequest: {
    Item: x
  }
}))

const deleteReqs = restaurants.map(restaurant => ({
  DeleteRequest: {
    Key: {
      name: restaurant.name
    }
  }
}))

const req = (requestType) => ({
  RequestItems: {
    [process.env.restaurants_table]: requestType
  }
})

class SeedTestData extends NodeEnvironment {
  constructor (config, context) {
    super(config, context)
    this.testPath = context.testPath
    this.docblockPragmas = context.docblockPragmas
  }

  async setup () {
    if (process.env.seeded) {
      console.log('already seeded')
      return
    }
    const { UnprocessedItems = [] } = await dynamodb.batchWrite(req(putReqs)).promise().catch(error => {
      console.log('Error Writing to DynamoDB')
      console.error(error)
    })
    await super.setup()

    if (Object.keys(UnprocessedItems).length === 0) {
      console.log('Successfully Wrote Seed Data')
      process.env.seeded = true
    } else {
      console.log('Some Items were not written')
      console.log(UnprocessedItems)
      process.env.seeded = false
    }
  }

  async teardown () {
    const { UnprocessedItems = [] } = await dynamodb.batchWrite(req(deleteReqs)).promise().catch(error => {
      console.log('Error Deleting from DynamoDB')
      console.error(error)
    })
    await super.teardown()

    if (Object.keys(UnprocessedItems).length === 0) {
      console.log('Successfully Deleted Seed Data')
    } else {
      console.log('Some Items were not deleted')
      console.log(UnprocessedItems)
    }
  }

  getVmContext () {
    return super.getVmContext()
  }

  async handleTestEvent (event, state) {
    if (event.name === 'test_start') {
      // ...
    }
  }
}

module.exports = SeedTestData
