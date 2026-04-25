const REPLACEMENTS: Array<[string, string]> = [
  // Auth / common UI
  ['??ng nh?p ?? qu?n ly kho hang', 'Đăng nhập để quản lý kho hàng'],
  ['T?o tai kho?n m?i', 'Tạo tài khoản mới'],
  ['M?t kh?u', 'Mật khẩu'],
  ['?ANG X? LY...', 'ĐANG XỬ LÝ...'],
  ['??NG NH?P', 'ĐĂNG NHẬP'],
  ['??NG KY', 'ĐĂNG KÝ'],
  ['??ng ky ngay', 'Đăng ký ngay'],
  ['??ng nh?p ngay', 'Đăng nhập ngay'],
  ['Ch?a co tai kho?n?', 'Chưa có tài khoản?'],
  ['?a co tai kho?n?', 'Đã có tài khoản?'],
  ['??ng xu?t', 'Đăng xuất'],
  ['??NG XU?T NGAY', 'ĐĂNG XUẤT NGAY'],

  // Generic words / phrases used widely in UI
  ['T?ng quan', 'Tổng quan'],
  ['Kho hang', 'Kho hàng'],
  ['Nh?p Xu?t', 'Nhập Xuất'],
  ['Nh?p Xu?t L?', 'Nhập Xuất Lẻ'],
  ['Nh?p Xu?t Lo', 'Nhập Xuất Lô'],
  ['L?ch s?', 'Lịch sử'],
  ['Hi?u su?t', 'Hiệu suất'],
  ['Cai ??t', 'Cài đặt'],
  ['Th?i gian', 'Thời gian'],
  ['S?n ph?m', 'Sản phẩm'],
  ['Danh m?c', 'Danh mục'],
  ['Bi?n th?', 'Biến thể'],
  ['T?n kho', 'Tồn kho'],
  ['Lo?i', 'Loại'],
  ['Ghi chu', 'Ghi chú'],
  ['Chi ti?t', 'Chi tiết'],
  ['Nh?p kho', 'Nhập kho'],
  ['Xu?t kho', 'Xuất kho'],
  ['Ch?nh s?a', 'Chỉnh sửa'],
  ['Xac nh?n', 'Xác nhận'],
  ['Khong', 'Không'],
  ['khong', 'không'],
  ['M?c ??nh', 'Mặc định'],
  ['Khac', 'Khác'],
  ['L?u y', 'Lưu ý'],
  ['T? ngay', 'Từ ngày'],
  ['??n ngay', 'Đến ngày'],
  ['Ma ??n / Lo', 'Mã đơn / Lô'],
  ['Thanh Toan', 'Thanh Toán'],
  ['T?ng s? l??ng', 'Tổng số lượng'],
  ['H?Y THAY ??I', 'HỦY THAY ĐỔI'],
  ['L?U THAY ??I LO', 'LƯU THAY ĐỔI LÔ'],
  ['L?U T?M', 'LƯU TẠM'],
  ['C?P NH?T', 'CẬP NHẬT'],
  ['Them s?n ph?m', 'Thêm sản phẩm'],
  ['Tim ki?m', 'Tìm kiếm'],
  ['Thao tac', 'Thao tác'],
  ['Hi?n th?', 'Hiển thị'],
  ['Xem chi ti?t', 'Xem chi tiết'],
  ['Ch?nh s?a lo', 'Chỉnh sửa lô'],
  ['Ch?nh s?a lo hang', 'Chỉnh sửa lô hàng'],
  ['Hoan t?t', 'Hoàn tất'],
  ['Ten Lo Hang', 'Tên Lô Hàng'],
  ['Danh Sach Nh?p Xu?t', 'Danh Sách Nhập Xuất'],
  ['Quy trinh Nh?p / Xu?t', 'Quy trình Nhập / Xuất'],
  ['Ch?n ch? ??', 'Chọn chế độ'],
  ['Quet ma', 'Quét mã'],
  ['Thong th??ng', 'Thông thường'],
  ['??n gia', 'Đơn giá'],
  ['S? l??ng', 'Số lượng'],
  ['Ho?t ??ng g?n ?ay', 'Hoạt động gần đây'],
  ['Nh?p ma v?ch nhanh', 'Nhập mã vạch nhanh'],
  ['Ch? ?? theo lo', 'Chế độ theo lô'],
  ['NH?P LO', 'NHẬP LÔ'],
  ['XU?T LO', 'XUẤT LÔ'],
  ['NH?P', 'NHẬP'],
  ['XU?T', 'XUẤT'],
  ['Ghi chu lo hang', 'Ghi chú lô hàng'],
  ['Danh sach s?n ph?m trong lo', 'Danh sách sản phẩm trong lô'],
  ['C?p nh?t thong tin va s? l??ng trong lo', 'Cập nhật thông tin và số lượng trong lô'],
  ['Sao chep SKU', 'Sao chép SKU'],
  ['TIEU ??', 'TIÊU ĐỀ'],
  ['Xoa', 'Xóa'],
  ['xoa', 'xóa'],
  ['Hanh ??ng', 'Hành động'],
  ['hoan tac', 'hoàn tác'],
  ['?a ', 'Đã '],
  ['?ONG', 'ĐÓNG'],
  ['?ong', 'đóng'],

  // Inventory / product management
  ['?? xu?t nh?p', 'Đề xuất nhập'],
  ['?? xu?t: ', 'Đề xuất: '],
  ['T?t c? s?n ph?m ??u ?? hang.', 'Tất cả sản phẩm đều đủ hàng.'],
  ['Tim ki?m & Thao tac th? cong', 'Tìm kiếm & Thao tác thủ công'],
  ['Hi?n th? 4 k?t qu? ??u tien. Hay thu h?p tim ki?m ?? th?y s?n ph?m c? th?.', 'Hiển thị 4 kết quả đầu tiên. Hãy thu hẹp tìm kiếm để thấy sản phẩm cụ thể.'],
  ['Ten', 'Tên'],
  ['G?i y nh?p', 'Gợi ý nhập'],
  ['T?n t?i thi?u', 'Tồn tối thiểu'],
  ['Gia ban', 'Giá bán'],
  ['Gia nh?p', 'Giá nhập'],
  ['Hinh ?nh', 'Hình ảnh'],
  ['Hinh anh', 'Hình ảnh'],
  ['No variant', 'Không biến thể'],
  ['Khong ten', 'Không tên'],

  // Orders / sales
  ['BAN TR?C TI?P', 'BÁN TRỰC TIẾP'],
  ['Ghi chu ??n hang', 'Ghi chú đơn hàng'],
  ['??n ', 'Đơn '],
  ['Ten khach', 'Tên khách'],
  ['Khach ??a ??: ', 'Khách đưa đủ: '],
  ['Tr?m Quet ??n', 'Trạm Quét Đơn'],
  ['Nh?p ma v?n ??n va s?n ph?m', 'Nhập mã vận đơn và sản phẩm'],
  ['Ma v?n ??n', 'Mã vận đơn'],
  ['Chi ti?t ??n hang', 'Chi tiết đơn hàng'],
  ['Ghi chu & Thong tin khach', 'Ghi chú & Thông tin khách'],
  ['Nh?p ten khach, S?T, ??a ch? ho?c ghi chu ??c bi?t...', 'Nhập tên khách, SĐT, địa chỉ hoặc ghi chú đặc biệt...'],
  ['Danh Sach ??n Hang', 'Danh Sách Đơn Hàng'],
  ['Tim ma v?n ??n...', 'Tìm mã vận đơn...'],
  ['B?t ??u', 'Bắt đầu'],
  ['??n hang khong ma', 'Đơn hàng không mã'],
  ['Tom t?t ??n hang', 'Tóm tắt đơn hàng'],
  ['S? l??ng ma hang:', 'Số lượng mã hàng:'],
  ['Ma V?n ??n', 'Mã Vận Đơn'],
  ['Ghi chu chung', 'Ghi chú chung'],
  ['Nh?p ma v?n ??n...', 'Nhập mã vận đơn...'],
  ['Nh?p ghi chu khach hang...', 'Nhập ghi chú khách hàng...'],
  ['Nh?p SKU them...', 'Nhập SKU thêm...'],
  ['Gi?m s? l??ng', 'Giảm số lượng'],
  ['T?ng s? l??ng', 'Tăng số lượng'],
  ['B?n co ch?c ch?n mu?n xoa TOAN B? ??n hang nay?', 'Bạn có chắc chắn muốn xóa TOÀN BỘ đơn hàng này?'],
  ['XOA ??N', 'XÓA ĐƠN'],

  // Data / settings / analytics
  ['T? ??ng d?n d?p l?ch s?', 'Tự động dọn dẹp lịch sử'],
  ['T? ??ng xoa cac giao d?ch c? ?? t?i ?u dung l??ng c? s? d? li?u', 'Tự động xóa các giao dịch cũ để tối ưu dung lượng cơ sở dữ liệu'],
  ['Kich ho?t t? ??ng xoa', 'Kích hoạt tự động xóa'],
  ['Hanh ??ng nay s? th?c hi?n tr?c ti?p tren Firebase. Hay ??m b?o b?n ?a ??ng b? d? li?u sang Supabase (n?u co) tr??c khi th?c hi?n xoa v?nh vi?n.', 'Hành động này sẽ thực hiện trực tiếp trên Firebase. Hãy đảm bảo bạn đã đồng bộ dữ liệu sang Supabase (nếu có) trước khi thực hiện xóa vĩnh viễn.'],
  ['Cai ??t giao di?n', 'Cài đặt giao diện'],
  ['Ch? ?? sang/t?i', 'Chế độ sáng/tối'],
  ['Chuy?n ??i giao di?n h? th?ng', 'Chuyển đổi giao diện hệ thống'],
  ['Email ??ng nh?p', 'Email đăng nhập'],
  ['UID ng??i dung', 'UID người dùng'],
  ['Tai kho?n c?a b?n ???c b?o v? b?i h? th?ng xac th?c Firebase.', 'Tài khoản của bạn được bảo vệ bởi hệ thống xác thực Firebase.'],
  ['C?u hinh API ?? l?u tr? d? li?u len Supabase', 'Cấu hình API để lưu trữ dữ liệu lên Supabase'],
  ['D? li?u s? ???c ??ng b? len Supabase khi ???c b?t', 'Dữ liệu sẽ được đồng bộ lên Supabase khi được bật'],
  ['Vui long nh?p ??y ?? URL va Key', 'Vui lòng nhập đầy đủ URL và Key'],
  ['C?u hinh ?a ???c l?u!', 'Cấu hình đã được lưu!'],
  ['??ng b? d? li?u hi?n t?i', 'Đồng bộ dữ liệu hiện tại'],
  ['??y toan b? s?n ph?m va giao d?ch hi?n co len Supabase', 'Đẩy toàn bộ sản phẩm và giao dịch hiện có lên Supabase'],
  ['Vui long c?u hinh va kich ho?t Supabase tr??c', 'Vui lòng cấu hình và kích hoạt Supabase trước'],
  ['??ng b? thanh cong!', 'Đồng bộ thành công!'],
  ['L?i ??ng b?: ', 'Lỗi đồng bộ: '],
  ['??NG B? NGAY', 'ĐỒNG BỘ NGAY'],
  ['?? Supabase ho?t ??ng chinh xac, b?n c?n t?o cac b?ng ', 'Để Supabase hoạt động chính xác, bạn cần tạo các bảng '],
  ['c? s? d? li?u', 'cơ sở dữ liệu'],
  ['c?a minh', 'của mình'],
  ['c?u truc t??ng ?ng', 'cấu trúc tương ứng'],
  ['L?I NHU?N ??C TINH', 'LỢI NHUẬN ƯỚC TÍNH'],
  ['??N TR?C TI?P', 'ĐƠN TRỰC TIẾP'],
  ['??N ONLINE', 'ĐƠN ONLINE'],
  ['so v?i k? tr??c', 'so với kỳ trước'],
  ['BI?U ?? DOANH THU & L?I NHU?N', 'BIỂU ĐỒ DOANH THU & LỢI NHUẬN'],
  ['Top 5 s?n ph?m ??t doanh s? cao nh?t', 'Top 5 sản phẩm đạt doanh số cao nhất'],
  ['l??t ban', 'lượt bán'],
  ['D?a tren ', 'Dựa trên '],
  ['??i ten tieu ??', 'Đổi tên tiêu đề'],
  ['B?n co ch?c ch?n mu?n xoa ', 'Bạn có chắc chắn muốn xóa '],
  ['tieu ??', 'tiêu đề'],
  ['Hanh ??ng nay khong th? hoan tac.', 'Hành động này không thể hoàn tác.'],
  ['Them hang d??i', 'Thêm hàng dưới'],
  ['Nh?p kho s?n ph?m', 'Nhập kho sản phẩm'],
  ['Xu?t kho s?n ph?m', 'Xuất kho sản phẩm'],
  ['Ghi chu (tuy ch?n)', 'Ghi chú (tùy chọn)'],
  ['Nh?p ly do nh?p/xu?t...', 'Nhập lý do nhập/xuất...'],
  ['Nh?p ho?c ch?n danh m?c...', 'Nhập hoặc chọn danh mục...'],
  ['Ch?a co danh m?c nao. Hay nh?p ?? t?o m?i.', 'Chưa có danh mục nào. Hãy nhập để tạo mới.'],
  ['Bi?n th? (Mau s?c, kich th??c...)', 'Biến thể (Màu sắc, kích thước...)'],
  ['VD: ??, XL, 128GB...', 'VD: Đỏ, XL, 128GB...'],
  ['T?n kho ?? xu?t', 'Tồn kho đề xuất'],
  ['???NG D?N URL', 'ĐƯỜNG DẪN URL'],
  ['?ang x? ly...', 'Đang xử lý...'],
  ['Nh?n ?? ch?n ?nh t? thi?t b?', 'Nhấn để chọn ảnh từ thiết bị'],
  ['Ghi chu s?n ph?m', 'Ghi chú sản phẩm'],
  ['Nh?p ghi chu cho s?n ph?m nay...', 'Nhập ghi chú cho sản phẩm này...'],
  ['Khong tim th?y s?n ph?m nao.', 'Không tìm thấy sản phẩm nào.'],
  ['Ap d?ng thay ??i', 'Áp dụng thay đổi'],

  // Runtime alerts/messages
  ['B?n co ch?c ch?n mu?n xoa s?n ph?m nay kh?i ??n hang?', 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?'],
  ['Khong tim th?y s?n ph?m v?i SKU nay!', 'Không tìm thấy sản phẩm với SKU này!'],
  ['Khong tim th?y s?n ph?m v?i ma: ', 'Không tìm thấy sản phẩm với mã: '],
  ['khong ?? t?n kho', 'không đủ tồn kho'],
  ['c?n ', 'cần '],
  ['hi?n co ', 'hiện có '],
  ['B?n co ch?c ch?n mu?n xoa TOAN B? l?ch s?? Hanh ??ng nay khong th? hoan tac.', 'Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử? Hành động này không thể hoàn tác.'],
  ['Khong co d? li?u c? ?? xoa.', 'Không có dữ liệu cũ để xóa.'],
  ['?a hoan thanh ??n hang! #', 'Đã hoàn thành đơn hàng! #'],
  ['File khong co d? li?u ?? nh?p!', 'File không có dữ liệu để nhập!'],
  ['Khong tim th?y s?n ph?m h?p l? ?? nh?p.', 'Không tìm thấy sản phẩm hợp lệ để nhập.'],
  ['L?i khi ??c file.', 'Lỗi khi đọc file.'],
  ['Khong ?? hang t?n kho!', 'Không đủ hàng tồn kho!'],
  ['Kich th??c ?nh qua l?n (T?i ?a 5MB)', 'Kích thước ảnh quá lớn (Tối đa 5MB)'],
  ['Khong tim th?y s?n ph?m!', 'Không tìm thấy sản phẩm!'],

  // Existing mojibake that can still surface from old strings
  ['Khﾃｴng', 'Không'],
  ['khﾃｴng', 'không'],
  ['s蘯｣n ph蘯ｩm', 'sản phẩm'],
  ['S蘯｣n ph蘯ｩm', 'Sản phẩm'],
  ['M蘯ｷc ﾄ黛ｻ杵h', 'Mặc định'],
  ['Khﾃ｡c', 'Khác'],
  ['Ch盻穎h s盻ｭa', 'Chỉnh sửa'],
  ['Chi ti蘯ｿt', 'Chi tiết'],
  ['Danh sﾃ｡ch', 'Danh sách'],
  ['thﾃｴng tin', 'thông tin'],
  ['Ghi chﾃｺ', 'Ghi chú'],
  ['giao d盻議h', 'giao dịch'],
  ['L盻議h s盻ｭ', 'Lịch sử'],
  ['Nh蘯ｭp', 'Nhập'],
  ['Xu蘯･t', 'Xuất'],
  ['NH蘯ｬP', 'NHẬP'],
  ['XU蘯､T', 'XUẤT'],
  ['lﾃｴ hﾃng', 'lô hàng'],
  ['Lﾃｴ Hﾃng', 'Lô Hàng'],
  ['T盻貧g s盻・lﾆｰ盻｣ng', 'Tổng số lượng'],
  ['T盻渡 kho', 'Tồn kho'],
  ['Danh m盻･c', 'Danh mục'],
  ['Bi蘯ｿn th盻・', 'Biến thể'],
  ['Thao tﾃ｡c', 'Thao tác'],
  ['Tﾃｬm ki蘯ｿm', 'Tìm kiếm'],
  ['Hi盻ハ th盻・', 'Hiển thị'],
  ['Tﾃｪn lﾃｴ hﾃng', 'Tên lô hàng'],
  ['H盻ｦY THAY ﾄ雪ｻ祢', 'HỦY THAY ĐỔI'],
  ['LﾆｯU THAY ﾄ雪ｻ祢 Lﾃ・', 'LƯU THAY ĐỔI LÔ'],
  ['LﾆｯU T蘯M', 'LƯU TẠM'],
  ['C蘯ｬP NH蘯ｬT', 'CẬP NHẬT'],
  ['Xﾃ｡c nh蘯ｭn', 'Xác nhận'],
  ['Sao chﾃｩp', 'Sao chép'],
  ['ﾄ静｣', 'Đã'],
  ['ﾄ静哲G', 'ĐÓNG'],
];

export function fixVietnameseText(input: string) {
  let output = input;

  for (const [from, to] of REPLACEMENTS) {
    output = output.split(from).join(to);
  }

  output = output
    .replace(/(\d)\?/g, '$1₫')
    .replace(/\?\?\?\?\?\?\?\?/g, '••••••••')
    .replace(/\bTen\b/g, 'Tên')
    .replace(/\bXOA\b/g, 'XÓA');

  return output;
}

export function repairVietnameseUi(root: ParentNode = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    if (current.nodeValue) {
      const fixed = fixVietnameseText(current.nodeValue);
      if (fixed !== current.nodeValue) {
        current.nodeValue = fixed;
      }
    }
    current = walker.nextNode();
  }

  const elements =
    root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...document.body.querySelectorAll('*')];

  for (const element of elements) {
    if (!(element instanceof HTMLElement || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      continue;
    }

    for (const attr of ['title', 'placeholder', 'aria-label']) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const fixed = fixVietnameseText(value);
      if (fixed !== value) {
        element.setAttribute(attr, fixed);
      }
    }
  }
}
