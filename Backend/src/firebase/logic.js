// firebase.js //
// Module with function for firebase & firestore //
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, addDoc, query, doc, where, getDocs, getDoc, runTransaction, limit, or, and, orderBy, startAt, count, getCountFromServer } from 'firebase/firestore';


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


const inspectFirestore = async (collectionName = "Stock") => {
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

// ========== PRODUCT FUNCTIONS ==========
const getProduct =  async (sku) => {
    try{
        let data = [];
        let q = collection(db, "Product");
        
        const conditions = [];

        if (sku) {
            conditions.push(where("sku", ">=", sku)); 
            conditions.push(where('sku', '<=', sku+ '\uf8ff'));
        }
        conditions.push(limit(2))

        if(conditions.length > 0) q = query(q, ...conditions);
        
        const querySnapshot = await getDocs(q);
        
        let i = 1;
        querySnapshot.forEach((doc) => {
            data.push({
                sku: doc.sku,
                qty: doc.qty,
                name: doc.name
            });
        });

        return data;
    }
    catch(error){
        console.log(error);
    }
}

const addProduct = async (data) => {
    try{
        const { sku, qty, name } = data;
        
        if(sku === undefined || qty === undefined){
            return{
                success: false,
                error: `Input cannot be undefined: \n${data}`
            };
        }

        const result = await runTransaction(db, async (transaction) => {
            const docRef = doc(db, "Product", sku);

            const sfDoc = await transaction.get(docRef);
            if(!sfDoc.exists()){
                if(qty < 0){
                    return {
                        success: false,
                        error: "Data doesn't Exist"
                    };
                }
                
                transaction.set(docRef, {
                    sku: sku,
                    qty: qty,
                    name: "No Name",
                    lastUpdate: new Date()
                }, {merge:true});
            }
            else{
                const newQty = sfDoc.data().qty + qty;
                if(newQty < 0){
                    return{
                        success: false,
                        error: `${sku} when below`
                    };
                }
                transaction.update(docRef, {qty : newQty});
                transaction.update(docRef, {lastUpdate: new Date()});
            }
            return { success: true };
        });
    }
    catch(error){
        return { 
            success: false,
            error: error
        };
    }
}

const mockImg = [
    'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0t-mc9fphnxwlw911.jpg?v=1752737077&width=600',
    'http://odzaclassic.com/cdn/shop/files/id-11134207-7rbkd-m9zej8mr3ta35c.jpg?v=1747904168',
    'http://odzaclassic.com/cdn/shop/files/7f9d11c62031449bb8b576ae3eeb72ec_tplv-o3syd03w52-origin-jpeg_a59c3fcb-a75b-4777-a8c9-8859f34c24d7.jpg?v=1753949723',
    'http://odzaclassic.com/cdn/shop/files/2b371cbdb51f42d9aa405f86bd7bdaca_tplv-o3syd03w52-origin-jpeg.jpg?v=1753949633'
]
// ========== STOCK FUNCTIONS ==========
const getStock =  async (start, sku, order) => {
    try{
        const stockRef = collection(db, "Stock");
        let qProd = collection(db, "Product");
        
        const condition = [];

        if (sku){
            condition.push(where("sku", ">=", sku)); 
            condition.push(where('sku', '<=', sku + '\uf8ff')); 
        }

        const qMax = query(qProd, ...condition);
        const maxSnapshot = await getCountFromServer(qMax);
        
        switch(order){
            case 'highest':
                condition.push(orderBy("qty", "desc"));
                break;
            case 'lowest':
                condition.push(orderBy("qty"));
                break;
            case 'out':
                condition.push(where("qty", "==", 0));
                break;
            case 'recent':
            default:
                condition.push(orderBy("lastUpdate", "desc"));
                break;
        }

        
        const qVisible = query(qProd, ...condition);
        
        const documentSnapshots = await getDocs(qVisible);
        const lastVisible = documentSnapshots.docs[start];
        
        condition.push(limit(2));
        if(lastVisible) condition.push(startAt(lastVisible));
        qProd = query(qProd, ...condition);

        const querySnapshot = await getDocs(qProd);
        let i = 1;
        const max = maxSnapshot.data().count;
        const data = [];
        
        for (const doc of querySnapshot.docs){
            const rak = [];
            
            
            const qStock = query(stockRef, where("sku", "==", doc.data().sku))
            const rakSnapshot = await getDocs(qStock);
            
            rakSnapshot.forEach((doc) =>{
                rak.push({
                    location: doc.data().rak,
                    quantity: doc.data().qty
                });
            });
            
            data.push({
                id:String(i++),
                sku: doc.data().sku,
                name:"No Name Set",
                totalStock: doc.data().qty,
                images: [mockImg[i%mockImg.length]],
                racks: [...rak],
            });
        }
        return {
            success: true,
            result: {
                data: data,
                max: max
            }
        };
    }
    catch(error){
        console.log(error);
        return {
            success: false,
            error: error
        };
    }
}

const addStock = async (data) => {
    try{
        const { sku, rak, qty } = data;

        if(sku === undefined || rak === undefined || qty === undefined){ // Move validation to handler.js
            return{
                success: false,
                error: `Input cannot be undefined: \n${data}`
            };
        }
        
        const result = await runTransaction(db, async (transaction) => {
            const docRef = doc(db, "Stock", `${sku}_${rak}`);

            const sfDoc = await transaction.get(docRef);
            if(!sfDoc.exists()){
                if(qty === 0){
                    return {
                        success: false,
                        error: "New Data must have quantity more than 0"
                    };
                }
                else if(qty < 0){
                    return {
                        success: false,
                        error: "Data doesn't Exist"
                    };
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
                    return{
                        success: false,
                        error: `${sku} at ${rak} has ${sfDoc.data().qty}. operation tried to take ${qty}`
                    };
                }
                transaction.update(docRef, {qty : newQty});
            }

            // Update/Create Product as well
            await addProduct({
                sku: sku,
                qty: qty
            });
            
            return { success: true };
        });

        if(result.success){
            console.log("Stock document added successfully");
        }
        
        return result;
    }
    catch(error){
        console.error(error);
        return {
            success: false,
            error: `Add Stock Error: ${error}`
        };
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
        if (qty) conditions.push(where("qty", ">", qty));
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

        return {
            success: true,
            result: data
        };
    }
    catch(error){
        console.error("Error fetching Inbound:", error);
        return {
            success: false,
            error: error
        };
    }
}

const addInbound = async (data) => {
    try{
        const { sku, rak, qty, type, user } = data;
        
        const stock = await addStock({
            sku: sku,
            rak: rak,
            qty: qty,
        })

        if(!stock.success){
            return stock;
        }

        const snapshot = collection(db, "Inbound");
        await addDoc(snapshot, {
            sku: sku,
            rak: rak,
            qty: qty,
            timestamp: new Date(),
            type: type, // "Single" or "Batch"
            user: user

        });

        await addLogs({
            sku: sku,
            rak: rak,
            qty: qty,
            type: "Inbound",
            user: user,
            desc: `Automated Log: Inbound data ${qty} ${sku} to ${rak}`,
        });
        
        console.log("Inbound document added successfully");
        return{
            success: true
        };
    }
    catch(error){
        console.error("Error adding Inbound:", error);
        return{
            success: false,
            error: error
        };
    }
}

// ========== OUTBOUND FUNCTIONS ==========
const getOutbound = async (sku, rak, qty, resi, channel, startTime, endTime) => {
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
        if (qty) conditions.push(where("qty", ">", qty));
        if (resi){
            conditions.push(where("resi", ">=", resi)); 
            conditions.push(where('resi', '<=', resi+ '\uf8ff'));
        }
        if (channel){
            conditions.push(where("channel", ">=", channel)); 
            conditions.push(where('channel', '<=', channel+ '\uf8ff'));
        }
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
        return {
            success: true,
            result: data   
        };
    }
    catch(error){
        console.error("Error fetching Outbound:", error);
        return {
            success: false,
            error: error 
        };
    }
}

const addOutbound = async (data) => {
    try{
        const snapshot = collection(db, "Outbound");

        const { sku, rak, qty, channel, resi, user } = data;

        const stock = await addStock({
            sku:sku,
            rak:rak,
            qty:-qty
        })
        
        if(!stock.success){
            return stock;
        }

        await addDoc(snapshot, {
            resi: resi,
            sku: sku,
            rak: rak,
            qty: qty,
            timestamp: new Date(),
            channel: channel,
            user: user,
        });

        const logData = {
            sku: sku,
            rak: rak,
            qty: -qty,
            type: "Outbound",
            user: user,
            desc: `Automated Log: Outbound data for ${qty} ${sku} from ${rak}`
        }
        await addLogs(logData);
        
        console.log("Outbound document added successfully");
        return { success: true };
    }
    catch(error){
        console.error("Error adding Outbound:", e);
        return {
            success: true,
            error: error
        };
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
            conditions.push(where("rak", ">=", rak)); 
            conditions.push(where('rak', '<=', rak+ '\uf8ff'));
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
        const { inv, resi, sku, rak, qty, channel, user, desc, } = data;
        const document = collection(db, "BarangRetur");

        const stock = await addStock({
            sku: sku,
            rak: rak,
            qty: qty
        });
        
        if(!stock.success){
            return stock;
        }
        
        await addDoc(document, {
            no_invoice: inv,
            resi: resi,
            sku: sku,
            rak: rak,
            qty: qty,
            channel: channel,
            user: user,
            timestamp: new Date(),
            description: desc
        });

        const logData = {
            sku: sku,
            rak: rak,
            qty: qty,
            type: "Return",
            user: user,
            desc: `Automated Log: Item Return for ${qty} ${sku} from ${rak}`
        }
        await addLogs(logData);
        
        console.log("Retur document added successfully");
        return { success: true };
    }
    catch(error){
        console.error("Error adding Retur:", error);
        return{
            success: false,
            error: error
        };
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
const getLogs = async (skuRak, qty, type, user, startTime, endTime) => {
    try{
        let data = [];
        let q = collection(db, "WarehouseLog");
        
        const conditions = [];
        let con;
        if (skuRak){
            con = or(
                and(where("sku", ">=", skuRak), where('sku', '<=', skuRak + '\uf8ff')),
                and(where("rak", ">=", skuRak), where('rak', '<=', skuRak + '\uf8ff'))
            ); 
        }
        if (qty) conditions.push(where("capacity", "<", qty));
        if (type) conditions.push(where("type", "==", type));
        if (user) conditions.push(where("user", ">=", user), where('user', '<=', user + '\uf8ff'));
        if (startTime) conditions.push(where("timestamp", ">", new Date(startTime)));
        if (endTime) conditions.push(where("timestamp", "<", new Date(endTime)));
        
        if(conditions.length > 0){
            q = query(q,and(con, ...conditions));
        }
        
        const querySnapshot = await getDocs(q);
        let i = 1;
        querySnapshot.forEach((doc) => {
            const { sku, type, rak, description, qty, timestamp, user } = doc.data()
            data.push({
                id:String(i++),
                timestamp: timestamp.toDate(),
                sku: sku,
                rack: rak,
                qty: qty,
                action: type,
                operator: user,
                description: description,
                isReverted: false,
            });
        });
        return {
            success: true,
            result: data
        };
    }
    catch(error){
        console.error("Error fetching Logs:", error);
        return{
            success: false,
            error: error
        }
    }
}

const addLogs = async (data) => {
    try{
        const document = collection(db, "WarehouseLog");

        const { sku, rak, qty, type, user, desc } = data;
        
        await addDoc(document, {
            sku: sku,
            rak: rak,
            qty: qty,
            type: type,
            user: user,
            timestamp: new Date(),
            description: desc
        });
        console.log("Logs document added successfully");
    }
    catch(error){
        throw new Error(error);
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