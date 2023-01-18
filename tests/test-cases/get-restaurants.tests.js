const { init } = require('../steps/init')
const when = require('../steps/when')
const given = require('../steps/given')

describe('When we invoke the GET /restaurants endpoint', () => {
  let config
  beforeAll(async () => {
    await init()
    config = await given.dynamicConfigurations()
  })

  it('Should return an array of 8 restaurants', async () => {
    const res = await when.we_invoke_get_restaurants()
    const defaultResultsCount = config['get-restaurants/config'].defaultResults
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveLength(defaultResultsCount)

    for (const restaurant of res.body) {
      expect(restaurant).toHaveProperty('name')
      expect(restaurant).toHaveProperty('image')
    }
  })
})
