// firebase.js //
// Module with function for firebase & firestore //

import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, onSnapshot, query, doc } from "firebase/firestore";

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
        app = initializeApp(firebaseConfig());
        db = getFirestore(app);
        return app;
    }
    catch (e){
        console.log(e);
    }
};

const getFirebaseApp = () => app;

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
    catch(e){
        console.log(e);
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
    catch(e){
        console.log(e);
    }
}

// module.exports = {
export {initializeFirebaseApp};
export {getFirebaseApp};
export {getFirestoreProduct};
export {uploadFirestoreProduct};
// };