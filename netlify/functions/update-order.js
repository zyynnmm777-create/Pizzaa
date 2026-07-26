const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    // دعم استقبال معرف الطلب والحالة بأكثر من مسمى لمنع الأخطاء
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
      // دعم استقبال أسماء حقول الزبون بالطريقتين (CamelCase أو snake_case)
      const cName = body.customer_name || body.customerName;
      const cPhone = body.customer_phone || body.customerPhone;
      const cLocation = body.customer_location || body.customerLocation;

      const { error } = await supabase.from('orders').insert([
        {
          customer_name: cName,
          customer_phone: cPhone,
          customer_location: cLocation,
          items: body.items,
          total: body.total,
          status: 'قيد المراجعة ⏳'
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
