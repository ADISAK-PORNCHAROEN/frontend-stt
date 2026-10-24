# Time Atlas

เว็บถอดเสียงภาษาไทยแบบ local-first สำหรับไฟล์เสียงหรือวิดีโอในเครื่อง แสดง transcript ตามช่วงเวลาและให้กดเพื่อกลับไปฟังช่วงนั้นได้

## เริ่มใช้งาน

1. เปิด STT API และ worker ตามคำแนะนำใน README ของโปรเจกต์ `stt-services` โดย service ต้องพร้อมที่ `127.0.0.1:8000` ก่อนเริ่มงาน
2. ในโฟลเดอร์โปรเจกต์นี้ รัน:

   ```powershell
   npm install
   npm run dev
   ```

3. เปิด `http://localhost:3000` ใน browser บนเครื่องเดียวกัน

Next.js ผูกกับ `127.0.0.1` ใน dev และ production scripts ตามขอบเขต local-only ของแอป ส่วน service URL ค่าเริ่มต้นคือ `http://127.0.0.1:8000`; ตั้ง `STT_SERVICE_URL` ได้เฉพาะ localhost/127.0.0.1 และห้ามตั้งเป็น host ภายนอก

## ความสามารถและข้อจำกัด

- รองรับ MP3, M4A, WAV, FLAC และ MP4 ที่มีเสียง; สูงสุด 1 GiB และ 2 ชั่วโมง
- ติดตามครั้งละหนึ่งงานในแท็บปัจจุบัน ไม่มีบัญชี คลังประวัติ หรือการเก็บ transcript ใน browser
- service เก็บไฟล์ต้นฉบับของงานสำเร็จ 24 ชั่วโมงและผล 7 วัน; งานล้มเหลวเก็บข้อมูล 24 ชั่วโมง
- หากปิดแท็บระหว่างอัปโหลดหรือถอดเสียง หน้าเว็บจะไม่สามารถติดตามงานเดิมได้
- ส่งออก transcript เป็น TXT หรือ SRT

## Project commands

```powershell
npm run lint
npm run build
npm run dev
npm start
```

โปรเจกต์ยังไม่มี unit, integration หรือ browser test runner ที่กำหนดไว้ใน `package.json`; lint และ build ไม่ใช่ behavioral test.
