const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

async function reseedProjects() {
  const client = await pool.connect();
  
  try {
    console.log('\n🗑️  Deleting old projects...\n');
    
    // Delete all projects
    const deleteResult = await client.query('DELETE FROM projects RETURNING id');
    console.log(`   Deleted ${deleteResult.rowCount} old projects\n`);
    
    // Get enterprises
    const enterprises = await client.query('SELECT id, name FROM enterprises ORDER BY name');
    
    if (enterprises.rows.length === 0) {
      console.error('❌ No enterprises found! Please seed enterprises first.');
      return;
    }
    
    console.log(`📊 Found ${enterprises.rows.length} enterprises\n`);
    
    // Get a manager user
    const manager = await client.query("SELECT id FROM users WHERE role = 'manager' LIMIT 1");
    const managerId = manager.rows[0]?.id;
    
    // Create new projects for each enterprise
    const projects = [
      {
        name: 'HVAC System Modernization',
        description: 'Upgrade and modernize all HVAC systems across facilities',
        status: 'active',
        contract_number: 'CNT-2024-001',
        contract_value: 250000,
      },
      {
        name: 'Energy Efficiency Initiative',
        description: 'Implement energy-saving solutions and monitoring systems',
        status: 'active',
        contract_number: 'CNT-2024-002',
        contract_value: 180000,
      },
      {
        name: 'Preventive Maintenance Program',
        description: 'Establish comprehensive PPM schedules for all assets',
        status: 'planning',
        contract_number: 'CNT-2024-003',
        contract_value: 120000,
      },
    ];
    
    console.log('🔨 Creating new projects...\n');
    
    let created = 0;
    for (const enterprise of enterprises.rows) {
      // Create 1-2 projects per enterprise
      const numProjects = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numProjects && i < projects.length; i++) {
        const project = projects[i];
        
        const result = await client.query(
          `INSERT INTO projects (
            name, 
            description, 
            enterprise_id, 
            status, 
            contract_number, 
            contract_value,
            contract_start_date,
            contract_end_date,
            project_manager_id,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, name`,
          [
            project.name,
            project.description,
            enterprise.id,
            project.status,
            `${project.contract_number}-${enterprise.name.substring(0, 3).toUpperCase()}`,
            project.contract_value,
            new Date('2024-01-01'),
            new Date('2024-12-31'),
            managerId,
            managerId,
          ]
        );
        
        console.log(`   ✅ ${enterprise.name}: "${result.rows[0].name}"`);
        created++;
      }
    }
    
    console.log(`\n✅ Created ${created} new projects!\n`);
    
    // Verification
    const verification = await client.query(`
      SELECT p.name, e.name as enterprise_name
      FROM projects p
      LEFT JOIN enterprises e ON p.enterprise_id = e.id
      ORDER BY e.name, p.name
    `);
    
    console.log('📋 Final project list:');
    verification.rows.forEach(p => {
      console.log(`   • ${p.name} → ${p.enterprise_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

reseedProjects()
  .then(() => {
    console.log('\n✅ Projects reseeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
