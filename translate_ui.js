import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');

const replacements = [
  // AppShell Navigation
  [/'Customers'/g, "'Khách hàng'"],
  [/'Treatment Plans'/g, "'Liệu trình'"],
  [/'Scheduling'/g, "'Đặt lịch'"],
  [/'Scheduling Board'/g, "'Bảng lịch hẹn'"],
  [/'Appointment Detail'/g, "'Chi tiết lịch hẹn'"],
  [/'Appointment Lifecycle'/g, "'Quản lý lịch hẹn'"],
  [/'Staff Management'/g, "'Quản lý nhân viên'"],
  [/'Service Catalog'/g, "'Danh mục dịch vụ'"],
  [/'Room Management'/g, "'Quản lý phòng'"],
  [/'Equipment Management'/g, "'Quản lý thiết bị'"],
  [/'Staff Skills'/g, "'Kỹ năng nhân viên'"],
  [/'Service Requirements'/g, "'Yêu cầu dịch vụ'"],
  [/'Staff Accounts'/g, "'Tài khoản nhân viên'"],
  [/'Change Password'/g, "'Đổi mật khẩu'"],

  // Titles and Descriptions in PageCard
  [/title="Operational Dashboard"/g, 'title="Dashboard"'],
  [/description="Daily operational snapshot for appointments, sessions, plans, and workload."/g, 'description="Cái nhìn tổng quan về hoạt động hằng ngày: lịch hẹn, buổi liệu trình và khối lượng công việc."'],
  [/title="Appointments today"/g, 'title="Lịch hẹn hôm nay"'],
  [/title="Sessions backlog"/g, 'title="Buổi chưa xử lý"'],
  [/title="Treatment plans"/g, 'title="Liệu trình"'],
  [/title="Operational focus"/g, 'title="Trọng tâm hoạt động"'],
  [/title="Upcoming appointments"/g, 'title="Lịch hẹn sắp tới"'],
  [/title="Unscheduled sessions"/g, 'title="Các buổi chưa đặt lịch"'],
  [/title="Staff workload"/g, 'title="Khối lượng công việc nhân viên"'],
  [/title="Room workload"/g, 'title="Khối lượng công việc phòng"'],
  [/title="Staff management"/g, 'title="Quản lý nhân viên"'],
  [/title="Create staff"/g, 'title="Thêm nhân viên"'],
  [/title="Update staff"/g, 'title="Cập nhật nhân viên"'],
  [/title="Create customer"/g, 'title="Thêm khách hàng"'],
  [/title="Create treatment plan"/g, 'title="Tạo liệu trình"'],
  [/title="Service catalog"/g, 'title="Danh mục dịch vụ"'],
  [/title="Create service"/g, 'title="Thêm dịch vụ"'],
  [/title="Update service"/g, 'title="Cập nhật dịch vụ"'],
  [/title="Customer detail"/g, 'title="Chi tiết khách hàng"'],
  [/title="Customer history"/g, 'title="Lịch sử khách hàng"'],
  [/title="Equipment management"/g, 'title="Quản lý thiết bị"'],
  [/title="Room management"/g, 'title="Quản lý phòng"'],
  [/title="Scheduling board"/gi, 'title="Bảng lịch hẹn"'],
  [/title="Scheduling"/g, 'title="Đặt lịch"'],

  // Common UI texts
  [/>Signed in as</g, '>Đăng nhập<'],
  [/>Logout</g, '>Đăng xuất<'],
  [/>Create</g, '>Thêm<'],
  [/>Update</g, '>Cập nhật<'],
  [/>Delete</g, '>Xóa<'],
  [/>Cancel</g, '>Hủy<'],
  [/>Reset</g, '>Đặt lại<'],
  [/>Apply filters</g, '>Áp dụng<'],
  [/>Status</g, '>Trạng thái<'],
  [/>Customer</g, '>Khách hàng<'],
  [/>Staff</g, '>Nhân viên<'],
  [/>Service</g, '>Dịch vụ<'],
  [/>Room</g, '>Phòng<'],
  [/>Equipment</g, '>Thiết bị<'],
  [/>Role</g, '>Vai trò<'],
  [/>Name</g, '>Tên<'],
  [/>Phone</g, '>Số điện thoại<'],
  [/>Sessions:/g, '>Số buổi:<'],
  [/>Sessions</g, '>Các buổi<'],

  // Generic texts in components
  [/>All statuses</g, '>Tất cả trạng thái<'],
  [/>All customers</g, '>Tất cả khách hàng<'],
  [/>Active filters:</g, '>Đang lọc:<'],
  [/placeholder="Customer name"/g, 'placeholder="Tên khách hàng"'],
  [/placeholder="Staff name"/g, 'placeholder="Tên nhân viên"'],
  [/placeholder="Phone number"/g, 'placeholder="Số điện thoại"'],
  
  // Specific phrases
  [/>Create treatment plan</g, '>Tạo liệu trình<'],
  [/>Total price:/g, '>Tổng giá:<'],
  [/>Draft plan — activate it before scheduling sessions.</g, '>Bản nháp — hãy kích hoạt trước khi xếp lịch các buổi.<'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Translated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

processDirectory(SRC_DIR);
console.log('UI Translation complete.');
