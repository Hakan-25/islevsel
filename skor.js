// --- SKOR.JS (Veritabanı Beyni) ---

// 1. SENİN FIREBASE BİLGİLERİN
const firebaseConfig = {
    apiKey: "AIzaSyBW8xNsDjp3duXyuPukuBKNlOYw-uv6W1c",
    authDomain: "hakantools-a44c0.firebaseapp.com",
    projectId: "hakantools-a44c0",
    storageBucket: "hakantools-a44c0.firebasestorage.app",
    messagingSenderId: "216753237718",
    appId: "1:216753237718:web:ea012c7dc4fdb7e7d72377",
    measurementId: "G-4GWK9BS40T"
};

// Firebase'i Başlat (Compat Modu)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 2. KULLANICI GİRİŞ KONTROLÜ
window.addEventListener('load', () => {
    // Modal HTML'de var mı kontrol et
    const modal = document.getElementById('login-modal');
    if(!modal) return;

    // Tarayıcıda kayıtlı ID var mı?
    const kayitliID = localStorage.getItem('hakan_flappy_uid');
    
    if (kayitliID) {
        // Varsa modalı gizle, oyuna devam et
        console.log("Kullanıcı bulundu:", kayitliID);
        modal.classList.add('hidden');
        document.getElementById('start-msg').style.display = 'block';
        verileriGuncelle(kayitliID);
    } else {
        // Yoksa modal açık kalsın
        console.log("Yeni kullanıcı, isim bekleniyor...");
    }
});

// "BAŞLA" BUTONU FONKSİYONU
function kullaniciKaydet() {
    const isimInput = document.getElementById('nickname-input');
    const isim = isimInput.value.trim();

    if (isim === "") { alert("Lütfen bir isim yaz!"); return; }

    // Eski skorları al (Varsa)
    const eskiBest = parseInt(localStorage.getItem('flappy_best')) || 0;
    const eskiCoins = parseInt(localStorage.getItem('flappy_coins')) || 0;

    // Veritabanına yaz
    db.collection("leaderboard").add({
        name: isim,
        score: eskiBest,
        coins: eskiCoins,
        date: new Date().toLocaleString('tr-TR')
    })
    .then((docRef) => {
        // ID'yi kaydet
        localStorage.setItem('hakan_flappy_uid', docRef.id);
        
        // Ekranı aç
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('start-msg').style.display = 'block';
    })
    .catch((error) => {
        console.error("Hata:", error);
        alert("Bağlantı hatası: " + error.message);
    });
}

// VERİLERİ ÇEK
function verileriGuncelle(uid) {
    db.collection("leaderboard").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            localStorage.setItem('flappy_best', data.score);
            localStorage.setItem('flappy_coins', data.coins || 0);
            
            if(document.getElementById('best-score')) 
                document.getElementById('best-score').innerText = data.score;
            if(document.getElementById('total-coins'))
                document.getElementById('total-coins').innerText = data.coins || 0;
        }
    });
}

// 3. OYUN SONU KAYDETME
function skoruDatabaseYaz(yeniSkor, toplamPara) {
    const uid = localStorage.getItem('hakan_flappy_uid');
    if (!uid) return;

    const docRef = db.collection("leaderboard").doc(uid);

    db.runTransaction((transaction) => {
        return transaction.get(docRef).then((sfDoc) => {
            if (!sfDoc.exists) throw "Kullanıcı yok!";

            const veri = sfDoc.data();
            const eskiBest = veri.score || 0;
            
            let kaydedilecek = eskiBest;
            if (yeniSkor > eskiBest) {
                kaydedilecek = yeniSkor;
            }

            transaction.update(docRef, {
                score: kaydedilecek,
                coins: toplamPara,
                date: new Date().toLocaleString('tr-TR')
            });
            return kaydedilecek;
        });
    }).then((yeniRekor) => {
        console.log("Skor kaydedildi. Yeni Rekor:", yeniRekor);
        document.getElementById('best-score').innerText = yeniRekor;
    }).catch((err) => console.error("Skor hatası:", err));
}
