const axios = require('axios');

(async () => {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@workix.com',
      password: 'Admin@123'
    });
    const token = loginRes.data.data.token;

    console.log('📍 Fetching site...');
    const siteRes = await axios.get('http://localhost:5000/api/sites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const siteId = siteRes.data.data.sites[0].id;

    console.log('📝 Creating work order...');
    const woRes = await axios.post('http://localhost:5000/api/work-orders', {
      title: 'Test Work Order - Fixed Controller',
      description: 'Testing work order creation after removing project_id',
      priority: 'medium',
      site_id: siteId,
      building_id: 4,
      floor_id: 10,
      space_id: 16
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const wo = woRes.data.data.workOrder;
    console.log('\n✅ Work order created successfully!');
    console.log(`   Number: ${wo.work_order_number}`);
    console.log(`   Building ID: ${wo.building_id}`);
    console.log(`   Floor ID: ${wo.floor_id}`);
    console.log(`   Space ID: ${wo.space_id}`);
    console.log(`   Status: ${wo.status}`);
  } catch (e) {
    console.error('\n❌ Error:', e.response?.data || e.message);
    process.exit(1);
  }
})();
