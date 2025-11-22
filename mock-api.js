// Mock API Server for Workix Desktop Testing
// This provides mock data for the desktop app development

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple auth middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // Accept any token or no token for testing
  next();
});

// Mock data
const mockWorkOrders = [
  { id: 'WO001', title: 'HVAC System Maintenance', site: 'Downtown Office', priority: 'High', status: 'In Progress', assignedTo: 'John Smith' },
  { id: 'WO002', title: 'Filter Replacement', site: 'Building A', priority: 'Medium', status: 'Pending', assignedTo: 'Sarah Jones' },
  { id: 'WO003', title: 'System Inspection', site: 'Building B', priority: 'Low', status: 'Completed', assignedTo: 'Mike Davis' },
  { id: 'WO004', title: 'Emergency Repair', site: 'Downtown Office', priority: 'High', status: 'In Progress', assignedTo: 'John Smith' },
  { id: 'WO005', title: 'Routine Maintenance', site: 'Building C', priority: 'Low', status: 'Pending', assignedTo: 'Sarah Jones' },
];

const mockAssets = [
  { id: 1, name: 'HVAC Unit A', type: 'Air Handler', model: 'AHU-2000', serialNumber: 'SN123456', status: 'Active', location: 'Building A' },
  { id: 2, name: 'Compressor B', type: 'Compressor', model: 'COMP-500', serialNumber: 'SN654321', status: 'Active', location: 'Building B' },
  { id: 3, name: 'Thermostat C', type: 'Control', model: 'THERM-100', serialNumber: 'SN789012', status: 'Inactive', location: 'Building C' },
  { id: 4, name: 'Ductwork D', type: 'Ductwork', model: 'DUCT-3000', serialNumber: 'SN345678', status: 'Active', location: 'Building A' },
];

const mockClients = [
  { id: 1, name: 'ABC Corporation', email: 'contact@abc.com', phone: '555-0100', status: 'Active' },
  { id: 2, name: 'XYZ Industries', email: 'info@xyz.com', phone: '555-0200', status: 'Active' },
  { id: 3, name: 'Tech Solutions Ltd', email: 'support@techsol.com', phone: '555-0300', status: 'Inactive' },
];

const mockProjects = [
  { id: 1, name: 'Office Building Renovation', description: 'Complete HVAC system upgrade', client: 'ABC Corporation', status: 'In Progress' },
  { id: 2, name: 'Factory Maintenance', description: 'Annual preventive maintenance', client: 'XYZ Industries', status: 'Planning' },
  { id: 3, name: 'Mall System Installation', description: 'New HVAC installation', client: 'Tech Solutions Ltd', status: 'Completed' },
];

const mockSites = [
  { id: 1, name: 'Downtown Office', location: '123 Main St, Downtown', projectName: 'Office Building Renovation' },
  { id: 2, name: 'Building A', location: '456 Industrial Ave', projectName: 'Factory Maintenance' },
  { id: 3, name: 'Building B', location: '789 Commerce Dr', projectName: 'Factory Maintenance' },
  { id: 4, name: 'Building C', location: '321 Plaza Rd', projectName: 'Mall System Installation' },
];

const mockPPM = [
  { id: 1, assetName: 'HVAC Unit A', frequency: 'Monthly', lastCompleted: '2025-11-10', nextDue: '2025-12-10', status: 'On Schedule' },
  { id: 2, assetName: 'Compressor B', frequency: 'Quarterly', lastCompleted: '2025-10-01', nextDue: '2025-12-15', status: 'Due Soon' },
  { id: 3, assetName: 'Ductwork D', frequency: 'Semi-Annual', lastCompleted: '2025-05-01', nextDue: '2025-11-30', status: 'Overdue' },
];

const mockUsers = [
  { id: 1, name: 'John Smith', email: 'john@workix.com', role: 'Admin', phone: '555-1001', status: 'Active', createdAt: '2025-01-15' },
  { id: 2, name: 'Sarah Jones', email: 'sarah@workix.com', role: 'Technician', phone: '555-1002', status: 'Active', createdAt: '2025-02-20' },
  { id: 3, name: 'Mike Davis', email: 'mike@workix.com', role: 'Technician', phone: '555-1003', status: 'Active', createdAt: '2025-03-10' },
  { id: 4, name: 'Emily Brown', email: 'emily@workix.com', role: 'Admin', phone: '555-1004', status: 'Inactive', createdAt: '2025-01-01' },
];

const mockAnalytics = {
  totalWorkOrders: 47,
  completedThisMonth: 12,
  activeAssets: 23,
  teamMembers: 8,
  revenueThisMonth: 45000,
  utilizationRate: 87,
};

// API Routes
app.get('/api/v1/work-orders', (req, res) => {
  res.json({ success: true, data: mockWorkOrders });
});

app.get('/api/v1/assets', (req, res) => {
  res.json({ success: true, data: mockAssets });
});

app.get('/api/v1/clients', (req, res) => {
  res.json({ success: true, data: mockClients });
});

app.get('/api/v1/projects', (req, res) => {
  res.json({ success: true, data: mockProjects });
});

app.get('/api/v1/sites', (req, res) => {
  res.json({ success: true, data: mockSites });
});

app.get('/api/v1/ppm', (req, res) => {
  res.json({ success: true, data: mockPPM });
});

app.get('/api/v1/users', (req, res) => {
  res.json({ success: true, data: mockUsers });
});

app.get('/api/v1/analytics', (req, res) => {
  res.json({ success: true, data: mockAnalytics });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Mock Workix API Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET /api/v1/work-orders   - Work orders list`);
  console.log(`   GET /api/v1/assets        - Assets inventory`);
  console.log(`   GET /api/v1/clients       - Clients directory`);
  console.log(`   GET /api/v1/projects      - Projects list`);
  console.log(`   GET /api/v1/sites         - Sites list`);
  console.log(`   GET /api/v1/ppm           - PPM schedules`);
  console.log(`   GET /api/v1/users         - Users list`);
  console.log(`   GET /api/v1/analytics     - Analytics data`);
  console.log(`   GET /api/v1/health        - Health check`);
  console.log(`\n🎉 Desktop app can now connect to http://localhost:${PORT}\n`);
});
