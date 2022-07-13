// Import the packages we need
const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();

const CREDENTIALS = {
  project_id: 'livesloka-93a02',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGK4nWgAb6nGDG\nOatqpc0tVuFPCO/YHng3vYIMEDUtcuQeNTpXvgKcYrKuL2Jr4sOb3uKfnsy8s7jA\niHj+01UFzG3tL+Q4itRTw84k+FXE0AgjrTBv+8ghai/ql3JzdXO0D5R9UtOyoswe\nKvrPyTFMLyjuzvkb6zb8OHn5mxnYmmUt+IHsMf/Mb3TGmtT3gHqx1II0qNkQrEMn\njua9ICmDwi21XKM+hX4tOIsvBePlX6kuiXBwQ/KaUSikC5/zO+clJeuxchgJJNDD\n7nvqIobAE5mwkuZ4i6H9iNPzQi1L5i4ozO2BXFW4M/X5qfsd4/8PTPFHuPkJ3Vau\nUnQYx4BVAgMBAAECggEAIw5prF3qniPSxM5H4i5hfP9NDUe18iP1vVqTamHlnlwg\nOa3N2967pIGbPVAZl58+XlEQAw+7BTi/2qNp0B5/gG6ZFafutgftJsJRMd4SgiYR\nAoqtMmo2jZ60ykmvT/h7luNYr9DarVO6Sy3sP5zGUUVYduJ7U/KIwBaXkU3cRSI+\n66a7NFttazBk1eInXRfzy6nHcSzc+GJGUWpUytUcV1zJ/3EBZNi4xqyY4AoxcbLO\n6/u7/o7FSkQNMhgLcFAyoMyh3rjO+43t7Cy9XeN1n9nMifCPYDVrHS1zqSl3V4bm\n/KaEsIgR3Mdj1IMrphAaJTPgEvEJqwMb6AKUzdUAYQKBgQD3/1Ff3ohArvQOY1HK\nV8fUjAXpVWJEYmvR+Me4LSx9wXdQQvpGCnNgrXyxiHd4Y7b/dl9lZnXuXEk9PJUE\n8YL0Ozpo6icLfUZnk0O2qzJ6t+x5+yvzOW0Lr17pMipqw+C07+8D3owQI4z/UhMq\nwCnCe4xQmm2ZDv9eLewjDAHBEQKBgQDMkJoyUHedpfiOcsO7Ivzk0rDzXM0m/HVb\nB+wyWHxUGLzt5G8sxXDRwyPO3GDKCgFqj3Fa9IutMmXG8dSpBT3Nc+wuO3WKP1Y5\niUl1BYIJmJarkQgxM2vBGMqsN6ffqCIfrl9hCiurNp/RWbJ6cUZksTVgacoQbkqJ\nEMG3IkMLBQKBgQDZUtWltKYkQOzAmwq2zdvhB9+6TUey86jWtTOX04Z0oZCENl2J\n+WiIZR+rmBJR3tgj4EDS5EoeWqMX1bolPdtrWWfjPqZ+rAaBh4zETBwNbJX/gztN\nhppnrgP3SS3gp8yH4ubKtkB5eB38NJl1UjaGJqyciefXRExG5OlVARWccQKBgDf9\ntFblM3hQ/1FuFCjakMHI8WoLEpQDMdPyvTGiipUyGDQ8/DkS6ahgcyKhq1RhnLWg\nAXTVzo1faAAmHQEOUDY17oVQ/QEUCPPCofqHwWoC++qFzeo5mtrFgGPW7/oFuSFW\nxwB2mjFIyEGy/WkKLCxPXL7A9e+9YGVX0s3fcN5JAoGANxcJZ39E6QmSo8M87I2t\nCqAAiMqPWS8twmAfPPPr3igS+JP+pABg1vc/NcUMO820/CRuNpARgVzKjd+mSp8n\np8W49WXx+NSIgSItzPW9rrZsnW+7BPmGptKMhUp23U5U9N/fA0qcPrABc0cLl56X\nwPdNkqlZPLzhqO9a76EOnLA=\n-----END PRIVATE KEY-----\n',
  client_email: 'livesloka-93a02@appspot.gserviceaccount.com',
};


const PROJECID = CREDENTIALS.project_id;

const CONFIGURATION = {
  credentials: {
    private_key: CREDENTIALS['private_key'],
    client_email: CREDENTIALS['client_email'],
  },
};

const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);

const detectIntent = async (languageCode, queryText, sessionId) => {
  let sessionPath = sessionClient.projectAgentSessionPath(PROJECID, sessionId);
  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: queryText,
        languageCode: languageCode,
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;

  return {
    response: result.fulfillmentText,
    fallback: result.intent.displayName === 'Default Fallback Intent',
  };
};

module.exports = {
  detectIntent,
};
