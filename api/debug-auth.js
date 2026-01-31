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
    rawLength: key.length,
    rawType: typeof key,
    parsingSteps: []
  };

  try {
    let cleanKey = key.trim();
    result.parsingSteps.push(`Trimmed length: ${cleanKey.length}`);
    
    // Step 1: Unwrap quotes
    if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) || 
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
      const type = cleanKey.startsWith("'") ? 'single' : 'double';
      result.parsingSteps.push(`Unwrapped ${type} quotes`);
      cleanKey = cleanKey.slice(1, -1).trim();
    }

    // Step 2: JSON Parse (recursive)
    let credentials;
    try {
      credentials = JSON.parse(cleanKey);
      result.parsingSteps.push('First JSON.parse successful');
      if (typeof credentials === 'string') {
        result.parsingSteps.push('Result was a string, parsing again...');
        credentials = JSON.parse(credentials);
        result.parsingSteps.push('Second JSON.parse successful');
      }
    } catch (e) {
      result.parsingSteps.push(`JSON Parse Error: ${e.message}`);
      throw e;
    }

    result.hasPrivateKey = !!credentials.private_key;
    result.hasClientEmail = !!credentials.client_email;
    result.clientEmail = credentials.client_email;
    result.projectId = credentials.project_id;
    
    if (credentials.private_key) {
      const pk = credentials.private_key;
      result.pkLength = pk.length;
      result.pkContainsLiteralSlashN = pk.includes('\\n');
      result.pkContainsActualNewlines = pk.includes('\n');
      
      let fixedKey = pk.replace(/\\n/g, '\n').trim();
      
      // Secondary unwrap for the key itself
      if (fixedKey.startsWith('"') && fixedKey.endsWith('"')) {
        result.parsingSteps.push('Private key itself was wrapped in quotes, unwrapping...');
        fixedKey = fixedKey.slice(1, -1).replace(/\\n/g, '\n').trim();
      }
      
      result.fixedKeyLength = fixedKey.length;
      result.fixedKeyLineCount = fixedKey.split('\n').length;
      result.fixedKeyStartsWith = fixedKey.substring(0, 30) + '...';
      result.fixedKeyEndsWith = '...' + fixedKey.substring(fixedKey.length - 30);
      
      // Validation checks
      result.isValidPem = fixedKey.includes('-----BEGIN PRIVATE KEY-----') && 
                          fixedKey.includes('-----END PRIVATE KEY-----');
      
      if (!result.isValidPem) {
        result.warning = 'Private key does not contain standard PEM boundaries!';
      }
    }
  } catch (e) {
    result.error = e.message;
    result.stack = e.stack;
  }

  return res.status(200).json(result);
}
