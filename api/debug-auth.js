export default async function handler(req, res) {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!key) {
    return res.status(200).json({
      status: 'error',
      message: 'GOOGLE_SERVICE_ACCOUNT_KEY is not set'
    });
  }

  const result = {
    status: 'ok',
    length: key.length,
    startsWith: key.substring(0, 10),
    endsWith: key.substring(key.length - 10),
    type: typeof key,
    parsing: {}
  };

  try {
    let cleanKey = key.trim();
    if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
      result.parsing.wrappedInSingleQuotes = true;
      cleanKey = cleanKey.slice(1, -1);
    }
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      result.parsing.wrappedInDoubleQuotes = true;
      cleanKey = cleanKey.slice(1, -1);
    }

    const credentials = JSON.parse(cleanKey);
    result.parsing.jsonValid = true;
    result.parsing.hasPrivateKey = !!credentials.private_key;
    result.parsing.hasClientEmail = !!credentials.client_email;
    result.parsing.clientEmail = credentials.client_email;
    
    if (credentials.private_key) {
      result.parsing.privateKeyLength = credentials.private_key.length;
      result.parsing.privateKeyStartsWith = credentials.private_key.substring(0, 30);
      result.parsing.privateKeyEndsWith = credentials.private_key.substring(credentials.private_key.length - 30);
      result.parsing.containsLiteralSlashN = credentials.private_key.includes('\\n');
      result.parsing.containsActualNewlines = credentials.private_key.includes('\n');
      
      const fixedKey = credentials.private_key.replace(/\\n/g, '\n');
      result.parsing.fixedKeyContainsActualNewlines = fixedKey.includes('\n');
      result.parsing.fixedKeyLineCount = fixedKey.split('\n').length;
    }
  } catch (e) {
    result.parsing.jsonValid = false;
    result.parsing.error = e.message;
  }

  return res.status(200).json(result);
}
