const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // إذا كان الطلب يتضمن ID وحالة، فهذا يعني تحديث حالة الطلب
    if (body.id && body.status) {
      const { error } = await supabase
        .from('orders')
        .update({ status: body.status })
        .eq('id', body.id);

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'تم التحديث بنجاح' }) };
    } 
    
    // وإلا فهذا يعني إنشاء طلب جديد من المتجر
    else {
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
