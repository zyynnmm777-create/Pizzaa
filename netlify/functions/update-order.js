const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const binId = process.env.JSON_BIN_ID;
  const apiKey = process.env.JSON_BIN_KEY;

  try {
    const { orderId, newStatus } = JSON.parse(event.body);

    // 1. جلب البيانات الحالية
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey,
        'X-Access-Key': apiKey
      }
    });

    if (!getRes.ok) throw new Error("فشل في جلب البيانات.");
    const data = await getRes.json();

    let orders = [];
    if (data && data.record) {
      if (Array.isArray(data.record)) {
        orders = data.record;
      } else if (Array.isArray(data.record.orders)) {
        orders = data.record.orders;
      }
    }

    // 2. تحديث الحالة للطلب المطلوب
    let targetOrder = orders.find(o => String(o.id) === String(orderId));
    if (targetOrder) {
      targetOrder.status = newStatus;
    }

    let payload = Array.isArray(data.record) ? orders : { orders: orders };

    // 3. رفع البيانات المحدثة لقاعدة البيانات
    const putRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Access-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!putRes.ok) throw new Error("فشل تحديث الحالة.");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "تم التحديث بنجاح" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
