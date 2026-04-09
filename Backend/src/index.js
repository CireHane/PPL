import dotenv from 'dotenv';
import app from './app.js';
import { getInbound, addInbound, getOutbound, initializeFirebaseApp, addProduct, getProduct, inspectFirestore } from './config/firebase.js';

const x = dotenv.config({
    path: './.env'
});

const startServer = async () => {
    try{        
        console.log(process.env.PORT);
        initializeFirebaseApp()
        
        // Collection validation test
        // inspectFirestore();
        
        // Upload Product Test
        // uploadFirestoreProduct({sku:"SKU003-M", qty:10, rak:"Rak21"});

        // Collection query test
        // getFirestoreProduct();

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });
        
        app.post('/inbound', async (req, res) => {
            let data = await getInbound(req.body.sku, req.body.rak, req.body.qty, req.body.type);

            res.send(data);
        });

        app.post('/inbound-add', async (req, res) => {
            let data = {
                sku: req.body.sku, 
                rak: req.body.rak, 
                qty: req.body.qty, 
                type: req.body.type};

            await addInbound(data);
            
            res.send(JSON.stringify(data));
        });
        
        app.post('/outbound', async (req, res) => {
            let data = await getOutbound(req.body.sku, req.body.rak, req.body.qty, req.body.resi, req.body.channel);

            res.send(data);
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