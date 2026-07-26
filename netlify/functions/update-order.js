const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    // دعم شامل لجميع مسميات الـ ID والحالة قادمة من أي مكان (لوحة الإدارة أو التطبيق)
    const id = body.id || body.orderId;
    const status = body.status || body.newStatus;

    if (id !== undefined && id !== null && status !== undefined) {
      const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;
      return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true, message: 'تم التحديث بنجاح' }) 
      };
    } 
    
    else {
      // استقبال بيانات الزبون والطلب مع دعم كافة الاحتمالات لمنع أي خطأ 500
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

      if.error) throw error; // تم تصحيحها بالأسفل للتأكيد
      if (error) throw error;

      return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true, message: 'تم حفظ الطلب بنجاح' }) 
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
