const { query } = require('./lib/db');

(async function(){
  try {
    const v = await query('SELECT COUNT(*) as c FROM vehicles');
    console.log('vehicles:', v.rows[0] ? v.rows[0].c : v.rowCount || 0);
    const d = await query('SELECT COUNT(*) as c FROM drivers');
    console.log('drivers:', d.rows[0] ? d.rows[0].c : d.rowCount || 0);
    const u = await query('SELECT COUNT(*) as c FROM users');
    console.log('users:', u.rows[0] ? u.rows[0].c : u.rowCount || 0);
    process.exit(0);
  } catch (e) {
    console.error('DB test failed:', e && e.message);
    process.exit(1);
  }
})();
