// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'be6fo8iwc3'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-q81jf58r.us.auth0.com',
  clientId: 'j7BTQhbiEnwXH9rnXee1QeZt57F47zg7',
  callbackUrl: 'http://localhost:3000/callback'
}
