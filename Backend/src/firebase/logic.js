// firebase.js //
// Module with function for firebase & firestore //
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, addDoc, query, doc, where, getDocs, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';


const firebaseConfig = () =>{
    return {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };
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
        const sku = data.sku;
        const rak = data.rak;
        const qty = data.qty;

        if(sku === undefined || rak === undefined || qty === undefined){ // Move validation to handler.js
            throw `Input cannot be undefined: \n${data}`;
        }
        
        await runTransaction(db, async (transaction) => {
            const docRef = doc(db, "Stock", `${sku}_${rak}`);

            const sfDoc = await transaction.get(docRef);
            if(!sfDoc.exists()){
                if(qty <= 0){
                    throw new Error("New Data must have quantity more than 0");
                }
                
                transaction.set(docRef, {
                    sku: sku,
                    rak: rak,
                    qty: qty,
                }, {merge:true});
            }
            else{
                const newQty = sfDoc.data().qty + qty;
                if(newQty < 0){
                    throw `${sku} at ${rak} has ${sfDoc.data().qty}. operation tried to take ${qty}`;
                }
                transaction.update(docRef, {qty : newQty})
            }
        });
        console.log("Product document added successfully");
    }
    catch(error){
        console.error(error);
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
        const rak = data.rak;
        const cap = data.cap;

        const docRef = doc(db, "Rak", rak);
        const document = await getDoc(docRef);
        if(document.exists()){
            throw `Rack ${rak} already exists`;
        }

        await setDoc(docRef, {
            rak: rak,
            capacity: cap,
        });
        console.log("Rak document added successfully");
    }
    catch(e){
        console.error("Error adding Inbound:", e);
    }
}

// ========== INBOUND FUNCTIONS ==========
const getInbound = async (sku, rak, qty, type, startTime, endTime) => {
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
        if (startTime) conditions.push(where("timestamp", ">", startTime));
        if (endTime) conditions.push(where("timestamp", "<", endTime));
        
        
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

        const sku = data.sku;
        const rak = data.rak;
        const qty = data.qty;
        const type = data.type;

        if(sku === undefined || rak === undefined || qty === undefined || type === undefined){ // Move validation to handler.js
            throw `Input cannot be undefined: \n${data}`;
        }
        
        await addStock({
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
        })

        const snapshot = collection(db, "Inbound");
        await addDoc(snapshot, {
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
            timestamp: serverTimestamp(),
            type: data.type // "Single" or "Batch"
        });


        await addLogs({
            sku: data.sku,
            rak: data.rak,
            qty: data.qty,
            type: "Inbound",
            desc: `Automated Log: Inbound data ${data.qty} ${data.sku} to ${data.rak}`
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
        const snapshot = collection(db, "Outbound");

        const { sku, rak, qty, channel, resi } = data;

        await addStock({
            sku:sku,
            rak:rak,
            qty:-qty
        })
        
        await addDoc(snapshot, {
            resi: resi,
            sku: sku,
            rak: rak,
            qty: qty,
            timestamp: serverTimestamp(),
            channel: channel
        });

        const logData = {
            sku: sku,
            rak: rak,
            qty: -qty,
            type: "Outbound",
            desc: `Automated Log: Outbound data for ${qty} ${sku} from ${rak}`
        }
        await addLogs(logData);
        
        console.log("Outbound document added successfully");
        
        return {
            success: true,
        };
    }
    catch(e){
        console.error("Error adding Outbound:", e);
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
        const { inv, sku, rak, qty, channel, desc, } = data;
        const document = collection(db, "BarangRetur");

        await addStock({
            sku: sku,
            rak: rak,
            qty: qty
        });
        
        await addDoc(document, {
            no_invoice: inv,
            sku: sku,
            rak_kembali: rak,
            qty: qty,
            channel: channel,
            timestamp: serverTimestamp(),
            description: desc
        });

        const logData = {
            sku: sku,
            rak: rak,
            qty: qty,
            type: "Return",
            desc: `Automated Log: Item Return for ${qty} ${sku} from ${rak}`
        }
        await addLogs(logData);

        console.log("Retur document added successfully");
    }
    catch(error){
        console.error("Error adding Retur:", error);
    }
}

/** ========== WAREHOUSE LOG FUNCTIONS ==========
 * Queary Warehouse logs
 * @param {string} sku - Target SKU
 * @param {string} rak - Target Rack
 * @param {int} qty - Quantity of stock at rak
 * @param {string} type - log type (Inbound, Outbound, Adjusment, Rak-Transfer)
 * @param {Date} startTime - query start from ...
 * @param {Date} endTime - query before  ...
 * @param {string} password - Plain text password
 * @returns {Promise<{success: boolean, user?: {id, username, email}, error?: string}>}
 */
const getLogs = async (sku, rak, qty, type, startTime, endTime) => {
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
        if (startTime) conditions.push(where("timestamp", ">", startTime));
        if (endTime) conditions.push(where("timestamp", "<", endTime));
        
        if(conditions.length > 0){
            q = query(q, ...conditions);
        }
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            data.push({
                ...doc.data()
            });
        });
        return {
            success: true,
            data: data
        };
    }
    catch(e){
        return { success: true };
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
            timestamp: serverTimestamp(),
            description: data.desc
        });
        console.log("Logs document added successfully");
    }
    catch(error){
        throw new Error(error);
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

// export functions
export {initializeFirebaseApp};
export {getFirebaseApp};
export {inspectFirestore};
export {addStock};
export {getRak};
export {addRak};
export {getInbound};
export {addInbound};
export {getOutbound};
export {addOutbound};
export {getRetur};
export {addRetur};
export {getLogs};
export {addLogs};
export {getStock};