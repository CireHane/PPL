// firebase.js //
// Module with function for firebase & firestore //

import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, onSnapshot, query, doc, where, getDocs } from "firebase/firestore";

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


const getFirestoreProduct = async () => {
    try{
        let products = [];
        
        const q = query(
            collection(db, "product")
        );
    
        const qSnapshot = await onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = {"sku": doc.id, "qty": doc.data().qty, "rak":doc.data().rak};
                products.push(data);
                console.log(data);
            });
        });
        return(products);
    }
    catch(error){
        console.log(error.message);
    }
}

const uploadFirestoreProduct = async (data) => {
    try{
        console.log(data.sku);
        console.log(data.qty);
        console.log(data.rak);
        const document = doc(db, "product", data.sku);
        await setDoc(document, {
            qty: data.qty,
            rak: data.rak
        });
    }
    catch(error){
        console.log(error.message);
    }
}

// ========== INBOUND FUNCTIONS ==========
const getInbound = async () => {
    try{
        let inboundData = [];
        const q = query(collection(db, "Inbound"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            inboundData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return inboundData;
    }
    catch(e){
        console.error("Error fetching Inbound:", e);
    }
}

const getInboundByType = async (type) => {
    try{
        let inboundData = [];
        const q = query(
            collection(db, "Inbound"),
            where("Type", "==", type)
        );
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            inboundData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return inboundData;
    }
    catch(e){
        console.error("Error fetching Inbound by type:", e);
    }
}

const addInbound = async (data) => {
    try{
        const document = doc(db, "Inbound");
        await setDoc(document, {
            SKU: data.SKU,
            Rak: data.Rak,
            Qty: data.Qty,
            Timestamp: new Date(),
            Type: data.Type // "Single" or "Batch"
        });
        console.log("Inbound document added successfully");
    }
    catch(e){
        console.error("Error adding Inbound:", e);
    }
}

// ========== OUTBOUND FUNCTIONS ==========
const getOutbound = async () => {
    try{
        let outboundData = [];
        const q = query(collection(db, "Outbound"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            outboundData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return outboundData;
    }
    catch(e){
        console.error("Error fetching Outbound:", e);
    }
}

const addOutbound = async (data) => {
    try{
        const document = doc(db, "Outbound");
        await setDoc(document, {
            Resi: data.Resi,
            SKU: data.SKU,
            Rak: data.Rak,
            Qty: data.Qty,
            Timestamp: new Date(),
            Channel: data.Channel
        });
        console.log("Outbound document added successfully");
    }
    catch(e){
        console.error("Error adding Outbound:", e);
    }
}

// ========== STOCK FUNCTIONS ==========
// TODO: getStock(), addStock(data), updateStock(sku, data)

// ========== RAK FUNCTIONS ==========
// TODO: getRak(), getRakByName(rak)

// ========== BARANG RETUR FUNCTIONS ==========
// TODO: getBarangRetur(), addBarangRetur(data)

// ========== WAREHOUSE LOG FUNCTIONS ==========
// TODO: getWarehouseLog(), addWarehouseLog(data)

// module.exports = {
export {initializeFirebaseApp};
export {getFirebaseApp};
export {inspectFirestore};
export {getFirestoreProduct};
export {uploadFirestoreProduct};
export {getInbound};
export {getInboundByType};
export {addInbound};
export {getOutbound};
export {addOutbound};
// };