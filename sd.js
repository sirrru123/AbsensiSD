import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// ==========================================
// FIREBASE SD
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAfTLfu5Pj5x3xfKRnpbHnnGKqxUnuHFLg",
  authDomain: "absensi-sd-dfc78.firebaseapp.com",
  databaseURL: "https://absensi-sd-dfc78-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-sd-dfc78",
  storageBucket: "absensi-sd-dfc78.firebasestorage.app",
  messagingSenderId: "240451726903",
  appId: "1:240451726903:web:bcf5f35dd847c769a019b2",
  measurementId: "G-8K21G0Q3PR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// ==========================================
// LOGIN
// ==========================================

function tampilNotif(teks) {
  const notif = document.getElementById("notifLogin");

  if (!notif) {
    alert(teks);
    return;
  }

  notif.innerHTML = teks;
  notif.classList.remove("hidden");

  setTimeout(() => {
    notif.classList.add("hidden");
  }, 3000);
}

window.login = function () {
  const role = document.getElementById("roleSelect").value;
  const pass = document.getElementById("passwordInput").value;

  const kolAksi = document.querySelectorAll(".kolom-aksi");
  kolAksi.forEach(k => k.style.display = "");

  const btnExcel = document.getElementById("btnExcel");
  if (btnExcel) btnExcel.style.display = "";

  if (role === "user" && pass === "sd123") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("userPage").classList.remove("hidden");
    return;
  }

  if (role === "parent" && pass === "ortu123") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("adminPage").classList.remove("hidden");

    const tgl = document.getElementById("filterTanggal");
    tgl.value = new Date().toISOString().split("T")[0];

    loadAbsensi();

    kolAksi.forEach(k => k.style.display = "none");

    if (btnExcel) {
      btnExcel.style.display = "none";
    }

    return;
  }

  if (role === "admin" && pass === "admin123") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("adminPage").classList.remove("hidden");

    const tgl = document.getElementById("filterTanggal");
    tgl.value = new Date().toISOString().split("T")[0];

    loadAbsensi();

    return;
  }

  tampilNotif("❌ Password salah!");
};

// ==========================================
// LOGOUT
// ==========================================

window.logout = function () {
  location.reload();
};
// ==========================================
// SUBMIT ABSENSI
// ==========================================

window.submitAbsensi = function () {
  const namaInput = document.getElementById("inputNama").value.trim();
  const kelas = document.getElementById("inputKelas").value;
  const ket = document.getElementById("inputKeterangan").value;

  if (!namaInput || !kelas) {
    alert("Lengkapi data terlebih dahulu!");
    return;
  }

  const namaClean = namaInput.toLowerCase().replace(/\s+/g, " ");

  const tanggal = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const tanggalFilter = new Date().toISOString().split("T")[0];

  push(ref(db, "absensi_sd"), {
    nama: namaInput,
    namaClean,
    kelas,
    ket,
    tanggal,
    tanggalFilter
  })
  .then(() => {
    alert("Absensi berhasil dikirim!");

    document.getElementById("inputNama").value = "";
    document.getElementById("inputKelas").value = "";
  })
  .catch((error) => {
    alert("Gagal mengirim absensi: " + error.message);
  });
};

// ==========================================
// LOAD ABSENSI
// ==========================================

window.loadAbsensi = function () {

  const filterInput = document.getElementById("filterTanggal");

  if (!filterInput) return;

  const tanggalTerpilih = filterInput.value;

  if (!tanggalTerpilih) return;

  const semuaBody = {
    "1": document.getElementById("tableBody1"),
    "2": document.getElementById("tableBody2"),
    "3": document.getElementById("tableBody3"),
    "4": document.getElementById("tableBody4"),
    "5": document.getElementById("tableBody5"),
    "6": document.getElementById("tableBody6")
  };

  Object.values(semuaBody).forEach(body => {
    if (body) body.innerHTML = "";
  });

  onValue(ref(db, "absensi_sd"), (snapshot) => {

    Object.values(semuaBody).forEach(body => {
      if (body) body.innerHTML = "";
    });

    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let total = 0;

    let siswa = {};

    window.allAbsensiData = snapshot.val() || {};

    const dataSemua = snapshot.val();

    if (!dataSemua) {
      document.getElementById("jumlahHadir").innerText = 0;
      document.getElementById("jumlahIzin").innerText = 0;
      document.getElementById("jumlahSakit").innerText = 0;
      document.getElementById("jumlahTotal").innerText = 0;
      return;
    }

    Object.keys(dataSemua).forEach((key) => {

      const data = dataSemua[key];

      if (!data) return;

      if (data.tanggalFilter !== tanggalTerpilih) return;

      total++;

      if (data.ket === "Hadir") hadir++;
      if (data.ket === "Izin") izin++;
      if (data.ket === "Sakit") sakit++;

      const namaClean =
        data.namaClean ||
        data.nama.toLowerCase().trim().replace(/\s+/g, " ");

      const kelas = data.kelas || "1";

      const gabungan = `${namaClean}-${kelas}`;

      if (!siswa[gabungan]) {
        siswa[gabungan] = {
          nama: data.nama,
          namaClean,
          kelas,
          keysHariIni: []
        };
      }

      siswa[gabungan].keysHariIni.push(key);
    });

    document.getElementById("jumlahHadir").innerText = hadir;
    document.getElementById("jumlahIzin").innerText = izin;
    document.getElementById("jumlahSakit").innerText = sakit;
    document.getElementById("jumlahTotal").innerText = total;

    Object.keys(siswa).forEach((kunci) => {

      const data = siswa[kunci];

      const row = document.createElement("tr");

      const stringKeys = data.keysHariIni.join(",");

      const namaAman = data.nama.replace(/'/g, "\\'");
      const namaCleanAman = data.namaClean.replace(/'/g, "\\'");

      row.innerHTML = `
        <td>${data.nama}</td>

        <td>
          <button onclick="lihatHistory('${namaAman}','${namaCleanAman}','${data.kelas}')">
            History
          </button>
        </td>

        <td class="kolom-aksi">
          <button
            style="background:#dc2626;color:white"
            onclick="hapusSiswaHariIni('${namaAman}','${stringKeys}')">
            Hapus
          </button>
        </td>
      `;

      const tujuan = semuaBody[data.kelas];

      if (tujuan) {
        tujuan.appendChild(row);
      }
    });

  });
};

// ==========================================
// AUTO LOAD TANGGAL
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  const filter = document.getElementById("filterTanggal");

  if (filter) {
    filter.addEventListener("change", loadAbsensi);
  }

});
// ==========================================
// HISTORY ABSENSI
// ==========================================

window.lihatHistory = function (namaTampilan, namaClean, kelas) {

  const modal = document.getElementById("historyModal");
  const historyNama = document.getElementById("historyNama");
  const historyBody = document.getElementById("historyBody");

  historyNama.innerText =
    `History ${namaTampilan} (Kelas ${kelas})`;

  let html = "";

  const semuaData = window.allAbsensiData || {};

  Object.keys(semuaData).forEach((key) => {

    const data = semuaData[key];

    if (!data || !data.nama) return;

    const dataNama =
      data.namaClean ||
      data.nama.toLowerCase().trim().replace(/\s+/g, " ");

    const dataKelas = data.kelas || "1";

    if (
      dataNama === namaClean &&
      dataKelas === kelas
    ) {
      html += `
        <tr>
          <td>${data.tanggal}</td>
          <td><b>${data.ket}</b></td>
        </tr>
      `;
    }

  });

  if (html === "") {
    html = `
      <tr>
        <td colspan="2">
          Tidak ada riwayat absensi
        </td>
      </tr>
    `;
  }

  historyBody.innerHTML = html;
  modal.classList.remove("hidden");
};

// ==========================================
// TUTUP HISTORY
// ==========================================

window.tutupHistory = function () {

  const modal =
    document.getElementById("historyModal");

  modal.classList.add("hidden");
};

// ==========================================
// HAPUS DATA
// ==========================================

window.hapusSiswaHariIni = function (
  nama,
  stringKeys
) {

  if (!stringKeys) {
    alert("Data tidak ditemukan.");
    return;
  }

  if (
    !confirm(
      `Yakin ingin menghapus absensi ${nama}?`
    )
  ) {
    return;
  }

  const keysArray = stringKeys.split(",");

  const promises = keysArray.map((key) => {
    return remove(
      ref(db, "absensi_sd/" + key)
    );
  });

  Promise.all(promises)
    .then(() => {
      alert(
        "Data absensi berhasil dihapus."
      );
    })
    .catch((err) => {
      alert(
        "Gagal menghapus: " +
        err.message
      );
    });
};

// ==========================================
// DOWNLOAD EXCEL
// ==========================================

window.downloadExcel = function () {

  const semuaData =
    window.allAbsensiData || {};

  if (
    Object.keys(semuaData).length === 0
  ) {
    alert(
      "Tidak ada data untuk didownload!"
    );
    return;
  }

  let listData = [];

  Object.keys(semuaData).forEach((key) => {

    const data = semuaData[key];

    if (!data) return;

    listData.push({
      nama: data.nama,
      kelas: parseInt(data.kelas) || 1,
      tanggal: data.tanggal,
      ket: data.ket
    });

  });

  // Urut Kelas 1 → 6

  listData.sort((a, b) => {

    if (a.kelas !== b.kelas) {
      return a.kelas - b.kelas;
    }

    return a.nama.localeCompare(
      b.nama
    );

  });

  let csv =
    "Nama;Kelas;Tanggal;Keterangan\n";

  listData.forEach((item) => {

    csv +=
      `"${item.nama}";` +
      `"Kelas ${item.kelas}";` +
      `"${item.tanggal}";` +
      `"${item.ket}"\n`;

  });

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type:
        "text/csv;charset=utf-8;"
    }
  );

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(blob);

  link.download =
    "absensi_sd.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
};

// ==========================================
// CEK FIREBASE
// ==========================================

console.log(
  "Absensi SD siap digunakan"
);