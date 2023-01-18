const AWS = require('aws-sdk')
const chance = require('chance').Chance()

// needs number, special char, upper and lower case

const randomPassword = () => `${chance.string({ length: 8 })}B!gM0uth`

const auAuthenticatedUser = async () => {
  const cognito = new AWS.CognitoIdentityServiceProvider()

  const userpoolId = process.env.cognito_user_pool_id
  const clientId = process.env.cognito_server_client_id

  const firstName = chance.first({ nationality: 'en' })
  const lastName = chance.last({ nationality: 'en' })
  const suffix = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })
  const username = `test-${firstName}-${lastName}-${suffix}`
  const password = randomPassword()
  const email = `${firstName}-${lastName}@big-mouth.com`

  const createReq = {
    UserPoolId: userpoolId,
    Username: username,
    MessageAction: 'SUPPRESS',
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
      { Name: 'email', Value: email }
    ]
  }
  await cognito.adminCreateUser(createReq).promise()

  console.log(`[${username}] - user is created`)

  const req = {
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    UserPoolId: userpoolId,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  }
  const resp = await cognito.adminInitiateAuth(req).promise()

  console.log(`[${username}] - initialised auth flow`)

  const challengeReq = {
    UserPoolId: userpoolId,
    ClientId: clientId,
    ChallengeName: resp.ChallengeName,
    Session: resp.Session,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: randomPassword()
    }
  }
  const challengeResp = await cognito.adminRespondToAuthChallenge(challengeReq).promise()

  console.log(`[${username}] - responded to auth challenge`)

  return {
    username,
    firstName,
    lastName,
    idToken: challengeResp.AuthenticationResult.IdToken
  }
}

/*
  returns { function-naame/config: value}
*/
const dynamicConfigurations = async () => {
  const ssm = new AWS.SSM({ region: 'us-east-1' })
  const parameterPath = `/${process.env.serviceName}/${process.env.stage}/`
  const params = await ssm.getParametersByPath({ Path: parameterPath, Recursive: true }).promise()

  return params.Parameters.reduce((acc, el) => {
    const key = el.Name.replace(parameterPath, '')
    let value
    try {
      value = JSON.parse(el.Value)
    } catch (error) {
      value = el.Value
    }
    acc[key] = value
    return acc
  }, {})
}

module.exports = {
  an_authenticated_user: auAuthenticatedUser,
  dynamicConfigurations
}
