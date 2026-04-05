import dotenv from 'dotenv';
import app from './app.js';
import { initializeFirebaseApp, uploadFirestoreProduct, getFirestoreProduct, inspectFirestore } from './config/firebase.js';

const x = dotenv.config({
    path: './.env'
});

const startServer = async () => {
    try{
        console.log(process.env.PORT);
        initializeFirebaseApp()
        
        console.log("Success");
        // Collection validation test
        inspectFirestore();
        
        // Upload Product Test
        // uploadFirestoreProduct({sku:"SKU003-M", qty:10, rak:"Rak21"});

        // Collection query test
        getFirestoreProduct();
        
        app.get('/', (req, res) => {
          res.send('Hello World!');
        });
        
        app.on('error', (e) => {
            console.log(e);
        });

        app.listen(process.env.PORT, () => {
          console.log(`Example app listening on port ${process.env.PORT}`);
        });

        
    }
    catch(e){
        console.log(e);
    }
}

startServer();