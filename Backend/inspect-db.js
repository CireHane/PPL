import dotenv from 'dotenv';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

dotenv.config({ path: './.env' });

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const inspectDatabase = async () => {
    try {
        console.log("🔍 Connecting to Firebase...");
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        console.log(`📦 Project: ${process.env.FIREBASE_PROJECT_ID}\n`);
        
        // Query the 'product' collection
        const productsRef = collection(db, "product");
        const querySnapshot = await getDocs(productsRef);
        
        if (querySnapshot.empty) {
            console.log("❌ No products found in database.");
        } else {
            console.log(`✅ Found ${querySnapshot.size} product(s):\n`);
            querySnapshot.forEach((doc) => {
                console.log(`📄 Document ID (SKU): ${doc.id}`);
                console.log(`   Data: ${JSON.stringify(doc.data(), null, 2)}\n`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error connecting to Firestore:", error.message);
        process.exit(1);
    }
};

inspectDatabase();
