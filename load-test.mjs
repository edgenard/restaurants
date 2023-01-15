

const sleep = milliseconds =>
new Promise(resolve =>
  setTimeout(() => {resolve(console.log("Sleeping...")) }, milliseconds)
  );

async function fetchResults() {
  const response = await fetch("https://zo5o8f92bh.execute-api.us-east-1.amazonaws.com/dev/restaurants/search", {
    "headers": {
      "content-type": "application/json",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "{\"theme\":\"netflix\"}",
    "method": "POST"
  })
  const body = await response.json()
  console.log(body);
}

for (let index = 0; index < 1000; index++) {

    await fetchResults()
    await sleep(0)
}

console.log("ALL DONE")
