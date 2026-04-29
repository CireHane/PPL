// firebase.js //
// Module with function for firebase & firestore //
import { or } from 'firebase/firestore';
import {initializeFirebaseApp,
        getFirebaseApp,
        inspectFirestore,
        addStock,
        getInbound,
        addInbound,
        getOutbound,
        addOutbound,
        getRak,
        addRak,
        getRetur,
        addRetur,
        getLogs,
        addLogs,
        getStock,
    } from './logic.js'

    
/**
 * Firestore Add to Stock Collection
 * POST /firebase/stock-add
 * Body: { 
 *  sku: string,
 *  order: string (highest || lowest || out || recent)
 * }
 */
export const stock = async (req, res) => {
    const { start, sku, order } = req.body;
    const data = await getStock(start, sku, order);

    if (!data.success){
        res.status(400).send(data);
    }
    
    res.status(200).send(data);
};

/**
 * Firestore Add to Stock Collection
 * POST /firebase/stock-add
 * Body: { 
 *  sku: string,
 *  rak: stirng,
 *  qty: int
 * }
 */
export const stockAdd = async (req, res) => {
    const data = await addStock({
        sku: req.body.sku,
        rak: req.body.rak,
        qty: req.body.qty
    });
    res.send(data);
};

/**
 * Firestore Add Rak
 * POST /firebase/rak-add
 * Body: { 
 *  rak: stirng,
 *  cap: int
 * }
 */
export const rakAdd = async (req, res) => {
    const data = await addRak({
        rak: req.body.rak,
        cap: req.body.cap
    });
    res.send(data);
};

/**
 * Firestore Get inbound data
 * POST /firebase/inbound
 * Body: { 
 *  "sku":String,
 *  "rak":String,
 *  "qty":int,
 *  "type":Stirng,
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const inboundHandler = async (req, res) => {
    const {sku, rak, qty, type, startTime, endTime} = req.body;
    const quantity = parseInt(qty);

    const data = await getInbound(sku, rak, quantity, type, startTime, endTime);

    if(!data.success){
        res.status(400).send({
            success: false,
            error: data.error
        });
    }
    
    res.status(200).send({
        success: true,
        result: data.result
    });
};

export const inboundAddHandler = async (req, res) => { 
    try{

        const { sku, rak, qty, type, user } = req.body;
    
        if (!sku || !rak || !qty || !type || !user) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }
    
        // Validation: qty must be positive number
        if (typeof qty !== 'number' || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: "Qty must be a positive number greater than 0"
            });
        }
    
        // Validation: sku not empty
        if (sku.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "SKU cannot be empty"
            });
        }
    
        // Validation: sku not empty
        if (rak.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Rak cannot be empty"
            });
        }
        
        const data = {
            sku: sku, 
            rak: rak, 
            qty: qty, 
            type: type,
            user: user,
        };
    
        const result = await addInbound(data);

        if(!result.success){
            res.status(400).send(result);
        }
    
        res.send(JSON.stringify(data));
    }
    catch(error){
        console.error("Error in /inbound-add:", e);
        res.status(500).send({
            success: false,
            error: error
        });
    }
};


/**
 * Firestore Upload multiple Inbound data
 * POST /firebase/inbound-adds
 * Body: { 
 *  "items":InboundItem[],
 *  "suratJalan": string,
 *  "user": string
 * }
 */
export const inboundAddsHandler = async (req, res) => {
    
    const { items, suratJalan, user } = req.body;
    const len = items.length;

    if (len === 0 || !user || !suratJalan) {
        return res.status(400).json({
            success: false,
            error: "undefined cannot be input"
        });
    }
    
    for(let i=0; i<len; i++){
        const { sku, rack, qty } = items[i];

        if (!sku || !rack || !qty ) {
            return res.status(400).json({
                success: false,
                error: `Missing required input fields on item ${i}`
            });
        }
    
        if (typeof qty !== 'number' || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: `Qty must be a positive number greater than 0, found on item ${i}`
            });
        }
    }

    for(let i=0; i<len; i++){
        const { sku, rack, qty, id } = items[i];

        const data = {
            sku: sku,
            rak: rack,
            qty: qty,
            type: "Bulk",
            user: user,
            suratJalan: suratJalan,
        }

        const result = await addInbound(data);
        if(!result.success) {
            continue;
        }
    }
    
    res.status(201).send({ 
        success: true
     });
}
        
/**
 * Firestore Get Outbound data
 * POST /firebase/inbound
 * Body: { 
 *  "channel":Stirng
 *  "resi":String
 *  "sku":String
 *  "rak":String
 *  "qty":int
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const outboundHandler = async (req, res) => {
    const {sku, rak, qty, resi, channel, startTime, endTime} = req.body;
    const quantity = parseInt(qty);

    const data = await getOutbound(sku, rak, quantity, resi, channel, startTime, endTime);

    if(!data.success){
        res.status(400).send(data);
    }

    res.status(200).send(data);
};

export const outboundAddHandler = async (req, res) => {
    try {
        const { resi, sku, rak, qty, channel, user } = req.body;

        // Validation: Required fields
        if (!resi || !sku || !rak || !qty || !channel || !user) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        // Validation: resi not empty/whitespace
        if (resi.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Resi cannot be empty or whitespace"
            });
        }

        // Validation: qty must be positive number
        if (typeof qty !== 'number' || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: "Qty must be a positive number greater than 0"
            });
        }

        // Validation: sku not empty
        if (sku.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "SKU cannot be empty"
            });
        }

        // Atomic transaction: deduct stock + create outbound
        const result = await addOutbound({
            resi:resi,
            sku:sku,
            rak:rak,
            qty:qty,
            channel:channel,
            user: user,
        });

        if(!result.success){
            res.status(400).send(result);
        }

        return res.json({
            success: true,
            message: "Outbound created and stock updated (atomic transaction)",
            data: {
                resi: resi,
                sku: sku,
                qty: qty,
            }
        });
    }
    catch(error) {
        console.error("Error in /outbound-add:", error);
                
        // Check if it's insufficient stock error
        if (error.message.includes("INSUFFICIENT_STOCK")) {
            const parts = error.message.split(":");
            return res.status(409).json({
                success: false,
                error: "Conflict: " + parts[1]
            });
        }
                
        // SKU not found
        if (error.message.includes("not found in Stock")) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
                
        // Other errors
        res.status(500).json({
            success: false,
            error: "Server error: " + error.message
        });
    }
};

/**
 * Firestore Upload multiple Outbound data
 * POST /firebase/outbound-adds
 * Body: { 
 *  "items":OutboundItems[],
 *  "user":String
 * }
 */
export const outboundAddsHandler = async (req, res) => {
    try {
        const { items, user } = req.body;
        const len = items.length;

        if(len <= 0 || !user){
            return res.status(400).json({
                success: false,
                error: "undefined cannot be empty"
            });
        }
        
        for(let i=0; i<len; i++){

            const { channel, resi, sku, qty, rack } = items[i];

            // Validation: Required fields
            if (!resi || !sku || !rack || !qty || !channel || !user) {
                console.log("Missing required fields");
                console.log(`${channel}, ${resi}, ${sku}, ${qty}, ${rack}`)
                continue;
            }
    
            // Validation: resi not empty/whitespace
            if (resi.trim().length === 0) {
                console.log("Resi cannot be empty or whitespace");
                continue;
            }
    
            // Validation: qty must be positive number
            if (typeof qty !== 'number' || qty <= 0) {
                console.log("Qty must be a positive number greater than 0");
                continue;
            }
    
            // Validation: sku not empty
            if (sku.trim().length === 0) {
                console.log("SKU cannot be empty");
                continue;
            }
    
            // Atomic transaction: deduct stock + create outbound
            const result = await addOutbound({
                resi: resi,
                sku: sku,
                rak: rack,
                qty: qty,
                channel: channel,
                user: user,
            });
    
            if(!result.success){
                console.log(result.error);
                continue;
            }
        }
        return res.json({ success: true });
    }
    catch(error) {
        // Other errors
        res.status(500).json({
            success: false,
            error: "Server error: " + error.message
        });
    }
};

export const returAddHandler = async (req, res) => {
    try{
        const { inv, sku, rak, qty, channel, desc, user } = req.body;

        // Validation: Required fields
        if (!inv || !sku || !rak || !qty || !channel || !desc || !user){
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        const result = await addRetur({
            inv: inv,
            sku: sku,
            rak: rak,
            qty: qty,
            channel: channel,
            user: user,
            desc: desc,
        });

        if(!result.success){
            res.status(400).send(result);    
        }

        res.status(200).send({
            success: true
        });
    }
    catch(error){
        console.log(error);
    }
};

export const returAddsHandler = async (req, res) => {
    try {
        const { items, user } = req.body;
        const len = items.length;

        if(len <= 0 || !user){
            return res.status(400).json({
                success: false,
                error: "undefined cannot be empty"
            });
        }
        
        for(let i=0; i<len; i++){

            const { channel, invoice, sku, qty, reason, status, rack } = items[i];

            // Validation: Required fields
            if (!channel || !invoice || !sku || !qty || !reason || !status || !rack) {
                console.log(
                    `Missing required fields on item ${i}, fields found: \n 
                    ${channel}, ${invoice}, ${sku}, ${qty}, ${reason}, ${status}, ${rack}`);
                continue;
            }
    
            // Validation: qty must be positive number
            if (typeof qty !== 'number' || qty <= 0) {
                console.log(`Qty must be a positive number greater than 0, found on item ${i}`);
                continue;
            }
    
            // Validation: sku not empty
            if (sku.trim().length === 0) {
                console.log(`SKU cannot be empty on item ${i}`);
                continue;
            }

            // Status Validation ("return" | "reject")
            if(status !== "return" && status !== "reject"){
                console.log(`Item ${i} status cannot be ${status}`);
                continue;
            }
            const type = status.charAt(0).toUpperCase() + status.slice(1);
    
            // Atomic transaction: deduct stock + create outbound
            const result = await addRetur({
                inv: invoice,
                sku: sku,
                rak: rack,
                qty: qty,
                channel: channel,
                user: user,
                desc: reason,
                type: type
            });
    
            if(!result.success){
                console.log(`Error on item ${i}: ${result.error}`);
                continue;
            }
        }
        return res.json({ success: true });
    }
    catch(error) {
        // Other errors
        res.status(500).json({
            success: false,
            error: "Server error: " + error.message
        });
    }
};


/**
 * Firestore Get Logs / Audit trail / Warehouse Log
 * POST /firebase/logs
 * Body: { 
 *  "skuRak":String,
 *  "qty":int,
 *  "type":Stirng,
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const logHandler = async (req, res) => {
    try{
        let { start, search, type, order } = req.body;
        
        if(!start) start = 0;
        if(!order) order = "newest";
        
        const result = await getLogs(start, search, type, order);

        if(!result.success){
            res.status(400).send(result);
            return;
        }
        else if(!result.result){
            res.status(204).send({
                success: true,
                result: {
                    data:[],
                    max:0
                }
            });
            return;
        }
    
        res.status(200).send(result);
    }
    catch(error){
        res.status(500).send({
            success: false,
            error: 'Internal server error'
        });
    }
};

