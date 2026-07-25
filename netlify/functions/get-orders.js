exports.handler = async function(event, context) {
  // قراءة المتغيرات مباشرة
  const binId = process.env.JSONBIN_BIN_ID || process.env.JSON_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY || process.env.JSON_BIN_KEY;

  if (!binId || !apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing API credentials in environment variables" })
    };
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`JSONBin status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
