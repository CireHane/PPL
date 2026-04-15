// firebase.js //
// Module with function for firebase & firestore //
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, addDoc, query, doc, where, getDocs, getDoc, runTransaction } from 'firebase/firestore';


const firebaseConfig = () =>{
    return {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    }
};

let app;
let db;

const initializeFirebaseApp = () => {
    try{
        console.log("🔍 Connecting to Firebase...");
        app = initializeApp(firebaseConfig());
        db = getFirestore(app);
        console.log(`📦 Project: ${process.env.FIREBASE_PROJECT_ID}\n`);
        return app;
    }
    catch (e){
        console.log(e);
    }
};

const getFirebaseApp = () => app;


const inspectFirestore = async (collectionName = "product") => {
    try {        
        // Query the 'product' collection
        const productsRef = collection(db, collectionName);
        const querySnapshot = await getDocs(productsRef);
        
        if (querySnapshot.empty) {
            console.log("❌ No products found in database.");
            return;
        } 
        
        console.log(`✅ Found ${querySnapshot.size} ${collectionName}(s):\n`);
        querySnapshot.forEach((doc) => {
            console.log(`📄 Document ID (SKU): ${doc.id}`);
            console.log(`   Data: ${JSON.stringify(doc.data(), null, 2)}\n`);
        });
    } 
    catch (error) {
        console.error("❌ Error connecting to Firestore:", error.message);
        process.exit(1);
    }
};

const addStock = async (data) => {
    try{
        const docRef = doc(db, "Stock", `${data.sku}_${data.rak}`);
        const doc = await getDoc(document)
        
        if(doc.data()){
            console.log(`It Exist ${doc}`);
        }
        else{ // jika baru SKU dalam rak, maka buat document baru
            await setDoc(document, {
                sku: data.sku,
                rak: data.rak,
                qty: data.qty,
            });
        }
        console.log("Product document added successfully");
    }
    catch(error){
        console.log(error.message);
    }
}

// ========== INBOUND FUNCTIONS ==========
const getInbound = async (sku, rak, qty, type) => {
    try{
        let data = [];
        let q = collection(db, "Inbound");
        
        const conditions = [];

        if (sku) { // Fuzzy search SKU
            conditions.push(where("sku", ">=", sku)); 
            conditions.push(where('sku', '<=', sku+ '\uf8ff'));
        }
        if (rak){
            conditions.push(where("rak", ">=", rak)); 
            conditions.push(where('rak', '<=', rak+ '\uf8ff'));
        }
        if (qty) conditions.push(where("qty", "==", qty));
        if (type) conditions.push(where("type", "==", type));
        
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return data;
    }
    catch(e){
        console.error("Error fetching Inbound:", e);
    }
}

const addInbound = async (data) => {
    try{
        console.log(data);
        const document = collection(db, "Inbound");
        await addDoc(document, {
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
            timestamp: new Date(),
            type: data.type // "Single" or "Batch"
        });

        await addStock({
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
        })

        await addLogs({
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
            type: "inbound",
            timestamp: new Date(),
            description: `Automated Log: Inbound data ${data.sku} to ${data.rak}`
        });
        
        console.log("Inbound document added successfully");
    }
    catch(e){
        console.error("Error adding Inbound:", e);
    }
}

// ========== OUTBOUND FUNCTIONS ==========
const getOutbound = async (sku, rak, qty, resi, channel) => {
    try{
        let data = [];
        let q = collection(db, "Outbound");
        
        const conditions = [];

        if (sku) { // Fuzzy search SKU
            conditions.push(where("sku", ">=", sku)); 
            conditions.push(where('sku', '<=', sku+ '\uf8ff'));
        }
        if (rak){
            conditions.push(where("rak", ">=", rak)); 
            conditions.push(where('rak', '<=', rak+ '\uf8ff'));
        }
        if (qty) conditions.push(where("qty", "==", qty));
        if (resi){
            conditions.push(where("resi", ">=", resi)); 
            conditions.push(where('resi', '<=', resi+ '\uf8ff'));
        }
        if (channel){
            conditions.push(where("channel", ">=", channel)); 
            conditions.push(where('channel', '<=', channel+ '\uf8ff'));
        }
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return data;
    }
    catch(e){
        console.error("Error fetching Outbound:", e);
    }
}

const addOutbound = async (data) => {
    try{
        const document = collection(db, "Outbound");
        await addDoc(document, {
            resi: data.resi,
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
            timestamp: new Date(),
            channel: data.channel
        });

        const logData = {
            sku: data.sku,
            rak: data.rak,
            qty: -data.qty,
            type: "Outbound",
            timestamp: new Date(),
            description: `Automated Log: Outbound data for ${data.qty} ${data.sku} from ${data.rak}`
        }
        await addLogs(logData);
        
        console.log("Outbound document added successfully");
    }
    catch(e){
        console.error("Error adding Outbound:", e);
    }
}

// ========== RAK FUNCTIONS ==========
const getRak = async (rak, cap) => {
    try{
        let data = [];
        let q = collection(db, "Rak");
        
        const conditions = [];

        if (rak){
            conditions.push(where("rak", ">=", rak)); 
            conditions.push(where('rak', '<=', rak+ '\uf8ff'));
        }
        if (cap) conditions.push(where("capacity", "<", cap));
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return data;
    }
    catch(e){
        console.error("Error fetching Rak:", e);
    }
}

const addRak = async (data) => {
    try{
        const document = collection(db, "Rak");
        await addDoc(document, {
            rak: data.rak,
            capacity: data.cap,
        });
        console.log("Rak document added successfully");
    }
    catch(e){
        console.error("Error adding Inbound:", e);
    }
}

// ========== BARANG RETUR FUNCTIONS ==========
const getRetur = async (sku, rak, qty, inv, channel) => {
    try{
        let data = [];
        let q = collection(db, "BarangRetur");
        
        const conditions = [];

        if (sku){
            conditions.push(where("sku", ">=", sku)); 
            conditions.push(where('sku', '<=', sku+ '\uf8ff'));
        }
        if (rak){
            conditions.push(where("rak_kembali", ">=", rak)); 
            conditions.push(where('rak_kembali', '<=', rak+ '\uf8ff'));
        }
        if (qty) conditions.push(where("capacity", "<", qty));
        if (inv){
            conditions.push(where("no_invoice", ">=", inv)); 
            conditions.push(where('no_invoice', '<=', inv+ '\uf8ff'));
        }
        if (channel){
            conditions.push(where("channel", ">=", channel)); 
            conditions.push(where('channel', '<=', channel+ '\uf8ff'));
        }
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return data;
    }
    catch(e){
        console.error("Error fetching Retur:", e);
    }
}

const addRetur = async (data) => {
    try{
        const document = collection(db, "BarangRetur");
        await addDoc(document, {
            no_invoice: data.inv,
            sku: data.sku,
            rak_kembali: data.rak,
            qty: data.qty,
            channel: data.channel,
            timestamp: new Date(),
            description: data.desc
        });
        console.log("Retur document added successfully");
    }
    catch(e){
        console.error("Error adding Inbound:", e);
    }
}

// ========== WAREHOUSE LOG FUNCTIONS ==========
const getLogs = async (sku, rak, qty, type) => {
    try{
        let data = [];
        let q = collection(db, "WarehouseLog");
        
        const conditions = [];

        if (sku){
            conditions.push(where("sku", ">=", sku)); 
            conditions.push(where('sku', '<=', sku+ '\uf8ff'));
        }
        if (rak){
            conditions.push(where("rak_kembali", ">=", rak)); 
            conditions.push(where('rak_kembali', '<=', rak+ '\uf8ff'));
        }
        if (qty) conditions.push(where("capacity", "<", qty));
        if (type) conditions.push(where("type", "==", type));
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return data;
    }
    catch(e){
        console.error("Error fetching Logs:", e);
    }
}

const addLogs = async (data) => {
    try{
        const document = collection(db, "WarehouseLog");
        await addDoc(document, {
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
            type: data.type,
            timestamp: new Date(),
            description: data.desc
        });
        console.log("Logs document added successfully");
    }
    catch(e){
        console.error("Error adding Logs:", e);
    }
}

// ========== STOCK FUNCTIONS ==========
const getStock =  async (sku, rak, qty) => {
    try{
        let data = [];
        let q = collection(db, "Product");
        
        const conditions = [];

        if (sku) { // Fuzzy search SKU
            conditions.push(where("sku", ">=", sku)); 
            conditions.push(where('sku', '<=', sku+ '\uf8ff'));
        }
        if (rak){
            conditions.push(where("rak", ">=", rak)); 
            conditions.push(where('rak', '<=', rak+ '\uf8ff'));
        }
        if (qty) conditions.push(where("qty", "==", qty));
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return data;
    }
    catch(error){
        console.log(error.message);
    }
}

const updateStock = async (sku, newQty) => {
    try{
        let updated = false;
        const q = query(
            collection(db, "Stock"),
            where("sku", "==", sku)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.error("Stock not found for SKU:", sku);
            return false;
        }
        
        querySnapshot.forEach(async (stockDoc) => {
            const stockRef = doc(db, "Stock", stockDoc.id);
            await setDoc(stockRef, {
                ...stockDoc.data(),
                qty: newQty
            });
            updated = true;
        });
        
        if (updated) {
            console.log("Stock updated successfully for SKU:", sku);
        }
        return updated;
    }
    catch(e){
        console.error("Error updating Stock:", e);
        return false;
    }
}

// ========== ATOMIC OUTBOUND TRANSACTION ==========
const createOutboundAtomicTransaction = async (resi, sku, rak, qty, channel) => {
    try {
        return await runTransaction(db, async (transaction) => {
            // Step 1: Find and read the stock document
            const q = query(
                collection(db, "Stock"),
                where("sku", "==", sku)
            );
            const stockSnapshot = await getDocs(q);
            
            if (stockSnapshot.empty) {
                throw new Error(`SKU "${sku}" not found in Stock`);
            }
            
            let stockDoc = null;
            let currentQty = 0;
            stockSnapshot.forEach((doc) => {
                stockDoc = doc;
                currentQty = doc.data().qty;
            });
            
            // Step 2: Validate that qty available >= requested qty
            if (currentQty < qty) {
                throw new Error(`INSUFFICIENT_STOCK:Available ${currentQty}, Requested ${qty}`);
            }
            
            // Step 3: Atomic operations (all or nothing)
            // Stock Deduction
            const newQty = currentQty - qty;
            transaction.update(doc(db, "Stock", stockDoc.id), {
                qty: newQty
            });
            
            // Create outbound record
            const outboundRef = doc(collection(db, "Outbound"));
            transaction.set(outboundRef, {
                resi: resi,
                sku: sku,
                rak: rak,
                qty: qty,
                timestamp: new Date(),
                channel: channel
            });
            
            return {
                success: true,
                outboundId: outboundRef.id,
                previousStock: currentQty,
                newStock: newQty
            };
        });
    }
    catch(e) {
        throw e;
    }
}

// export functions
export {initializeFirebaseApp};
export {getFirebaseApp};
export {inspectFirestore};
export {addStock};
export {getInbound};
export {addInbound};
export {getOutbound};
export {addOutbound};
export {getRak};
export {addRak};
export {getRetur};
export {addRetur};
export {getLogs};
export {addLogs};
export {getStock};
export {updateStock};
export {createOutboundAtomicTransaction};