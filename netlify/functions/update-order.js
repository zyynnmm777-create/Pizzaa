const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    // دعم استقبال الأسماء بالطريقتين لمنع أي خطأ
    const id = body.id || body.orderId;
    const status = body.status || body.newStatus;

    if (id && status) {
      const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'تم التحديث بنجاح' }) };
    } 
    
    else {
      // إنشاء طلب جديد
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          customer_location: body.customer_location,
          items: body.items,
          total: body.total,
          status: 'جديد'
        }
      ]);

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'تم حفظ الطلب بنجاح' }) };
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
