# 🐍 Competitive Snake Game

Sebuah permainan Snake klasik berbasis web dengan mode kompetitif. Bertahan hidup, makan sebanyak mungkin, dan kalahkan Bot AI sebelum waktu habis!

## ✨ Fitur Utama

- **Player vs Bot:** Bersaing melawan AI yang menggunakan algoritma _Breadth-First Search_ (BFS) dengan penyesuaian probabilitas kesalahan agar permainan tetap seimbang dan menantang.
- **Time Attack:** Batas waktu 60 detik untuk menentukan siapa ular yang paling panjang.
- **Retro Audio System:** Menggunakan Web Audio API untuk menghasilkan efek suara 8-bit saat makan, menabrak, peringatan waktu, dan melodi kemenangan.
- **Cross-Platform:** Mendukung kontrol keyboard untuk pengguna desktop dan _on-screen buttons_ untuk pengguna mobile.

## 🎮 Cara Bermain

1. Kendalikan ular hijau (Player) untuk mengumpulkan makanan sebanyak-banyaknya.
2. Hindari menabrak dinding, tubuh sendiri, atau tubuh ular merah (Bot).
3. Jika kamu menabrak sesuatu, kamu langsung kalah. Jika bot menabrak sesuatu, kamu menang.
4. Jika terjadi tabrakan beruntun (keduanya mati) atau waktu 60 detik habis, pemenang ditentukan dari ukuran ular terpanjang.

### ⌨️ Kontrol Desktop

- **W / Arrow Up:** Atas
- **S / Arrow Down:** Bawah
- **A / Arrow Left:** Kiri
- **D / Arrow Right:** Kanan
- **Space / Enter:** Memulai kembali permainan setelah Game Over

## 🚀 Cara Menjalankan Secara Lokal

1. Pastikan kamu sudah melakukan clone repository ini:
   ```bash
   git clone <URL-REPOSITORY-KAMU>
   ```
