const EMBEDDED_KEY = {
  type: "service_account",
  project_id: "key-partition-484615-n5",
  private_key_id: "3411b9e54bd051fcfbfd9e1ffa01962f9c42f08a",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCzi5o/FOrq8gCN\ne8vQVx7WjfIvk9lSkdRdWne7Fb9ymYc1XpDYx69IbZvzyIPFEEDQJiewosZfZ8Jo\nszj7LgiJ/dZxTSL8PRWfVAiq55lfvWm6O1YOlqm59t3seWAQ+jjhuYSnukoCKINC\n4VzfB5I2GT2mRtjp/uFsQ9LaqzXnUM4pfvOFrMFb3GgWpNMq+cnbGvG33Ab8doZN\nc61e/Bw1VID37LzrtizkK/BzdE/IbgV0WaX+UBVfphcLaH8szfx0dZgs3KMO4wCY\nIuqeNaw9rWsTW1c09VipjtrsTJOp6WTRVdwWX9s4mA5+RaOBt6cfmTDeJ3S6YkfG\nBGvDGxs7AgMBAAECggEAFBBAGteADuQfKrBQTMZHhGtVSnrHmMICDLKM2aOrAqfk\nY5LfNdJOpJXXDQ11qCJSU9BHtCXkbAngwCly7yKsQptSiNO5Wp2K2oSd+VcrHPdC\nJtT1n2i3q7fKAeBoW01S6Op9x+550bbsQB+F7MhgTtpQONIG8FMSprIHkHb8bY46\novlu7J77RWsu0dp+zNkJ61YGW7Si/b9Gy3EKyDGky0qjBVgbQvGJwHct1LHczlS6\nklErC0qFiKdvOmA2GgAqQvb+rYCJTDQ3JYak+3znlw0OLlfO//UKke/dcs1pxf7D\ngmNpa11YZb83wuELpCdhTQjiyG9Heh4aujq7/XdcaQKBgQDdUVjuGG4ml3WvrnXL\n+k/BjzoBRoNONrQ9LeA6hSwhcKAy5cx1a0GQMu3lUOI+G09wXPOYNeq8Tla1RChZ\nqfrh7EHF932kFScGstHxPMQV1N4nM+qZudbNipPpkl2DgvXaGdBHAxVmHwyQJ7u8\nKrKmG0rv3WjDP1BVHskMldmPmQKBgQDPrnYJ+BfKK8SELnXcaNOaaq1EfH9pQHHr\noEEsBZRzMaWhSL2GZz3mL+hfoMW3acaMmHKbnjge+23DRvJjRVPoPkvrFGrnzw12\ntw80Rt0XhVQf6BweBR+/m7AbJxzaTkINhEvt3w6w5/2kVO/96h0OJVCnn1aCl0bX\ndpwI6npV8wKBgFDtGfOWA1EhOOtQg8pecSN519/3hLPo1Oc6Cy/a2lQv9qQl2ylk\nWsj7lnmvpcrH+bhAhOI3dOn+Sz5k+cwvl4lc9oAJC2wgP/D3GkV3zsuc1s7G8RXd\nGmp2LbfOyVr5XCSwI7STsBNzbwiXPtKDWmfauwASmegrEpjNdP6hHLihAoGAX3a1\nYZ296bu2qH/mw3sYEXoJzVphAtORyhqu+npSI6Vlmj6ih957MI1DBnoTiFzB3KzS\nub+/0lYGvWWmU4VxrWa9ZQDMp2Ogr7oz7fbI+F/cLJJ4IkB+uIfrKoAPHjYs3KO8\nd0o6KY1qJRi5/ICZ/H+glHyEuqCo+q/Vx69orosCgYAsnnNqM57eHST4ULr3BkgX\n7hBSXBIuM9QHk9yrNkCERtDKgCpfo5AtICg8HceP0jotvnJQk+B+e5jfj0WKQynZ\nVDL+FxmI11rvUmbgCxjh4OnHYsj3kEpXpwYzv66/zfkxgQFurOXw4DBZkQZKtf8+\nj4HIKmv/jW6OzOjxnLgCNA==\n-----END PRIVATE KEY-----\n",
  client_email: "lasa-dashboard@key-partition-484615-n5.iam.gserviceaccount.com",
  client_id: "105758562505044899402",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/lasa-dashboard%40key-partition-484615-n5.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

export function getGoogleCredentialsHelper() {
  let credentials;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } catch (e) {}
  }

  if (!credentials && key) {
    try {
      let cleanKey = key.trim();
      if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }
      credentials = JSON.parse(cleanKey);
      if (typeof credentials === 'string') {
        credentials = JSON.parse(credentials);
      }
    } catch (e) {}
  }

  if (!credentials) {
    credentials = EMBEDDED_KEY;
  }

  if (credentials && credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n').trim();
    if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
      credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
    }
  }

  return credentials;
}
