// Ubah nama pegawai jadi email internal: "Budi Santoso" → "budisantoso@pegawai.pos"
export function namaKeEmail(nama) {
  return nama.toLowerCase().replace(/[^a-z0-9]/g, '') + '@pegawai.pos'
}