import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

const DB_PATH = resolve(process.cwd(), "data", "orbis.db");
const db = new DatabaseSync(DB_PATH);

console.log("=== DATABASE TEST ===\n");

// Attendance jadvaldagi yozuvlar soni
const attendanceCount = db.prepare("SELECT COUNT(*) as total FROM attendance").get();
console.log("Attendance yozuvlari:", attendanceCount.total);

// Oxirgi 5 ta yozuv
const recentAttendance = db.prepare(`
  SELECT id, employeeName, date, status, checkIn, checkOut 
  FROM attendance 
  ORDER BY date DESC, id DESC 
  LIMIT 5
`).all();

console.log("\nOxirgi 5 ta davomat:");
recentAttendance.forEach(row => {
  console.log(`- ${row.employeeName} (${row.date}): ${row.status} | ${row.checkIn} - ${row.checkOut}`);
});

// Bugungi yozuvlar
const today = new Date().toISOString().split('T')[0];
const todayAttendance = db.prepare(`
  SELECT employeeName, status, checkIn, checkOut 
  FROM attendance 
  WHERE date = ?
`).all(today);

console.log(`\nBugungi (${today}) davomat:`, todayAttendance.length, "ta");
todayAttendance.forEach(row => {
  console.log(`- ${row.employeeName}: ${row.status} | ${row.checkIn} - ${row.checkOut}`);
});

db.close();
