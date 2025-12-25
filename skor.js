// -----------------------------------------------------------
// 1. FIREBASE AYARLARI (Senin Bilgilerin Yerleştirildi)
// -----------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBW8xNsDjp3duXyuPukuBKNlOYw-uv6W1c",
    authDomain: "hakantools-a44c0.firebaseapp.com",
    projectId: "hakantools-a44c0",
    storageBucket: "hakantools-a44c0.firebasestorage.app",
    messagingSenderId: "216753237718",
    appId: "1:216753237718:web:ea012c7dc4fdb7e7d72377",
    measurementId: "G-4GWK9BS40T"
};

// Firebase başlatma kontrolü (Compat Sürüm)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// -----------------------------------------------------------
// 2. KULLANICI YÖNETİMİ VE MODAL
// -----------------------------------------------------------
window.addEventListener('load', () => {
    // Sadece flaapy.html'de çalışıyorsak ve modal varsa bu kod çalışsın
    const modal = document.getElementById('login-modal');
    if(!modal) return;

    // Tarayıcı hafızasında kayıtlı ID var mı?
    const kayitliID = localStorage.getItem('hakan_flappy_uid');
    
    if (kayitliID) {
        // Zaten kayıtlıysa modalı gizle, oyuna başla
        console.log("Kullanıcı tekrar geldi:", kayitliID);
        modal.classList.add('hidden');
        
        const startMsg = document.getElementById('start-msg');
        if(startMsg) startMsg.style.display = 'block';
        
        // Verileri çek
        verileriGuncelle(kayitliID);
    } else {
        console.log("Yeni kullanıcı, isim bekleniyor...");
    }
});

// "BAŞLA" butonuna basınca çalışacak fonksiyon
function kullaniciKaydet() {
    const isimInput = document.getElementById('nickname-input');
    const isim = isimInput.value.trim();

    if (isim === "") { 
        alert("Lütfen bir isim yaz!"); 
        return; 
    }

    // Varsa eski skorları al (Migration)
    const eskiBest = parseInt(localStorage.getItem('flappy_best')) || 0;
    const eskiCoins = parseInt(localStorage.getItem('flappy_coins')) || 0;

    // Veritabanına yeni kayıt ekle
    db.collection("leaderboard").add({
        name: isim,
        score: eskiBest,
        coins: eskiCoins,
        date: new Date().toLocaleString('tr-TR')
    })
    .then((docRef) => {
        // ID'yi kaydet
        localStorage.setItem('hakan_flappy_uid', docRef.id);
        
        // Ekranı temizle
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('start-msg').style.display = 'block';
        console.log("Kayıt başarılı! ID:", docRef.id);
    })
    .catch((error) => {
        console.error("Hata:", error);
        alert("Hata oluştu: " + error.message);
    });
}

// Veritabanından son puanları çekip ekrana yazar
function verileriGuncelle(uid) {
    db.collection("leaderboard").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Yerel hafızayı güncelle
            localStorage.setItem('flappy_best', data.score);
            localStorage.setItem('flappy_coins', data.coins || 0);
            
            // Ekrandaki sayıları güncelle
            if(document.getElementById('best-score')) 
                document.getElementById('best-score').innerText = data.score;
            if(document.getElementById('total-coins'))
                document.getElementById('total-coins').innerText = data.coins || 0;
        }
    });
}

// -----------------------------------------------------------
// 3. SKOR KAYDETME (Oyun Bittiğinde Otomatik Çalışır)
// -----------------------------------------------------------
function skoruDatabaseYaz(yeniSkor, toplamPara) {
    const uid = localStorage.getItem('hakan_flappy_uid');
    
    // Eğer kullanıcı ID'si yoksa (Hata durumu), kaydetme
    if (!uid) return;

    const docRef = db.collection("leaderboard").doc(uid);

    // Güvenli güncelleme (Transaction)
    db.runTransaction((transaction) => {
        return transaction.get(docRef).then((sfDoc) => {
            if (!sfDoc.exists) throw "Kullanıcı veritabanında bulunamadı!";

            const veri = sfDoc.data();
            const eskiBest = veri.score || 0;
            
            // Sadece YENİ REKOR kırıldıysa skoru güncelle
            let kaydedilecekSkor = eskiBest;
            if (yeniSkor > eskiBest) {
                kaydedilecekSkor = yeniSkor;
            }

            // Veriyi yaz
            transaction.update(docRef, {
                score: kaydedilecekSkor,
                coins: toplamPara, // Para her zaman güncellenir
                date: new Date().toLocaleString('tr-TR')
            });
            
            return kaydedilecekSkor;
        });
    }).then((yeniRekor) => {
        console.log("Database güncellendi. Yeni Rekor:", yeniRekor);
        // Ekrana yansıt
        const bestScoreEl = document.getElementById('best-score');
        if(bestScoreEl) bestScoreEl.innerText = yeniRekor;
    }).catch((err) => {
        console.error("Skor kaydedilemedi:", err);
    });
}
