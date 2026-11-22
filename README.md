# SubViet Portal

Cổng tìm kiếm nhanh link phụ đề tiếng Việt WEB-DL (**SubDL**, **SubSource**) và link bản **Raw đã mux sẵn Vietsub** (Google Drive, Pixeldrain, Gofile, Fshare, Mega...).

## Tính năng chính
- **Zero-Storage**: Không lưu trữ file sub hay video trên server — chỉ tổng hợp metadata TMDB + link tải.
- **Tìm kiếm tiếng Việt siêu nhanh**: Hỗ trợ tìm có dấu, không dấu, tên tiếng Anh, mã IMDb, phím tắt `Ctrl + K` / `Cmd + K`.
- **Không bắt người xem đăng nhập**: Vào web tìm phim, bấm mở SubDL / SubSource / Link Raw trong 1 click, có nút báo link hỏng ẩn danh.
- **Admin 1 người dùng (`/admin`)**:
  - Đăng nhập bằng `ADMIN_PASSWORD` (hoặc `ADMIN_PASSWORD_HASH`).
  - Tìm hoặc dán URL TMDB để tự động kéo Poster, tên Việt/Anh, danh sách mùa/tập.
  - Dán link vào tự động nhận diện nguồn (`SubDL`, `SubSource`, `Google Drive`, `Pixeldrain`, `Gofile`, `Fshare`, `Mega`...).
  - Tự động tạo mẫu tin chia sẻ nhanh lên Facebook / Telegram / Discord sau khi xuất bản.

## Cài đặt & Chạy Local

1. Cài đặt thư viện:
   ```bash
   npm install
   ```

2. Cấu hình biến môi trường trong `.env` (tham khảo `.env.example`):
   - `DATABASE_URL`: Chuỗi kết nối PostgreSQL (Supabase, Neon hoặc PostgreSQL local).
   - `ADMIN_PASSWORD`: Mật khẩu đăng nhập `/admin`.
   - `ADMIN_SESSION_SECRET`: Chuỗi bí mật tối thiểu 32 ký tự.
   - `TMDB_API_KEY`: API key miễn phí từ [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

3. Khởi tạo bảng PostgreSQL & dữ liệu mẫu (tùy chọn):
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. Chạy dev server:
   ```bash
   npm run dev
   ```
   Truy cập `http://localhost:3000` (trang xem) và `http://localhost:3000/admin` (trang quản trị).

## Kiểm thử
```bash
npm test
npm run typecheck
npm run lint
npm run build
```
