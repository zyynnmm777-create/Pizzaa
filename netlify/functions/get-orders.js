const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const binId = process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY;


  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey,
        'X-Access-Key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error("فشل في جلب البيانات من قاعدة البيانات.");
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

