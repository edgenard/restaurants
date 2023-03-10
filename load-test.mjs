import given from './tests/steps/given.js'
const sleep = milliseconds =>
  new Promise(resolve =>
    setTimeout(() => { resolve(console.log('Sleeping...')) }, milliseconds)
  )

const searchTerm = process.argv.slice(2)[0] || 'cartoon'
const timeOut = parseInt(process.argv.slice(2)[1]) || 10
const user = await given.an_authenticated_user()
async function fetchResults (searchTerm) {
  const response = await fetch('https://zo5o8f92bh.execute-api.us-east-1.amazonaws.com/dev/restaurants/search', {
    headers: {
      'content-type': 'application/json',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      Authorization: user.idToken
    },
    body: `{"theme": "${searchTerm}"}`,
    method: 'POST'
  })
  const body = await response.json()
  console.log(body)
}

for (let index = 0; index < 10; index++) {
  await fetchResults(searchTerm)
  // fetchResults(searchTerm)
  // await sleep(timeOut)
}

console.log('ALL DONE')
