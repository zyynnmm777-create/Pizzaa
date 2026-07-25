    // حماية صفحة الإدارة بكلمة مرور مؤقتة (سيتم استبدالها لاحقاً بـ Netlify Identity)
    let password = prompt("الرجاء إدخال كلمة مرور الإدارة:");
    if (password !== "12345") { 
        alert("كلمة المرور غير صحيحة!");
        document.body.innerHTML = "<h2 style='text-align:center; color:red; margin-top:50px;'>غير مسموح بالدخول ⛔</h2>";
        throw new Error("Unauthorized");
    }

    function fetchOrders() {
      let container = document.getElementById("adminOrdersList");
      container.innerHTML = '<div class="loading">جاري تحديث الطلبات...</div>';

      // الاتصال بدالة السيرفر الآمنة بدلاً من كشف المفتاح
      fetch('/.netlify/functions/get-orders')
      .then(response => {
        if (!response.ok) throw new Error("فشل في جلب البيانات.");
        return response.json();
      })
      .then(data => {
        let orders = [];
        if (data && data.record) {
          if (Array.isArray(data.record)) {
            orders = data.record;
          } else if (Array.isArray(data.record.orders)) {
            orders = data.record.orders;
          }
        }
        renderAdminOrders(orders);
      })
      .catch(error => {
        console.error(error);
        container.innerHTML = '<div class="loading" style="color:#ff4d4d;">حدث خطأ أثناء جلب الطلبات. يرجى المحاولة لاحقاً.</div>';
      });
    }

    function renderAdminOrders(orders) {
      let container = document.getElementById("adminOrdersList");
      if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="loading">لا توجد طلبات واردة حتى الآن.</div>';
        return;
      }

      container.innerHTML = orders.map((o) => {
        let itemsHtml = (o.items || []).map(item => `
          <div class="item-row">
            <span>${item.name} ${item.selectedSize ? '(' + item.selectedSize + ' - ' + item.selectedEdge + ')' : ''} × ${item.qty}</span>
            <span>${((Number(item.price)||0) * (Number(item.qty)||0)).toLocaleString('en-US')} ل.س</span>
          </div>
        `).join('');

        let displayId = o.id ? String(o.id) : Date.now().toString();
        let shortId = displayId.length >= 6 ? displayId.slice(-6) : displayId;

        return `
          <div class="order-card" id="order-${displayId}">
            <div class="order-header">
              <span class="order-id">طلب #${shortId}</span>
              <span class="order-date">📅 ${o.date || 'غير متوفر'}</span>
            </div>
            
            <div class="customer-info">
              <p><strong>👤 الزبون:</strong> ${o.customerName || 'غير متوفر'}</p>
              <p><strong>📞 الموبايل:</strong> <a href="tel:${o.customerPhone}" style="color:#ff4d4d; text-decoration:none;">${o.customerPhone || 'غير متوفر'}</a></p>
              <p><strong>📍 العنوان:</strong> ${o.customerLocation || 'غير متوفر'}</p>
            </div>

            <div class="items-list">
              <strong>🛒 تفاصيل الوجبات:</strong>
              ${itemsHtml}
            </div>

            <div class="order-footer">
              <div class="total-price">الإجمالي: ${(Number(o.total)||0).toLocaleString('en-US')} ل.س</div>
              <div>
                <label style="font-size:13px; color:#aaa; margin-left:5px;">الحالة:</label>
                <select class="status-select" onchange="updateOrderStatus('${displayId}', this.value)">
                  <option value="قيد المراجعة ⏳" ${o.status === 'قيد المراجعة ⏳' ? 'selected' : ''}>قيد المراجعة ⏳</option>
                  <option value="جاري التجهيز 🔥" ${o.status === 'جاري التجهيز 🔥' ? 'selected' : ''}>جاري التجهيز 🔥</option>
                  <option value="في طريق التوصيل 🛵" ${o.status === 'في طريق التوصيل 🛵' ? 'selected' : ''}>في طريق التوصيل 🛵</option>
                  <option value="تم التوصيل ✅" ${o.status === 'تم التوصيل ✅' ? 'selected' : ''}>تم التوصيل ✅</option>
                  <option value="ملغي ❌" ${o.status === 'ملغي ❌' ? 'selected' : ''}>ملغي ❌</option>
                </select>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    function updateOrderStatus(orderId, newStatus) {
      // إرسال الطلب للدالة الآمنة في السيرفر لتحديث القاعدة بعيداً عن المتصفح
      fetch('/.netlify/functions/update-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: orderId, newStatus: newStatus })
      })
      .then(response => {
        if (!response.ok) throw new Error("فشل تحديث الحالة.");
        return response.json();
      })
      .then(data => {
        alert("✅ تم تحديث حالة الطلب بنجاح!");
      })
      .catch(error => {
        console.error(error);
        alert("❌ حدث خطأ أثناء تحديث الحالة.");
      });
    }

    window.onload = function() {
      fetchOrders();
    };

