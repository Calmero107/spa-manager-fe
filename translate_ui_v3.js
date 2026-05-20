import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');

const replacements = [
  // 1. Remove PageCard descriptions completely for a cleaner UI
  [/ description="[^"]*"/g, ''],

  // 2. Auth / Login Page
  [/>Sign in</g, '>Đăng nhập<'],
  [/<p className="mt-2 text-sm text-slate-500">Base frontend mapped to current backend capabilities.<\/p>/g, ''],
  [/>Username</g, '>Tên đăng nhập<'],
  [/>Password</g, '>Mật khẩu<'],
  [/placeholder="Password"/g, 'placeholder="Mật khẩu"'],
  [/'Login failed. Check API \/ seed data.'/g, "'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'"],
  [/>Signing in\.\.\.</g, '>Đang xử lý...<'],
  [/>Login</g, '>Đăng nhập<'],

  // 3. Change Password Page
  [/title="Change password"/g, 'title="Đổi mật khẩu"'],
  [/>Current password</g, '>Mật khẩu hiện tại<'],
  [/>New password</g, '>Mật khẩu mới<'],
  [/>Confirm new password</g, '>Xác nhận mật khẩu mới<'],
  [/>Change my password</g, '>Đổi mật khẩu<'],
  [/>Changing\.\.\.</g, '>Đang xử lý...<'],
  [/'Password changed successfully.'/g, "'Đổi mật khẩu thành công.'"],
  [/'Failed to change password.'/g, "'Đổi mật khẩu thất bại.'"],

  // 4. Staff Accounts Page
  [/title="Staff Accounts"/g, 'title="Tài khoản nhân viên"'],
  [/>Create account</g, '>Tạo tài khoản<'],
  [/>Staff member</g, '>Nhân viên<'],
  [/>Select staff</g, '>Chọn nhân viên<'],
  [/>Initial password</g, '>Mật khẩu khởi tạo<'],
  [/>Creating\.\.\.</g, '>Đang tạo...<'],
  [/'Account created successfully.'/g, "'Tạo tài khoản thành công.'"],
  [/'Failed to create account.'/g, "'Tạo tài khoản thất bại.'"],
  
  [/>Update account</g, '>Cập nhật tài khoản<'],
  [/>Updating\.\.\.</g, '>Đang cập nhật...<'],
  [/>Save account changes</g, '>Lưu thay đổi<'],
  [/'Account updated successfully.'/g, "'Cập nhật tài khoản thành công.'"],
  [/'Failed to update account.'/g, "'Cập nhật thất bại.'"],
  
  [/>Reset password</g, '>Đặt lại mật khẩu<'],
  [/>Resetting\.\.\.</g, '>Đang đặt lại...<'],
  [/'Password reset successfully.'/g, "'Đặt lại mật khẩu thành công.'"],
  [/'Failed to reset password.'/g, "'Đặt lại mật khẩu thất bại.'"],
  
  [/>Selected account</g, '>Tài khoản đang chọn<'],
  [/>Unlinked staff</g, '>Chưa liên kết nhân viên<'],
  [/>Pick an account from the list to update role\/status or reset its password.</g, '>Chọn một tài khoản từ danh sách để cập nhật vai trò, trạng thái hoặc đặt lại mật khẩu.<'],
  [/>All staff in this branch already have linked accounts.</g, '>Tất cả nhân viên trong chi nhánh này đều đã có tài khoản.<'],
  [/>No staff accounts found for this branch yet.</g, '>Chưa có tài khoản nhân viên nào.<'],

  // 5. Common Loaders and Errors
  [/>Loading\.\.\.</g, '>Đang tải...<'],
  [/>Loading customer detail\.\.\.</g, '>Đang tải thông tin khách hàng...<'],
  [/>Failed to load customer detail.</g, '>Không thể tải thông tin khách hàng.<'],
  [/>Loading customer history\.\.\.</g, '>Đang tải lịch sử khách hàng...<'],
  [/>Failed to load customer history.</g, '>Không thể tải lịch sử khách hàng.<'],
  [/>Loading customer audit history\.\.\.</g, '>Đang tải lịch sử thay đổi...<'],
  [/>Failed to load customer audit history.</g, '>Không thể tải lịch sử thay đổi.<'],
  [/>Loading treatment plans\.\.\.</g, '>Đang tải liệu trình...<'],
  [/>Failed to load treatment plans.</g, '>Không thể tải liệu trình.<'],
  [/>Loading staff accounts\.\.\.</g, '>Đang tải tài khoản nhân viên...<'],
  [/>Failed to load staff accounts.</g, '>Không thể tải tài khoản nhân viên.<'],
  [/>Loading staff\.\.\.</g, '>Đang tải nhân viên...<'],

  // 6. Generic texts
  [/>Missing branch context from signed-in user.</g, '>Không tìm thấy thông tin chi nhánh của người dùng.<'],
  [/>No treatment plans found for the current filters.</g, '>Không tìm thấy liệu trình nào phù hợp.<'],
  [/>No treatment plans found.</g, '>Không có liệu trình nào.<'],
  [/>No sessions found.</g, '>Không có buổi dịch vụ nào.<'],
  [/>No appointments found.</g, '>Không có lịch hẹn nào.<'],
  [/>No audit entries found for this customer yet.</g, '>Chưa có lịch sử thay đổi nào.<'],
  [/>Unknown customer</g, '>Khách hàng không xác định<'],
  [/>View treatment plans for this customer</g, '>Xem liệu trình của khách hàng này<'],
  [/>Create treatment plan for this customer</g, '>Tạo liệu trình cho khách hàng này<'],
  [/>Warning flag</g, '>Cờ cảnh báo<'],
  [/>Mark this customer with a warning flag</g, '>Đánh dấu khách hàng này có rủi ro/cảnh báo<'],
  [/>Warning note</g, '>Ghi chú cảnh báo<'],
  [/>Save customer changes</g, '>Lưu thay đổi khách hàng<'],
  [/>Saving\.\.\.</g, '>Đang lưu...<'],
  [/'Customer updated successfully.'/g, "'Cập nhật khách hàng thành công.'"],
  [/'Failed to update customer.'/g, "'Cập nhật khách hàng thất bại.'"],

  // Removing technical boilerplate from Audit history
  [/<p>Account: \{entry\.performedByAccountId \?\? 'system'\}<\/p>/g, ''],
  [/<p>Version: \{entry\.version\}<\/p>/g, ''],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Translated/Cleaned: ${filePath}`);
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
console.log('UI Deep Translation & Cleanup complete.');
